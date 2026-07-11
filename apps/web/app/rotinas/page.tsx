'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';

interface Routine {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  duration: number;
  active: boolean;
  adaptable: boolean;
  createdAt: string;
}

const API = 'http://localhost:3002';

const frequencyLabels: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const frequencyIcons: Record<string, React.ReactNode> = {
  daily: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  weekly: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  monthly: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="10" y1="14" x2="14" y2="14" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  ),
};

export default function RotinasPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoutine, setNewRoutine] = useState({ title: '', frequency: 'daily', time: '08:00', duration: '60' });
  const [generatedInfo, setGeneratedInfo] = useState<string | null>(null);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/routines`);
      const data = await res.json();
      setRoutines(data);
    } catch {
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutine.title.trim()) return;
    try {
      await fetch(`${API}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRoutine.title,
          frequency: newRoutine.frequency,
          time: newRoutine.time,
          duration: parseInt(newRoutine.duration) || 60,
        }),
      });
      setNewRoutine({ title: '', frequency: 'daily', time: '08:00', duration: '60' });
      setShowCreateForm(false);
      fetchRoutines();
    } catch { /* ignore */ }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await fetch(`${API}/routines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      fetchRoutines();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/routines/${id}`, { method: 'DELETE' });
      fetchRoutines();
    } catch { /* ignore */ }
  };

  const handleGenerateTasks = async (id: string) => {
    try {
      const res = await fetch(`${API}/routines/${id}/generate-tasks?days=7`, { method: 'POST' });
      const tasks = await res.json();
      setGeneratedInfo(`${tasks.length} tarefa(s) gerada(s) para os próximos 7 dias`);
      setTimeout(() => setGeneratedInfo(null), 4000);
    } catch { /* ignore */ }
  };

  const activeRoutines = routines.filter(r => r.active).length;
  const totalMinutes = routines.filter(r => r.active).reduce((acc, r) => acc + r.duration, 0);

  return (
    <ShellLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-success-glow)] text-[var(--color-success)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Rotinas</h1>
              <p className="text-[var(--color-text-dim)] text-sm">{activeRoutines} ativas · {totalMinutes}min/dia</p>
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
            {showCreateForm ? 'Cancelar' : 'Nova Rotina'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="card p-6 mb-6 hud-border animate-slide-in-up">
            <h3 className="font-orbitron text-sm font-bold text-[var(--color-success)] mb-4 tracking-wider">NOVA ROTINA</h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">TÍTULO</label>
                <input
                  type="text"
                  value={newRoutine.title}
                  onChange={e => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Estudar React"
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">FREQUÊNCIA</label>
                  <select
                    value={newRoutine.frequency}
                    onChange={e => setNewRoutine(prev => ({ ...prev, frequency: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">HORÁRIO</label>
                  <input
                    type="time"
                    value={newRoutine.time}
                    onChange={e => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">DURAÇÃO (min)</label>
                  <input
                    type="number"
                    value={newRoutine.duration}
                    onChange={e => setNewRoutine(prev => ({ ...prev, duration: e.target.value }))}
                    min="5"
                    step="5"
                    className="input w-full"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Criar Rotina
              </button>
            </div>
          </form>
        )}

        {/* Success Message */}
        {generatedInfo && (
          <div className="card p-4 mb-6 border-[var(--color-success)]/50 bg-[rgba(47,198,62,0.05)] animate-slide-in-up">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-[var(--color-success)]/20 text-[var(--color-success)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-success)] font-medium">{generatedInfo}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-success)] animate-spin mb-4" />
            <p className="text-[var(--color-text-dim)] text-sm">Carregando rotinas...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="card p-12 text-center hud-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="font-orbitron text-lg text-[var(--color-text)] mb-2">Nenhuma rotina</p>
            <p className="text-[var(--color-text-dim)] text-sm mb-4">Clique em "Nova Rotina" para criar um hábito.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routines.map((routine, index) => (
              <div
                key={routine.id}
                className={`
                  card p-5 group transition-all duration-200
                  ${routine.active ? '' : 'opacity-60'}
                  hover:border-[var(--border-strong)]
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status indicator */}
                    <div className={`
                      w-3 h-3 rounded-full shrink-0 transition-all
                      ${routine.active
                        ? 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success-glow)]'
                        : 'bg-[var(--color-surface-3)]'
                      }
                    `} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-orbitron text-lg font-bold text-[var(--color-text)] truncate">
                        {routine.title}
                      </h3>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-primary">
                      {frequencyIcons[routine.frequency]}
                      {frequencyLabels[routine.frequency]}
                    </span>
                    <span className="font-mono text-xs px-2 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
                      {routine.time}
                    </span>
                    <span className="font-mono text-xs px-2 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
                      {routine.duration}min
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(routine.id, routine.active)}
                    className={`
                      btn text-xs py-1.5 px-3
                      ${routine.active
                        ? 'btn-secondary border-[var(--color-success)]/50 text-[var(--color-success)]'
                        : 'btn-secondary text-[var(--color-text-dim)]'
                      }
                    `}
                  >
                    {routine.active ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        ATIVA
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="10" y1="15" x2="10" y2="9" />
                          <line x1="14" y1="15" x2="14" y2="9" />
                        </svg>
                        PAUSADA
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleGenerateTasks(routine.id)}
                    className="btn btn-secondary text-xs py-1.5 px-3"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Gerar 7 dias
                  </button>

                  <button
                    onClick={() => handleDelete(routine.id)}
                    className="ml-auto btn btn-ghost text-xs py-1.5 px-3 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}