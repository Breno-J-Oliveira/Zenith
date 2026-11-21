'use client';

import { useCallback, useEffect, useState } from 'react';
import { addCivilDays, getCivilDate } from '../../../../packages/shared/src/civil-date';
import type { Task } from '../../../../packages/shared/src/types';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

function displayDay(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

export default function RelatorioPage() {
  const today = getCivilDate();
  const from = addCivilDays(today, -6);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async (signal?: AbortSignal) => {
    setState('loading');
    try {
      const response = await apiGet<Task[]>('/tasks', { params: { from, to: today }, signal });
      if (signal?.aborted) return;
      setTasks(response
        .filter(task => task.date && task.date >= from && task.date <= today)
        .sort((left, right) => left.date!.localeCompare(right.date!)));
      setState('ready');
    } catch {
      if (!signal?.aborted) setState('error');
    }
  }, [from, today]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const completed = tasks.filter(task => task.completed || task.status === 'COMPLETED');
  const pending = tasks.filter(task => !task.completed && task.status === 'ACTIVE');
  const sections = [
    { label: 'Pendentes', tasks: pending, empty: 'Nenhuma pendência planejada no período.' },
    { label: 'Concluídas', tasks: completed, empty: 'Nenhuma tarefa planejada nesse período está concluída.' },
  ];

  return (
    <ShellLayout>
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="font-orbitron text-2xl font-bold">Revisão semanal</h1>
          <p className="mt-2 text-sm text-[var(--color-text-dim)]">
            Estado atual das tarefas planejadas de {displayDay(from)} a {displayDay(today)}.
          </p>
        </header>
        {state === 'loading' && <p role="status">Carregando tarefas...</p>}
        {state === 'error' && (
          <div className="card space-y-3 p-4">
            <p role="alert">Não foi possível carregar a revisão.</p>
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        )}
        {state === 'ready' && sections.map((section) => (
          <section key={section.label} className="card p-4">
            <h2 className="font-semibold">{section.label} ({section.tasks.length})</h2>
            {section.tasks.length ? (
              <ul className="mt-3 space-y-2">
                {section.tasks.map(task => (
                  <li key={task.id} className="flex min-w-0 gap-3 text-sm">
                    <time dateTime={task.date} className="shrink-0 font-mono text-[var(--color-text-dim)]">
                      {displayDay(task.date!)}
                    </time>
                    <span className="min-w-0 break-words">{task.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-dim)]">{section.empty}</p>
            )}
          </section>
        ))}
        <Link href="/hoje/" className="btn btn-primary inline-flex">Voltar para Hoje</Link>
      </div>
    </ShellLayout>
  );
}
