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

export type AIIntent =
  | 'CREATE_GOAL'
  | 'CREATE_TASK'
  | 'LOG_EXPENSE'
  | 'CREATE_EVENT'
  | 'UNKNOWN';

export interface ExpensePayload {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface GoalPayload {
  title: string;
  deadline?: string;
  category: string;
}

export interface TaskPayload {
  title: string;
  date?: string;
}

export interface EventPayload {
  title: string;
  date: string;
  time?: string;
}

export type AIPayload = ExpensePayload | GoalPayload | TaskPayload | EventPayload | null;

export interface ParsedAIResult {
  intent: AIIntent;
  confidence: number;
  payload: AIPayload;
  rawText: string;
}

export interface AILogEntry {
  id: string;
  timestamp: string;
  input: string;
  result: ParsedAIResult;
}
