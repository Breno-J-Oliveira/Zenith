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
 * Tokens são guardados IN-MEMORY por defeito (mais seguro contra XSS).
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  NexusAuthClient,
  NexusUser,
  AuthTokens,
  NexusAuthError,
} from '@zenith/shared';
import { loadTokens, saveTokens } from '@zenith/shared';

const REFRESH_THRESHOLD_MS = 30 * 1000; // refresh 30s antes de expirar

interface AuthState {
  user: NexusUser | null;
  tokens: AuthTokens | null;
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
const ZENITH_API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3002';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' ||
    /^\/(login|register|forgot-password|reset-password|verify-email|auth\/callback)(\/|$)/.test(pathname ?? '');
  const clientRef = useRef<NexusAuthClient>(new NexusAuthClient({ baseUrl: NEXUS_AUTH_URL }));

  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const [nexusHealthy, setNexusHealthy] = useState<boolean | null>(null);

  // ─── Helpers internos ───────────────────────────────────────────

  const loadTokensSafe = useCallback((): AuthTokens | null => {
    try {
      const raw = loadTokens();
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const saveTokensSafe = useCallback((tokens: AuthTokens | null) => {
    saveTokens(tokens ? JSON.stringify(tokens) : null);
    if (typeof document !== 'undefined') {
      // O middleware usa apenas o marcador. A API valida o JWT em cada rota.
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = tokens
        ? `zenith_auth=authenticated; Path=/; SameSite=Lax${secure}`
        : `zenith_auth=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    }
  }, []);

  const clearAuth = useCallback(() => {
    saveTokensSafe(null);
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }, [saveTokensSafe]);

  /** Faz um GET ao Zenith com o Bearer token; devolve o user sincronizado */
  const fetchZenithUser = useCallback(async (accessToken: string): Promise<NexusUser | null> => {
    try {
      const res = await fetch(`${ZENITH_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const tokens = loadTokensSafe();
    if (!tokens) return;

    try {
      const user = await fetchZenithUser(tokens.accessToken);
      if (user) {
        setState((prev) => ({ ...prev, user, isAuthenticated: true, loading: false }));
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }, [loadTokensSafe, fetchZenithUser, clearAuth]);

  // Agenda refresh automático do access token
  const scheduleRefresh = useCallback(
    (tokens: AuthTokens) => {
      try {
        const payloadText = tokens.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadText));
        const expMs = payload.exp * 1000;
        const delay = expMs - Date.now() - REFRESH_THRESHOLD_MS;
        if (delay <= 0) return;

        const timeoutId = setTimeout(async () => {
          const isCurrentSession = () => loadTokensSafe()?.refreshToken === tokens.refreshToken;
          if (!isCurrentSession()) return;
          try {
            const newTokens = await clientRef.current.refresh(tokens.refreshToken);
            if (!isCurrentSession()) return;
            saveTokensSafe(newTokens);
            setState((prev) => ({ ...prev, tokens: newTokens }));
            scheduleRefresh(newTokens);
          } catch {
            if (isCurrentSession()) clearAuth();
          }
        }, delay);
        return () => clearTimeout(timeoutId);
      } catch {
        // Token malformado
      }
    },
    [loadTokensSafe, saveTokensSafe, clearAuth],
  );

  // ─── Ações públicas ───────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const tokens = await clientRef.current.login({ email, password });
        const user = await fetchZenithUser(tokens.accessToken);
        if (!user) {
          throw new Error('O Zenith não conseguiu confirmar a sessão. Tente entrar novamente.');
        }
        saveTokensSafe(tokens);
        setState({
          user,
          tokens,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        scheduleRefresh(tokens);
      } catch (err) {
        const message =
          err instanceof NexusAuthError ? err.message : (err as Error)?.message || 'Login falhou';
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          loading: false,
          error: message,
        });
        throw err;
      }
    },
    [fetchZenithUser, saveTokensSafe, scheduleRefresh],
  );

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
    const tokens = loadTokensSafe();
    if (tokens) {
      try {
        await clientRef.current.logout(tokens.refreshToken, tokens.accessToken);
      } catch {
        // Ignorar erros de logout
      }
    }
    clearAuth();
    router.push('/login');
  }, [loadTokensSafe, clearAuth, router]);

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

  // No mount, tenta restaurar sessão a partir dos tokens em memória
  useEffect(() => {
    const tokens = loadTokensSafe();
    if (!tokens) {
      saveTokensSafe(null);
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    refreshUser();
    const cleanup = scheduleRefresh(tokens);
    return cleanup;
  }, [loadTokensSafe, refreshUser, saveTokensSafe, scheduleRefresh]);

  // Redireciona para /login se não autenticado e tentar aceder a rota protegida
  useEffect(() => {
    if (state.loading) return;
    if (!state.isAuthenticated && !isPublicRoute) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/login/?next=${encodeURIComponent(next)}`);
    }
  }, [state.loading, state.isAuthenticated, isPublicRoute, pathname, router]);

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
      {isPublicRoute || state.isAuthenticated
        ? children
        : <p role="status" className="p-6">Verificando sessão…</p>}
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
