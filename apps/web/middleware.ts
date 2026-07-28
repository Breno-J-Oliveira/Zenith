/**
 * Middleware Next.js para proteção de rotas no frontend.
 *
 * Redireciona utilizadores não autenticados para /login.
 * Permite rotas públicas: /, /login, /register, /forgot-password,
 * /reset-password/*, /verify-email/*.
 *
 * Para produção, o ideal é mover a lógica de auth para o backend
 * (BFF) e usar httpOnly cookies. Por agora, usamos o token store
 * in-memory (não persistente — o user terá de fazer login de novo
 * após refresh).
 *
 * ATENÇÃO: Middleware Next.js corre no Edge runtime. Não podemos
 * usar o token store em memória aqui. Por isso, esta é uma proteção
 * "best-effort" via cookie. Para proteção real, ver Fase 9 futura
 * (BFF com httpOnly cookie).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
];

const PUBLIC_PREFIXES = [
  '/verify-email/',
  '/reset-password/',
  '/auth/callback',
  '/_next',
  '/api',
  '/favicon',
  '/assets',
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — deixar passar
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verifica se há um cookie de auth (set pelo AuthProvider após login)
  // NOTA: tokens estão em memória, não em cookies, então este check
  // é apenas uma otimização. O AuthProvider no client-side faz o
  // redirect real se não estiver autenticado.
  const authCookie = request.cookies.get('zenith_auth');

  if (!authCookie) {
    // Não autenticado — redireciona para /login com callback
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher: aplica-se a todas as rotas EXCETO as públicas.
 * O AuthProvider no client-side faz a validação real do token.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     * - /login, /register (handled by AuthProvider)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
