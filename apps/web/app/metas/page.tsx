'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { GoalCard } from '../../components/goals/GoalCard';

interface Milestone {
  id: string;
  goalId: string;
  title: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  goalId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status: string;
  date?: string;
  completed: boolean;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  deadline?: string;
  milestones: Milestone[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

const API = 'http://localhost:3002';

const categoryLabels: Record<string, string> = {
  pessoal: 'Pessoal',
  trabalho: 'Trabalho',
  financeiro: 'Financeiro',
  saude: 'Saúde',
  estudo: 'Estudo',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

function calcProgress(goal: Goal): number {
  const items = [...goal.milestones, ...goal.tasks];
  if (items.length === 0) return 0;
  const done = items.filter(i => i.completed).length;
  return Math.round((done / items.length) * 100);
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'pessoal', priority: 'media', deadline: '' });
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState<Record<string, string>>({});

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      const res = await fetch(`${API}/goals?${params}`);
      const data = await res.json();
      setGoals(data);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    try {
      const body: any = { title: newGoal.title };
      if (newGoal.description) body.description = newGoal.description;
      if (newGoal.category) body.category = newGoal.category;
      if (newGoal.priority) body.priority = newGoal.priority;
      if (newGoal.deadline) body.deadline = newGoal.deadline;
      await fetch(`${API}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setNewGoal({ title: '', description: '', category: 'pessoal', priority: 'media', deadline: '' });
      setShowCreateForm(false);
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await fetch(`${API}/goals/${id}`, { method: 'DELETE' });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`${API}/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleAddMilestone = async (goalId: string, title: string) => {
    if (!title?.trim()) return;
    try {
      await fetch(`${API}/goals/${goalId}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
      setNewMilestone(prev => ({ ...prev, [goalId]: '' }));
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    try {
      await fetch(`${API}/goals/${goalId}/milestones/${milestoneId}/toggle`, { method: 'PATCH' });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleDeleteMilestone = async (goalId: string, milestoneId: string) => {
    try {
      await fetch(`${API}/goals/${goalId}/milestones/${milestoneId}`, { method: 'DELETE' });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleAddTask = async (goalId: string, title: string) => {
    if (!title?.trim()) return;
    try {
      await fetch(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, goalId }) });
      setNewTask(prev => ({ ...prev, [goalId]: '' }));
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await fetch(`${API}/tasks/${taskId}/toggle`, { method: 'PATCH' });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`${API}/tasks/${taskId}`, { method: 'DELETE' });
      fetchGoals();
    } catch { /* ignore */ }
  };

  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
  const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + calcProgress(g), 0) / goals.length) 
    : 0;

  const priorityColors: Record<string, string> = {
    alta: 'var(--color-danger)',
    media: 'var(--color-warning)',
    baixa: 'var(--color-success)',
  };

  return (
    <ShellLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Metas</h1>
              <p className="text-[var(--color-text-dim)] text-sm">{activeGoals} ativas · {completedGoals} concluídas</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {showCreateForm ? 'Cancelar' : 'Nova Meta'}
          </button>
        </div>

        {/* Stats Overview */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Total</p>
              <p className="font-orbitron text-2xl font-bold text-[var(--color-text)]">{goals.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Em Progresso</p>
              <p className="font-orbitron text-2xl font-bold text-[var(--color-primary)]">{activeGoals}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Progresso Médio</p>
              <p className="font-orbitron text-2xl font-bold text-[var(--color-success)]">{avgProgress}%</p>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateGoal} className="card p-6 mb-6 hud-border animate-slide-in-up">
            <h3 className="font-orbitron text-sm font-bold text-[var(--color-primary)] mb-4 tracking-wider">NOVA META</h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">TÍTULO</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Entregar TCC"
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">DESCRIÇÃO (opcional)</label>
                <input
                  type="text"
                  value={newGoal.description}
                  onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Escrever e defender o trabalho de conclusão"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">CATEGORIA</label>
                  <select
                    value={newGoal.category}
                    onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full"
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">PRIORIDADE</label>
                  <select
                    value={newGoal.priority}
                    onChange={e => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">DEADLINE (opcional)</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Criar Meta
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input text-sm"
          >
            <option value="">Todos status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="COMPLETED">Concluída</option>
            <option value="PAUSED">Pausada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input text-sm"
          >
            <option value="">Todas categorias</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Goals list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-dim)] text-sm">Carregando metas...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="card p-12 text-center hud-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <p className="font-orbitron text-lg text-[var(--color-text)] mb-2">Nenhuma meta</p>
            <p className="text-[var(--color-text-dim)] text-sm mb-4">Clique em "Nova Meta" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const isExpanded = expandedGoal === goal.id;
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  onStatusChange={(status) => handleStatusChange(goal.id, status)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                  onAddMilestone={(title) => handleAddMilestone(goal.id, title)}
                  onToggleMilestone={(mid) => handleToggleMilestone(goal.id, mid)}
                  onDeleteMilestone={(mid) => handleDeleteMilestone(goal.id, mid)}
                  onAddTask={(title) => handleAddTask(goal.id, title)}
                  onToggleTask={(tid) => handleToggleTask(tid)}
                  onDeleteTask={(tid) => handleDeleteTask(tid)}
                  newMilestoneValue={newMilestone[goal.id] || ''}
                  onNewMilestoneChange={(v) => setNewMilestone(prev => ({ ...prev, [goal.id]: v }))}
                  newTaskValue={newTask[goal.id] || ''}
                  onNewTaskChange={(v) => setNewTask(prev => ({ ...prev, [goal.id]: v }))}
                />
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}