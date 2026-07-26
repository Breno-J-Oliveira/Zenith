/**
 * Auth module — NexusAuth client + token store + legacy mock.
 *
 * Este módulo é a porta de entrada para tudo relacionado com auth no
 * frontend. O componente `AuthProvider` em `apps/web` consome o
 * `NexusAuthClient` daqui.
 *
 * Para usar:
 *   import { NexusAuthClient, loadTokens, saveTokens } from '@zenith/shared';
 *
 * Sub-componentes:
 *  - `NexusAuthClient` — cliente HTTP para o NexusAuth
 *  - `NexusAuthError`   — classe de erro tipada
 *  - `loadTokens` / `saveTokens` — token store (in-memory por defeito)
 *  - Tipos: `NexusUser`, `AuthTokens`, `SessionInfo`
 *
 * O `MockAuthProvider` antigo é mantido para retrocompatibilidade (não
 * é usado em runtime; o `AuthProvider` da web foi reescrito).
 */

export {
  NexusAuthClient,
  NexusAuthError,
  type NexusUser,
  type AuthTokens,
  type SessionInfo,
  type NexusAuthClientOptions,
} from './nexus-client';

export { loadTokens, saveTokens, setTokenStoreMode, getTokenStoreMode } from './token-store';

// Legacy mock — mantido apenas para retrocompatibilidade do tipo
// `AuthProvider` que vinha das versões anteriores. Não usar em runtime.
import { AuthProvider, Session, User, RegisterData } from '../types';

export class MockAuthProvider implements AuthProvider {
  private session: Session | null = null;

  async login(email: string, password: string): Promise<Session> {
    const user: User = {
      id: 'mock-user-id',
      email,
      name: email.split('@')[0],
      theme: 'red',
    };

    this.session = {
      user,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('zenith_session', JSON.stringify(this.session));
    }
    return this.session;
  }

  async register(data: RegisterData): Promise<Session> {
    return this.login(data.email, data.password);
  }

  async logout(): Promise<void> {
    this.session = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zenith_session');
    }
  }

  async getSession(): Promise<Session | null> {
    if (this.session) return this.session;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zenith_session');
      if (stored) {
        this.session = JSON.parse(stored);
        return this.session;
      }
    }
    return null;
  }

  async refreshToken(): Promise<Session> {
    if (!this.session) throw new Error('No session to refresh');
    this.session.expiresAt = new Date(Date.now() + 3600000);
    return this.session;
  }
}

export const authProvider = new MockAuthProvider();
