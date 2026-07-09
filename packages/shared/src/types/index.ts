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

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export type GoalCategory = 'pessoal' | 'trabalho' | 'financeiro' | 'saude' | 'estudo';

export type TaskStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  goalId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  date?: string;
  completed: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: 'baixa' | 'media' | 'alta';
  status: GoalStatus;
  deadline?: string;
  milestones: Milestone[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  category?: GoalCategory;
  priority?: 'baixa' | 'media' | 'alta';
  deadline?: string;
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  category?: GoalCategory;
  priority?: 'baixa' | 'media' | 'alta';
  status?: GoalStatus;
  deadline?: string;
}

export interface CreateMilestoneDTO {
  title: string;
  deadline?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  goalId?: string;
  milestoneId?: string;
  date?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  completed?: boolean;
  date?: string;
}
