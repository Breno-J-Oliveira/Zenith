'use client';

import { useState, useCallback } from 'react';

interface QuickInputAction {
  id: string;
  text: string;
  intent: string;
  summary: string;
  persisted?: boolean;
  reorgMessage?: string;
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
    case 'CREATE_ROUTINE':
      return `Rotina criada: ${payload.title} (${payload.frequency}, ${payload.time})`;
    case 'CREATE_APPOINTMENT':
      return `Compromisso criado: ${payload.title} em ${payload.date} das ${payload.startTime} às ${payload.endTime}`;
    default:
      return 'Não entendi. Tente: "gastei 25 no pastel" ou "reunião dia 23 das 14h às 16h"';
  }
}

export function QuickInput() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<QuickInputAction[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

      let reorgMessage: string | undefined;
      let persisted = false;

      if (data.sideEffect) {
        persisted = true;
        if (data.sideEffect.type === 'appointment_created' && data.sideEffect.reorganization) {
          reorgMessage = data.sideEffect.reorganization.message;
          if (reorgMessage) {
            setToast(reorgMessage);
            setTimeout(() => setToast(null), 8000);
          }
        }
      }

      const action: QuickInputAction = {
        id: `action-${Date.now()}`,
        text,
        intent: data.intent,
        summary: persisted ? `${summary} ✓` : summary,
        persisted,
        reorgMessage,
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
            placeholder='Ex: "gastei 25 no pastel" ou "reunião dia 23 das 14h às 16h"'
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

        {toast && (
          <div className="mt-4 p-4 bg-primary/10 border border-[var(--color-primary)] rounded-lg flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            <div className="flex-1">
              <p className="font-mono text-xs text-primary mb-1">REORGANIZAÇÃO ADAPTATIVA</p>
              <p className="text-sm text-white">{toast}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-dim hover:text-white text-sm shrink-0"
            >
              ✕
            </button>
          </div>
        )}

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
                  {action.reorgMessage && (
                    <p className="font-mono text-xs text-primary mt-1">{action.reorgMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
