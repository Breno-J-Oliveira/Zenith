'use client';

import { useState, useCallback } from 'react';

interface QuickInputAction {
  id: string;
  text: string;
  intent: string;
  summary: string;
  persisted?: boolean;
}

const API = 'http://localhost:3002';

function summarizeResult(intent: string, payload: any): string {
  switch (intent) {
    case 'LOG_EXPENSE':
      return `Gasto registrado: R$ ${payload.amount} · ${payload.category}`;
    case 'CREATE_EVENT':
      return `Evento criado: ${payload.title}${payload.time ? ` às ${payload.time}` : ''}`;
    case 'CREATE_GOAL':
      return `Meta criada: ${payload.title}`;
    case 'CREATE_TASK':
      return `Tarefa criada: ${payload.title}`;
    default:
      return 'Não entendi. Tente: "gastei 25 no pastel" ou "reunião dia 23 às 14h"';
  }
}

async function persistResult(intent: string, payload: any): Promise<boolean> {
  try {
    if (intent === 'CREATE_GOAL' && payload?.title) {
      const body: any = { title: payload.title };
      if (payload.category) body.category = payload.category;
      if (payload.deadline) body.deadline = payload.deadline;
      await fetch(`${API}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return true;
    }
    if (intent === 'CREATE_TASK' && payload?.title) {
      const body: any = { title: payload.title };
      if (payload.date) body.date = payload.date;
      await fetch(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function QuickInput() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<QuickInputAction[]>([]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const summary = summarizeResult(data.intent, data.payload);
      const persisted = await persistResult(data.intent, data.payload);
      const action: QuickInputAction = {
        id: `action-${Date.now()}`,
        text,
        intent: data.intent,
        summary: persisted ? `${summary} ✓` : summary,
        persisted,
      };
      setActions(prev => [action, ...prev].slice(0, 5));
      setText('');
    } catch {
      const action: QuickInputAction = {
        id: `action-${Date.now()}`,
        text,
        intent: 'ERROR',
        summary: 'Erro ao processar. Verifique se o backend está rodando.',
      };
      setActions(prev => [action, ...prev].slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [text, loading]);

  return (
    <div className="mb-6">
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-4">
        <p className="font-mono text-xs text-dim mb-3">QUICK INPUT — IA</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Ex: "gastei 25 no pastel" ou "reunião dia 23 às 14h"'
            disabled={loading}
            className="flex-1 bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="bg-primary text-white font-orbitron font-bold px-6 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </form>

        {actions.length > 0 && (
          <div className="mt-4 space-y-2">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 bg-[var(--color-bg)] rounded border border-[var(--color-surface-2)]"
              >
                <span
                  className="font-mono text-xs px-2 py-1 rounded shrink-0"
                  style={{
                    color: action.intent === 'UNKNOWN' || action.intent === 'ERROR'
                      ? 'var(--color-text-dim)'
                      : 'var(--color-primary)',
                    border: '1px solid var(--color-surface-2)',
                  }}
                >
                  {action.intent}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{action.summary}</p>
                  <p className="font-mono text-xs text-dim truncate">"{action.text}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
