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

  return (
    <ShellLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="font-orbitron text-2xl font-bold mb-6">Hoje</h1>

        {briefing && (
          <div className="mb-6 p-4 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="font-mono text-xs text-dim">BRIEFING · {briefing.source === 'gemini' ? 'IA' : 'template'}</span>
            </div>
            <p className="text-sm text-white">{briefing.text}</p>
          </div>
        )}

        {loading ? (
          <div className="text-dim text-center py-12">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-12 text-center">
            <p className="font-orbitron text-xl text-dim mb-2">Nada agendado para hoje</p>
            <p className="text-dim text-sm">Use o Quick Input no dashboard para criar tarefas e rotinas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg"
              >
                <button
                  onClick={() => handleToggle(item)}
                  disabled={item.type === 'appointment'}
                  className={`w-5 h-5 rounded border shrink-0 transition-colors ${
                    item.done
                      ? 'bg-primary border-primary'
                      : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
                  } ${item.type === 'appointment' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {item.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <span className={`text-sm flex-1 ${item.done ? 'line-through text-dim' : 'text-white'}`}>
                  {item.title}
                </span>

                <span className="font-mono text-xs text-dim shrink-0">
                  {item.time !== '—' ? item.time : ''}
                </span>

                <EventBadge type={item.type} done={item.done} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
