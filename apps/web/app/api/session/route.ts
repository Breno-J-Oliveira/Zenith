import { NextRequest, NextResponse } from 'next/server';
import { NexusAuthClient, NexusAuthError, type AuthTokens } from '@zenith/shared';

const nexus = new NexusAuthClient({
  baseUrl: process.env.NEXUS_AUTH_URL || process.env.NEXT_PUBLIC_NEXUS_AUTH_URL || 'http://localhost:3000',
});
const api = process.env.ZENITH_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const path = '/api/session';
const accessCookie = 'zenith_access';
const refreshCookie = 'zenith_refresh';
const lifetime = 7 * 24 * 60 * 60;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function cookies(request: NextRequest, response: NextResponse, tokens?: AuthTokens) {
  const secure = process.env.ZENITH_WEB_ORIGIN
    ? new URL(process.env.ZENITH_WEB_ORIGIN).protocol === 'https:'
    : request.nextUrl.protocol === 'https:';
  const options = { httpOnly: true, secure, sameSite: 'lax' as const, maxAge: tokens ? lifetime : 0 };
  response.cookies.set(accessCookie, tokens?.accessToken ?? '', { ...options, path });
  response.cookies.set(refreshCookie, tokens?.refreshToken ?? '', { ...options, path });
  response.cookies.set('zenith_auth', tokens ? 'authenticated' : '', { ...options, path: '/' });
  return response;
}

async function profile(accessToken: string) {
  return fetch(api + '/auth/me', {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
}

export async function POST(request: NextRequest) {
  const expectedOrigin = process.env.ZENITH_WEB_ORIGIN ||
    `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (request.headers.get('origin') !== expectedOrigin) {
    return reply({ message: 'Origem inválida.' }, 403);
  }

  const input = await request.json().catch(() => null);
  let access = request.cookies.get(accessCookie)?.value;
  const refresh = request.cookies.get(refreshCookie)?.value;

  try {
    if (input?.action === 'login') {
      if (typeof input.email !== 'string' || typeof input.password !== 'string') {
        return reply({ message: 'Informe e-mail e senha.' }, 400);
      }
      const tokens = await nexus.login({ email: input.email, password: input.password });
      if (!tokens.accessToken || !tokens.refreshToken) {
        return reply({ message: 'O login exige uma etapa adicional.' }, 401);
      }
      const user = await profile(tokens.accessToken);
      if (!user.ok) return reply({ message: 'Não foi possível confirmar a sessão.' }, 503);
      return cookies(request, reply({ user: await user.json(), accessToken: tokens.accessToken }), tokens);
    }

    const logout = input?.action === 'logout';
    if (!logout && input?.action !== 'restore') return reply({ message: 'Ação inválida.' }, 400);
    if (!refresh) return cookies(request, reply(null, logout ? 200 : 401));

    let user = access ? await profile(access) : null;
    let rotated: AuthTokens | undefined;
    // O perfil já validou a assinatura antes de usarmos a expiração para agendar a rotação.
    const exp = user?.ok && access
      ? JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString()).exp
      : null;
    if (!user || user.status === 401 || (!logout && exp && exp * 1000 < Date.now() + 35_000)) {
      rotated = await nexus.refresh(refresh);
      access = rotated.accessToken;
      // Preserva a rotação também se o Zenith falhar ao ler o perfil.
      user = await profile(access).catch(() => new Response(null, { status: 503 }));
    }
    if (logout && access) {
      try {
        await nexus.logout(rotated?.refreshToken ?? refresh, access);
      } catch (error) {
        if (!(error instanceof NexusAuthError && error.status === 401)) {
          const pending = reply({ message: 'Não foi possível encerrar a sessão. Tente novamente.' }, 503);
          return rotated ? cookies(request, pending, rotated) : pending;
        }
      }
      return cookies(request, reply(null));
    }
    if (!user.ok) {
      if (user.status === 401) return cookies(request, reply(null, 401));
      const unavailable = reply({ message: 'Não foi possível restaurar a sessão. Tente novamente.' }, 503);
      return rotated ? cookies(request, unavailable, rotated) : unavailable;
    }
    const response = reply({ user: await user.json(), accessToken: access });
    return rotated ? cookies(request, response, rotated) : response;
  } catch (error) {
    if (error instanceof NexusAuthError && error.status >= 400 && error.status < 500) {
      const response = reply({ message: error.message }, error.status);
      return input?.action !== 'login' && error.status === 401 ? cookies(request, response) : response;
    }
    return reply({ message: 'Autenticação indisponível. Tente novamente.' }, 503);
  }
}
