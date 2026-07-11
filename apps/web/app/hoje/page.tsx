'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { EventBadge } from '../../components/calendar/EventBadge';

const API = 'http://localhost:3002';

interface TodayItem {
  id: string;
  title: string;
  time: string;
  type: 'task' | 'appointment' | 'routine';
  sourceId: string;
  done?: boolean;
}

interface Briefing {
  text: string;
  source: 'gemini' | 'template';
}

export default function HojePage() {
  const [items, setItems] = useState<TodayItem[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'task' | 'routine' | 'appointment'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const from = today;
      const to = today;
      const [eventsRes, briefingRes] = await Promise.all([
        fetch(`${API}/calendar?from=${from}&to=${to}`),
        fetch(`${API}/ai/briefing`),
      ]);
      const events = await eventsRes.json();
      const briefingData = await briefingRes.json();

      const todayItems: TodayItem[] = events.map((e: any) => ({
        id: e.id,
        title: e.title,
        time: e.start.includes('T') ? e.start.split('T')[1].substring(0, 5) : '—',
        type: e.type,
        sourceId: e.sourceId,
        done: e.done,
      })).sort((a: TodayItem, b: TodayItem) => a.time.localeCompare(b.time));

      setItems(todayItems);
      setBriefing(briefingData);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (item: TodayItem) => {
    if (item.type === 'routine' || item.type === 'task') {
      try {
        await fetch(`${API}/tasks/${item.sourceId}/toggle`, { method: 'PATCH' });
        fetchData();
      } catch { /* ignore */ }
    }
  };

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const completedCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '✓';
      case 'routine': return '↻';
      case 'appointment': return '📅';
      default: return '•';
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Hoje</h1>
              <p className="text-[var(--color-text-dim)] text-sm">
                {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {totalCount > 0 && (
          <div className="card p-5 mb-6 hud-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-orbitron text-sm font-bold text-[var(--color-text)]">Progresso do Dia</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{completedCount} de {totalCount} itens concluídos</p>
              </div>
              <div className="text-right">
                <p className="font-orbitron text-2xl font-bold text-[var(--color-primary)]">{progressPercent}%</p>
              </div>
            </div>
            <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[var(--color-text-muted)]">{completedCount} concluídas</span>
              <span className="text-xs text-[var(--color-text-muted)]">{totalCount - completedCount} restantes</span>
            </div>
          </div>
        )}

        {/* Briefing da IA */}
        {briefing && (
          <div className="card p-5 mb-6 hud-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] text-[var(--color-primary)] tracking-wider">BRIEFING</span>
                  <span className="badge badge-primary text-[9px] py-0.5">
                    {briefing.source === 'gemini' ? '✨ IA' : '📋 Template'}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{briefing.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todos', count: items.length },
            { key: 'task', label: 'Tarefas', count: items.filter(i => i.type === 'task').length },
            { key: 'routine', label: 'Rotinas', count: items.filter(i => i.type === 'routine').length },
            { key: 'appointment', label: 'Compromissos', count: items.filter(i => i.type === 'appointment').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-2)]/50 text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                filter === tab.key ? 'bg-white/20' : 'bg-[var(--color-surface-2)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-dim)] text-sm">Carregando seu dia...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="card p-12 text-center hud-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="font-orbitron text-lg text-[var(--color-text)] mb-2">
              {filter === 'all' ? 'Dia livre!' : `Nenhum ${filter} hoje`}
            </p>
            <p className="text-[var(--color-text-dim)] text-sm mb-4">
              {filter === 'all' 
                ? 'Aproveite seu tempo livre ou planeje novas atividades.'
                : 'Tente selecionar outro filtro.'}
            </p>
            <a href="/dashboard" className="btn btn-primary inline-flex">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ir para Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const isPast = item.time !== '—' && item.time < currentTime && !item.done;
              const isCurrent = item.time !== '—' && item.time === currentTime;

              return (
                <div
                  key={item.id}
                  className={`
                    card p-4 flex items-center gap-4 group transition-all duration-200
                    ${item.done ? 'opacity-60' : ''}
                    ${isCurrent ? 'border-[var(--color-primary)] glow-subtle' : ''}
                    ${isPast && !item.done ? 'border-[var(--color-danger)]/50' : ''}
                    hover:border-[var(--border-strong)]
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={item.type === 'appointment'}
                    className={`
                      w-6 h-6 rounded-md border-2 shrink-0 transition-all duration-200 flex items-center justify-center
                      ${item.done
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                        : 'border-[var(--border-strong)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]'
                      }
                      ${item.type === 'appointment' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {item.done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Time indicator */}
                  <div className="w-16 shrink-0">
                    {item.time !== '—' ? (
                      <div className="text-center">
                        <span className={`font-mono text-sm font-bold ${isCurrent ? 'text-[var(--color-primary)]' : isPast ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-dim)]'}`}>
                          {item.time}
                        </span>
                        {isPast && !item.done && (
                          <p className="text-[9px] text-[var(--color-danger)] font-medium">ATRASADO</p>
                        )}
                        {isCurrent && (
                          <p className="text-[9px] text-[var(--color-primary)] font-medium animate-pulse">AGORA</p>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-[var(--color-text-muted)] text-center block">—</span>
                    )}
                  </div>

                  {/* Type indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    item.type === 'task' ? 'bg-[var(--color-success-glow)] text-[var(--color-success)]' :
                    item.type === 'routine' ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' :
                    'bg-[var(--color-info-glow)] text-[var(--color-info)]'
                  }`}>
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.done ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                      {item.title}
                    </p>
                  </div>

                  {/* Type badge */}
                  <EventBadge type={item.type} done={item.done} />
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {totalCount > 0 && (
          <div className="mt-8 p-4 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-[var(--color-text-dim)]">
                  <span className="font-bold text-[var(--color-success)]">{items.filter(i => i.type === 'task').length}</span> tarefas
                </span>
                <span className="text-[var(--color-text-dim)]">
                  <span className="font-bold text-[var(--color-primary)]">{items.filter(i => i.type === 'routine').length}</span> rotinas
                </span>
                <span className="text-[var(--color-text-dim)]">
                  <span className="font-bold text-[var(--color-info)]">{items.filter(i => i.type === 'appointment').length}</span> compromissos
                </span>
              </div>
              <span className="text-[var(--color-text-muted)] text-xs">
                Atualizado às {currentTime}
              </span>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}