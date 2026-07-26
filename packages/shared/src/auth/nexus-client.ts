/**
 * NexusAuthClient — Cliente HTTP para o serviço de autenticação NexusAuth.
 *
 * Faz chamadas diretas via fetch (sem dependências adicionais) para os
 * endpoints REST expostos pelo NexusAuth em `apps/auth-service`.
 *
 * Endpoints consumidos (ver apps/auth-service/src/modules/auth/auth.controller.ts):
 *   POST /auth/register        { email, password, name } → { id, email, name }
 *   POST /auth/login           { email, password }        → { accessToken, refreshToken, sessionId }
 *   POST /auth/refresh         { refreshToken }           → { accessToken, refreshToken, sessionId }
 *   POST /auth/logout          { refreshToken }           → 204
 *   GET  /auth/me                                          → { id, email, name, role }
 *   POST /auth/verify-email    { token }                  → 200
 *   POST /auth/forgot-password { email }                  → 200
 *   POST /auth/reset-password  { token, password }        → 200
 *   POST /auth/magic-link      { email }                  → 200
 *   POST /auth/magic-link/verify { token }                → { accessToken, refreshToken }
 *   POST /auth/change-password { currentPassword, newPassword } → 200
 *   GET  /sessions                                        → SessionInfo[]
 *   DELETE /sessions/:id                                 → 204
 */

export interface NexusUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastActiveAt?: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
  active: boolean;
  current?: boolean;
}

export interface NexusAuthClientOptions {
  baseUrl: string;
  /** Timeout em ms (default: 10000) */
  timeout?: number;
}

export class NexusAuthError extends Error {
  status: number;
  code?: string;
  body?: any;

  constructor(message: string, status: number, code?: string, body?: any) {
    super(message);
    this.name = 'NexusAuthError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class NexusAuthClient {
  private baseUrl: string;
  private timeout: number;

  constructor(opts: NexusAuthClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.timeout = opts.timeout ?? 10000;
  }

  // ─── Autenticação ──────────────────────────────────────────────

  async register(input: { email: string; password: string; name: string }): Promise<{ id: string; email: string; name: string }> {
    return this.request('POST', '/auth/register', input);
  }

  async login(input: { email: string; password: string }): Promise<AuthTokens> {
    const res = await this.request<{ accessToken: string; refreshToken: string; sessionId?: string }>(
      'POST',
      '/auth/login',
      input,
    );
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await this.request<{ accessToken: string; refreshToken: string; sessionId?: string }>(
      'POST',
      '/auth/refresh',
      { refreshToken },
    );
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
    };
  }

  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    await this.request('POST', '/auth/logout', { refreshToken }, headers);
  }

  async me(accessToken: string): Promise<NexusUser> {
    return this.request<NexusUser>('GET', '/auth/me', undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.request('POST', '/auth/verify-email', { token });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request('POST', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.request('POST', '/auth/reset-password', { token, password });
  }

  async requestMagicLink(email: string): Promise<void> {
    await this.request('POST', '/auth/magic-link', { email });
  }

  async verifyMagicLink(token: string): Promise<AuthTokens> {
    const res = await this.request<{ accessToken: string; refreshToken: string }>(
      'POST',
      '/auth/magic-link/verify',
      { token },
    );
    return { accessToken: res.accessToken, refreshToken: res.refreshToken };
  }

  async changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.request('POST', '/auth/change-password', { currentPassword, newPassword }, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  // ─── Sessões ───────────────────────────────────────────────────

  async getSessions(accessToken: string): Promise<SessionInfo[]> {
    return this.request<SessionInfo[]>('GET', '/sessions', undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  async revokeSession(accessToken: string, sessionId: string): Promise<void> {
    await this.request('DELETE', `/sessions/${sessionId}`, undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
  }

  // ─── JWKS (chave pública) ─────────────────────────────────────

  /** Retorna a chave pública para validar JWTs (usado pelo backend) */
  async getJwks(): Promise<{ keys: any[] }> {
    return this.request('GET', '/.well-known/jwks.json');
  }

  /** Verifica a saúde do serviço (health check) */
  async health(): Promise<any> {
    return this.request('GET', '/health');
  }

  // ─── HTTP interno ──────────────────────────────────────────────

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(extraHeaders || {}),
    };

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text();
      const data = text ? safeJsonParse(text) : null;

      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          res.statusText ||
          `HTTP ${res.status}`;
        throw new NexusAuthError(
          typeof message === 'string' ? message : JSON.stringify(message),
          res.status,
          data?.code,
          data,
        );
      }

      return data as T;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof NexusAuthError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new NexusAuthError('Request timeout', 0, 'TIMEOUT');
      }
      throw new NexusAuthError(
        (err as Error)?.message || 'Network error',
        0,
        'NETWORK',
      );
    }
  }
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
