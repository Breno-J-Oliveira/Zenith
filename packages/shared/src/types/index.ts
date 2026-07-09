export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  theme: string;
}

export interface Session {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthProvider {
  login(email: string, password: string): Promise<Session>;
  register(data: RegisterData): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  refreshToken(): Promise<Session>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}
