'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShellLayout } from '../../components/ShellLayout';

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

const priorityColors: Record<string, string> = {
  alta: 'var(--color-primary)',
  media: 'var(--color-text-dim)',
  baixa: 'var(--color-surface-2)',
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

  const handleAddMilestone = async (goalId: string) => {
    const title = newMilestone[goalId];
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

  const handleAddTask = async (goalId: string) => {
    const title = newTask[goalId];
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

  return (
    <ShellLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-orbitron text-2xl font-bold">Metas</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-white font-orbitron font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm"
          >
            {showCreateForm ? 'Cancelar' : '+ Nova Meta'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateGoal} className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6 mb-6 space-y-4">
            <div>
              <label className="font-mono text-xs text-dim block mb-1">TÍTULO</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Entregar TCC"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
                autoFocus
              />
            </div>
            <div>
              <label className="font-mono text-xs text-dim block mb-1">DESCRIÇÃO (opcional)</label>
              <input
                type="text"
                value={newGoal.description}
                onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Escrever e defender o trabalho de conclusão"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-dim block mb-1">CATEGORIA</label>
                <select
                  value={newGoal.category}
                  onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-dim block mb-1">PRIORIDADE</label>
                <select
                  value={newGoal.priority}
                  onChange={e => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-dim block mb-1">DEADLINE (opcional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <button type="submit" className="bg-primary text-white font-orbitron font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity">
              Criar Meta
            </button>
          </form>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
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
            className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Todas categorias</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Goals list */}
        {loading ? (
          <div className="text-dim text-center py-12">Carregando...</div>
        ) : goals.length === 0 ? (
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-12 text-center">
            <p className="font-orbitron text-xl text-dim mb-2">Nenhuma meta</p>
            <p className="text-dim text-sm">Clique em "+ Nova Meta" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = calcProgress(goal);
              const isExpanded = expandedGoal === goal.id;
              return (
                <div key={goal.id} className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg overflow-hidden">
                  {/* Goal header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ background: priorityColors[goal.priority] || 'var(--color-text-dim)' }}
                          />
                          <h3 className="font-orbitron text-lg font-bold truncate">{goal.title}</h3>
                        </div>
                        {goal.description && <p className="text-sm text-dim truncate">{goal.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
                          {categoryLabels[goal.category] || goal.category}
                        </span>
                        <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
                          {statusLabels[goal.status] || goal.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-dim shrink-0">{progress}%</span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-dim font-mono">
                      <span>{goal.milestones.length} marcos</span>
                      <span>{goal.tasks.length} tarefas</span>
                      {goal.deadline && <span>Deadline: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-surface-2)] p-5 space-y-4 bg-[var(--color-bg)]">
                      {/* Status controls */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-dim">STATUS:</span>
                        {['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'].map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(goal.id, s)}
                            className={`font-mono text-xs px-2 py-1 rounded border transition-colors ${
                              goal.status === s
                                ? 'border-[var(--color-primary)] text-primary'
                                : 'border-[var(--color-surface-2)] text-dim hover:text-white'
                            }`}
                          >
                            {statusLabels[s]}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="ml-auto font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim hover:text-red-400 hover:border-red-400 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>

                      {/* Milestones */}
                      <div>
                        <p className="font-mono text-xs text-dim mb-2">MARCOS</p>
                        {goal.milestones.length === 0 ? (
                          <p className="text-sm text-dim mb-2">Nenhum marco ainda.</p>
                        ) : (
                          <div className="space-y-1 mb-2">
                            {goal.milestones.map(ms => (
                              <div key={ms.id} className="flex items-center gap-2 group">
                                <button
                                  onClick={() => handleToggleMilestone(goal.id, ms.id)}
                                  className={`w-4 h-4 rounded border shrink-0 transition-colors ${
                                    ms.completed
                                      ? 'bg-primary border-primary'
                                      : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
                                  }`}
                                >
                                  {ms.completed && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-sm flex-1 ${ms.completed ? 'line-through text-dim' : 'text-white'}`}>
                                  {ms.title}
                                </span>
                                {ms.deadline && <span className="font-mono text-xs text-dim">{new Date(ms.deadline).toLocaleDateString('pt-BR')}</span>}
                                <button
                                  onClick={() => handleDeleteMilestone(goal.id, ms.id)}
                                  className="text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMilestone[goal.id] || ''}
                            onChange={e => setNewMilestone(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMilestone(goal.id); } }}
                            placeholder="Novo marco..."
                            className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-1.5 text-sm text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
                          />
                          <button
                            onClick={() => handleAddMilestone(goal.id)}
                            className="font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-primary hover:border-[var(--color-primary)] transition-colors"
                          >
                            + Marco
                          </button>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div>
                        <p className="font-mono text-xs text-dim mb-2">TAREFAS</p>
                        {goal.tasks.length === 0 ? (
                          <p className="text-sm text-dim mb-2">Nenhuma tarefa vinculada.</p>
                        ) : (
                          <div className="space-y-1 mb-2">
                            {goal.tasks.map(task => (
                              <div key={task.id} className="flex items-center gap-2 group">
                                <button
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`w-4 h-4 rounded border shrink-0 transition-colors ${
                                    task.completed
                                      ? 'bg-primary border-primary'
                                      : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
                                  }`}
                                >
                                  {task.completed && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-sm flex-1 ${task.completed ? 'line-through text-dim' : 'text-white'}`}>
                                  {task.title}
                                </span>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTask[goal.id] || ''}
                            onChange={e => setNewTask(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(goal.id); } }}
                            placeholder="Nova tarefa..."
                            className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-1.5 text-sm text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
                          />
                          <button
                            onClick={() => handleAddTask(goal.id)}
                            className="font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-primary hover:border-[var(--color-primary)] transition-colors"
                          >
                            + Tarefa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
