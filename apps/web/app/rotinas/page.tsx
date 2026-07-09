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

  return (
    <ShellLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-orbitron text-2xl font-bold">Rotinas</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-white font-orbitron font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm"
          >
            {showCreateForm ? 'Cancelar' : '+ Nova Rotina'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6 mb-6 space-y-4">
            <div>
              <label className="font-mono text-xs text-dim block mb-1">TÍTULO</label>
              <input
                type="text"
                value={newRoutine.title}
                onChange={e => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Estudar React"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-dim block mb-1">FREQUÊNCIA</label>
                <select
                  value={newRoutine.frequency}
                  onChange={e => setNewRoutine(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-dim block mb-1">HORÁRIO</label>
                <input
                  type="time"
                  value={newRoutine.time}
                  onChange={e => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-dim block mb-1">DURAÇÃO (min)</label>
                <input
                  type="number"
                  value={newRoutine.duration}
                  onChange={e => setNewRoutine(prev => ({ ...prev, duration: e.target.value }))}
                  min="5"
                  step="5"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <button type="submit" className="bg-primary text-white font-orbitron font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity">
              Criar Rotina
            </button>
          </form>
        )}

        {generatedInfo && (
          <div className="bg-primary/10 border border-[var(--color-primary)] rounded-lg p-3 mb-4 font-mono text-sm text-primary">
            {generatedInfo}
          </div>
        )}

        {loading ? (
          <div className="text-dim text-center py-12">Carregando...</div>
        ) : routines.length === 0 ? (
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-12 text-center">
            <p className="font-orbitron text-xl text-dim mb-2">Nenhuma rotina</p>
            <p className="text-dim text-sm">Clique em "+ Nova Rotina" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map(routine => (
              <div key={routine.id} className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${routine.active ? 'bg-primary' : 'bg-[var(--color-surface-2)]'}`}
                      />
                      <h3 className="font-orbitron text-lg font-bold truncate">{routine.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
                      {frequencyLabels[routine.frequency]}
                    </span>
                    <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
                      {routine.time}
                    </span>
                    <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
                      {routine.duration}min
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(routine.id, routine.active)}
                    className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                      routine.active
                        ? 'border-[var(--color-primary)] text-primary'
                        : 'border-[var(--color-surface-2)] text-dim hover:text-white'
                    }`}
                  >
                    {routine.active ? 'ATIVA' : 'PAUSADA'}
                  </button>
                  <button
                    onClick={() => handleGenerateTasks(routine.id)}
                    className="font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-primary hover:border-[var(--color-primary)] transition-colors"
                  >
                    Gerar 7 dias
                  </button>
                  <button
                    onClick={() => handleDelete(routine.id)}
                    className="ml-auto font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-red-400 hover:border-red-400 transition-colors"
                  >
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
