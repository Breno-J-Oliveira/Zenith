'use client';

import { useState, useCallback } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { CalendarView } from '../../components/calendar/CalendarView';
import { EventBadge } from '../../components/calendar/EventBadge';

export default function CalendarioPage() {
  const [toast, setToast] = useState<string | null>(null);

  const handleReorgMessage = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 8000);
  }, []);

  return (
    <ShellLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-info-glow)] text-[var(--color-info)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Calendário</h1>
              <p className="text-[var(--color-text-dim)] text-sm">Visão mensal, semanal e diária</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <EventBadge type="task" />
            <EventBadge type="routine" />
            <EventBadge type="appointment" />
          </div>
        </div>

        {/* Reorganization Toast */}
        {toast && (
          <div className="card p-4 mb-6 border-[var(--color-primary)]/50 bg-[var(--color-primary-subtle)] animate-slide-in-up">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-mono text-[10px] text-[var(--color-primary)] tracking-wider mb-1">REORGANIZAÇÃO ADAPTATIVA</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{toast}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="card p-4 hud-border">
          <CalendarView onReorgMessage={handleReorgMessage} />
        </div>
      </div>
    </ShellLayout>
  );
}