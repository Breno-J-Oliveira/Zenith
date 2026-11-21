'use client';

/**
 * AuthProvider — Provider de autenticação integrado com NexusAuth.
 *
 * Substitui o antigo MockAuthProvider. Comunica com o NexusAuth via
 * o cliente `NexusAuthClient` (de `@zenith/shared`).
 *
 * Funcionalidades:
 *  - Login / Register / Logout
 *  - Refresh automático do access token antes de expirar
 *  - Verificação do user atual (GET /auth/me no Zenith, com Bearer token)
 *  - Estado partilhado via React Context
 *
 * Configuração:
 *   NEXT_PUBLIC_NEXUS_AUTH_URL=http://localhost:3000   (URL do NexusAuth)
 *   NEXT_PUBLIC_API_URL=http://localhost:3002           (URL do Zenith backend)
 *
 * O refresh token fica em cookie HttpOnly. O access token usado pela API fica em memória.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  NexusAuthClient,
  NexusUser,
  NexusAuthError,
} from '@zenith/shared';
import { saveTokens } from '@zenith/shared';

import { requestWebSession, type WebSession } from '@/lib/web-session';

interface AuthState {
  user: NexusUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** True se o backend tem o NexusAuth configurado e operacional */
  nexusHealthy: boolean | null;
  /** URL do NexusAuth para o frontend (pode ser usada para links de OAuth) */
  nexusAuthUrl: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NEXUS_AUTH_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_NEXUS_AUTH_URL) ||
  'http://localhost:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' ||
    /^\/(login|register|forgot-password|reset-password|verify-email|auth\/callback)(\/|$)/.test(pathname ?? '');
  const clientRef = useRef<NexusAuthClient>(new NexusAuthClient({ baseUrl: NEXUS_AUTH_URL }));

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const [nexusHealthy, setNexusHealthy] = useState<boolean | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const applySession = useCallback((session: WebSession | null) => {
    clearTimeout(timer.current);
    saveTokens(session ? JSON.stringify({ accessToken: session.accessToken }) : null);
    setState({ user: session?.user ?? null, isAuthenticated: !!session, loading: false, error: null });
  }, []);

  const refreshUser = useCallback(async function restore() {
    try {
      const session = await requestWebSession({ action: 'restore' });
      applySession(session);
      if (session) timer.current = setTimeout(restore, 30_000);
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Não foi possível confirmar a sessão.' }));
      timer.current = setTimeout(restore, 30_000);
    }
  }, [applySession]);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const session = await requestWebSession({ action: 'login', email, password });
      applySession(session);
      timer.current = setTimeout(refreshUser, 30_000);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: (error as Error).message }));
      throw error;
    }
  }, [applySession, refreshUser]);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await clientRef.current.register({ email, password, name });
        // Após registo, faz login automaticamente
        await login(email, password);
      } catch (err) {
        const message =
          err instanceof NexusAuthError ? err.message : (err as Error)?.message || 'Registo falhou';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await requestWebSession({ action: 'logout' });
      applySession(null);
      router.push('/login/');
    } catch {
      setState(prev => ({ ...prev, error: 'Não foi possível sair. Tente novamente.' }));
    }
  }, [applySession, router]);

  // ─── Efeitos ──────────────────────────────────────────────────

  // Verifica se o NexusAuth está operacional (1x no mount)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${NEXUS_AUTH_URL}/health`, { cache: 'no-store' });
        if (!cancelled) setNexusHealthy(res.ok);
      } catch {
        if (!cancelled) setNexusHealthy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshUser();
    return () => clearTimeout(timer.current);
  }, [refreshUser]);

  // Redireciona para /login se não autenticado e tentar aceder a rota protegida
  useEffect(() => {
    if (state.loading || state.error) return;
    if (!state.isAuthenticated && !isPublicRoute) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/login/?next=${encodeURIComponent(next)}`);
    }
  }, [state.loading, state.isAuthenticated, isPublicRoute, state.error, pathname, router]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    nexusHealthy,
    nexusAuthUrl: NEXUS_AUTH_URL,
  };

  return (
    <AuthContext.Provider value={value}>
      {state.isAuthenticated && state.error && <p role="alert">{state.error}</p>}
      {isPublicRoute || state.isAuthenticated
        ? <React.Fragment key={state.user?.id ?? 'public'}>{children}</React.Fragment>
        : <p role="status" className="p-6">{state.error ?? 'Verificando sessão…'}</p>}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return ctx;
}
