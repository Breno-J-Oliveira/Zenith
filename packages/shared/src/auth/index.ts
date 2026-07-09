import { AuthProvider, Session, User, RegisterData } from '../types';

export class MockAuthProvider implements AuthProvider {
  private session: Session | null = null;

  async login(email: string, password: string): Promise<Session> {
    // TODO(auth-hardening): substituir por NexusAuthProvider real
    // Mock implementation - always succeeds
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
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenith_session', JSON.stringify(this.session));
    }

    return this.session;
  }

  async register(data: RegisterData): Promise<Session> {
    // TODO(auth-hardening): substituir por NexusAuthProvider real
    return this.login(data.email, data.password);
  }

  async logout(): Promise<void> {
    // TODO(auth-hardening): substituir por NexusAuthProvider real
    this.session = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zenith_session');
    }
  }

  async getSession(): Promise<Session | null> {
    // TODO(auth-hardening): substituir por NexusAuthProvider real
    if (this.session) {
      return this.session;
    }

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
    // TODO(auth-hardening): substituir por NexusAuthProvider real
    if (!this.session) {
      throw new Error('No session to refresh');
    }
    this.session.expiresAt = new Date(Date.now() + 3600000);
    return this.session;
  }
}

export const authProvider = new MockAuthProvider();
