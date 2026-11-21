import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ServiceUnavailableException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { NexusAuthError } from '../../../../packages/shared/src/auth';
import { IS_PUBLIC_KEY, NexusAuthGuard } from './auth.guard';
import type { JwksService, NexusJwtPayload } from './jwks.service';
import type { UserSyncService } from './user-sync.service';
import { ZenithAuthClient } from './zenith-auth-client';

const profile = { id: 'user-1', email: 'fixture@example.com', name: 'Fixture', role: 'USER' };
const validPayload = { sub: profile.id, email: profile.email } as NexusJwtPayload;

function contextFor(handler: () => void, token = 'fixture-access') {
  const request = { headers: { authorization: `Bearer ${token}` }, user: undefined, zenithUser: undefined };
  const context = {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function makeGuard(nexus: ZenithAuthClient, verifyToken: JwksService['verifyToken']) {
  let syncs = 0;
  const user = { id: profile.id, email: profile.email, name: profile.name, theme: 'red' };
  const sync = {
    syncFromJwt: async () => {
      syncs++;
      return user;
    },
  } as unknown as UserSyncService;
  const jwks = { verifyToken } as unknown as JwksService;
  return {
    guard: new NexusAuthGuard(new Reflector(), jwks, sync, nexus),
    syncs: () => syncs,
  };
}

test('accepts a valid session and rejects it on a new request after revocation', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  let revoked = false;
  let queries = 0;
  nexus.client.me = async () => {
    queries++;
    if (revoked) throw new NexusAuthError('Session has been revoked', 401, 'SESSION_REVOKED');
    return profile;
  };
  const { guard, syncs } = makeGuard(nexus, async () => validPayload);
  const valid = contextFor(() => {});

  assert.equal(await guard.canActivate(valid.context), true);
  assert.equal(await guard.canActivate(valid.context), true);
  assert.equal(valid.request.user, validPayload);
  assert.equal(syncs(), 1);

  revoked = true;
  const expired = contextFor(() => {});
  await assert.rejects(guard.canActivate(expired.context), UnauthorizedException);
  assert.equal(expired.request.user, undefined);
  assert.equal(syncs(), 1);
  assert.equal(queries, 2);
});

test('does not consult NexusAuth or sync a user for public requests and invalid signatures', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  let signatureChecks = 0;
  nexus.client.me = async () => assert.fail('Unexpected session lookup');
  const { guard, syncs } = makeGuard(nexus, async () => {
    signatureChecks++;
    throw new Error('Invalid signature');
  });

  const publicHandler = () => {};
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, publicHandler);
  assert.equal(await guard.canActivate(contextFor(publicHandler).context), true);
  assert.equal(signatureChecks, 0);

  await assert.rejects(guard.canActivate(contextFor(() => {}).context), UnauthorizedException);
  assert.equal(signatureChecks, 1);
  assert.equal(syncs(), 0);
});

test('preserves a JWKS dependency failure as 503', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  nexus.client.me = async () => assert.fail('Unexpected session lookup');
  const { guard, syncs } = makeGuard(nexus, async () => {
    throw new ServiceUnavailableException();
  });

  await assert.rejects(guard.canActivate(contextFor(() => {}).context), ServiceUnavailableException);
  assert.equal(syncs(), 0);
});

test('coalesces only concurrent lookups and does not reuse a successful result', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  let finish: (user: typeof profile) => void;
  const pending = new Promise<typeof profile>(resolve => { finish = resolve; });
  let queries = 0;
  nexus.client.me = () => {
    queries++;
    return pending;
  };

  const first = nexus.assertActiveSession('shared', profile.id);
  const second = nexus.assertActiveSession('shared', profile.id);
  assert.equal(queries, 1);
  finish(profile);
  await Promise.all([first, second]);

  await nexus.assertActiveSession('shared', profile.id);
  assert.equal(queries, 2);
});

test('reports an auth outage as 503 and leaves the next request free to retry', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  nexus.client.me = async () => {
    throw new NexusAuthError('Timeout', 0);
  };
  const { guard, syncs } = makeGuard(nexus, async () => validPayload);

  await assert.rejects(guard.canActivate(contextFor(() => {}).context), ServiceUnavailableException);
  assert.equal(syncs(), 0);

  nexus.client.me = async () => profile;
  assert.equal(await guard.canActivate(contextFor(() => {}).context), true);
  assert.equal(syncs(), 1);
});

test('rejects a mismatched profile as 401 and an invalid upstream response as 503', async () => {
  const nexus = new ZenithAuthClient(new ConfigService());
  nexus.client.me = async () => profile;
  await assert.rejects(nexus.assertActiveSession('shared', 'another-user'), UnauthorizedException);

  nexus.client.me = async () => null;
  await assert.rejects(nexus.assertActiveSession('shared', profile.id), ServiceUnavailableException);
});
