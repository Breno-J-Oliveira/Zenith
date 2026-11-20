import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { ZenithAuthClient } from './auth/auth.controller';
import type { PrismaService } from './prisma.service';

function controllerWith(databaseAvailable: boolean, authAvailable: boolean) {
  const prisma = {
    user: {
      findFirst: async () => {
        if (!databaseAvailable) throw new Error('Internal database details');
        return null;
      },
    },
  } as unknown as PrismaService;
  const auth = {
    client: {
      health: async () => {
        if (!authAvailable) throw new Error('Internal authentication details');
        return { status: 'ok' };
      },
    },
  } as ZenithAuthClient;

  return new AppController(new AppService(), prisma, auth);
}

test('readiness accepts an empty database when both dependencies respond', async () => {
  assert.deepEqual(await controllerWith(true, true).getReadiness(), {
    status: 'ok',
    checks: { database: 'ok', auth: 'ok' },
  });
});

for (const [databaseAvailable, authAvailable] of [[false, true], [true, false], [false, false]]) {
  test(`readiness reports 503 when dependencies fail (db=${databaseAvailable}, auth=${authAvailable})`, async () => {
    const controller = controllerWith(databaseAvailable, authAvailable);
    const health = controller.getHealth();
    assert.ok('status' in health);
    assert.equal(health.status, 'ok');
    await assert.rejects(controller.getReadiness(), (error: unknown) => {
      assert.ok(error instanceof ServiceUnavailableException);
      assert.equal(error.getStatus(), 503);
      assert.deepEqual(error.getResponse(), {
        status: 'unavailable',
        checks: {
          database: databaseAvailable ? 'ok' : 'unavailable',
          auth: authAvailable ? 'ok' : 'unavailable',
        },
      });
      return true;
    });
  });
}
