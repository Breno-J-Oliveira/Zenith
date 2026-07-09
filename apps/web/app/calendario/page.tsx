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
      <div className="p-8 max-w-6xl">
        <h1 className="font-orbitron text-2xl font-bold mb-6">Calendário</h1>

        {toast && (
          <div className="mb-4 p-4 bg-primary/10 border border-[var(--color-primary)] rounded-lg flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            <div className="flex-1">
              <p className="font-mono text-xs text-primary mb-1">REORGANIZAÇÃO ADAPTATIVA</p>
              <p className="text-sm text-white">{toast}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-dim hover:text-white text-sm shrink-0">✕</button>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <EventBadge type="task" />
          <EventBadge type="routine" />
          <EventBadge type="appointment" />
        </div>

        <CalendarView onReorgMessage={handleReorgMessage} />
      </div>
    </ShellLayout>
  );
}
