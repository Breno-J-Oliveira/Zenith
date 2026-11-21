'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { addCivilDays, getCivilDate } from '../../../../packages/shared/src/civil-date';
import type { Task } from '../../../../packages/shared/src/types';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { apiGet } from '@/lib/api';

type ScheduledTask = Task & { date: string };
type Period = 'review' | 'upcoming';

function displayDay(date: string) {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function groupByDate(tasks: ScheduledTask[]) {
  const groups = new Map<string, ScheduledTask[]>();
  for (const task of tasks) {
    const group = groups.get(task.date) ?? [];
    group.push(task);
    groups.set(task.date, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}

function isComplete(task: Task) {
  return task.completed || task.status === 'COMPLETED';
}

export default function RelatorioPage() {
  const today = getCivilDate();
  const [period, setPeriod] = useState<Period>('review');
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reload, setReload] = useState(0);
  const lookingAhead = period === 'upcoming';
  const from = addCivilDays(today, lookingAhead ? 1 : -6);
  const to = lookingAhead ? addCivilDays(today, 7) : today;

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    apiGet<Task[]>('/tasks', { params: { from, to }, signal: controller.signal })
      .then(response => {
        if (controller.signal.aborted) return;
        setTasks(response.filter((task): task is ScheduledTask =>
          Boolean(task.date && task.date >= from && task.date <= to)));
        setState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [from, to, reload]);

  const pending = tasks.filter(task => task.status === 'ACTIVE' && !isComplete(task));
  const completed = tasks.filter(isComplete);
  const visible = lookingAhead ? pending : [...pending, ...completed];
  const days = groupByDate(visible);

  function selectPeriod(next: Period) {
    if (next === period) return;
    setState('loading');
    setPeriod(next);
  }

  return (
    <ShellLayout>
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-[var(--color-surface-2)] pb-5 sm:pb-7">
          <Link href="/hoje/" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <ArrowLeft size={15} aria-hidden="true" /> Hoje
          </Link>
          <h1 className="mt-2 font-orbitron text-2xl font-bold tracking-tight sm:text-3xl">Revisão semanal</h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-[var(--color-text-secondary)]">Veja o andamento do que planejou e prepare os próximos dias.</p>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div role="group" aria-label="Período do relatório" className="inline-flex min-w-0 flex-wrap gap-1 rounded-lg bg-[var(--color-surface-1)] p-1">
            {([
              ['review', 'Últimos 7 dias'],
              ['upcoming', 'Próximos 7 dias'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={value === period} onClick={() => selectPeriod(value)}
                className={`min-h-11 rounded-md px-3 text-sm font-semibold ${value === period
                  ? 'bg-[var(--color-surface-3)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-secondary)]">
            <CalendarClock size={15} aria-hidden="true" /> {displayDay(from)} a {displayDay(to)}
          </p>
        </div>
        {state === 'loading' && <p role="status" className="py-8 text-[var(--color-text-secondary)]">Carregando tarefas…</p>}
        {state === 'error' && (
          <div className="card space-y-3 p-4">
            <p role="alert">Não foi possível carregar as tarefas deste período.</p>
            <button type="button" className="btn btn-primary" onClick={() => setReload(attempt => attempt + 1)}>
              Tentar novamente
            </button>
          </div>
        )}
        {state === 'ready' && (
          <section aria-label={lookingAhead ? 'Tarefas dos próximos dias' : 'Tarefas planejadas no período'}>
            <div className="flex flex-wrap gap-x-5 gap-y-1 pb-4 text-sm text-[var(--color-text-secondary)]">
              <span><strong className="text-[var(--color-text)]">{pending.length}</strong> {pending.length === 1 ? 'pendente' : 'pendentes'}</span>
              {!lookingAhead && <span><strong className="text-[var(--color-text)]">{completed.length}</strong> {completed.length === 1 ? 'concluída' : 'concluídas'}</span>}
            </div>
            {!days.length ? (
              <div className="rounded-xl border border-[var(--color-surface-2)] bg-[var(--color-surface-1)] p-5">
                <p className="font-semibold">{lookingAhead ? 'Nenhuma tarefa pendente nos próximos dias.' : 'Nenhuma tarefa planejada neste período.'}</p>
                <Link href="/hoje/" className="mt-3 inline-flex min-h-10 items-center font-semibold text-[var(--color-text)] underline decoration-[var(--color-primary)] decoration-2 underline-offset-4">Planejar em Hoje</Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-surface-2)] rounded-xl border border-[var(--color-surface-2)] bg-[var(--color-surface-1)]">
                {days.map(([date, items]) => (
                  <section key={date} className="grid gap-2 px-4 py-3 sm:grid-cols-[5rem_1fr] sm:px-5">
                    <h2 className="self-start py-1 font-mono text-xs text-[var(--color-text-secondary)]">
                      <time dateTime={date}>{displayDay(date)}</time>
                    </h2>
                    <ul className="min-w-0 space-y-1">
                      {items.map(task => {
                        const complete = isComplete(task);
                        const Icon = complete ? CheckCircle2 : Circle;
                        return (
                          <li key={task.id} className="flex min-w-0 items-start gap-2 py-1 leading-snug">
                            <Icon size={17} aria-hidden="true" className={`mt-0.5 shrink-0 ${complete ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`} />
                            <span className="sr-only">{complete ? 'Concluída' : 'Pendente'}. </span>
                            <span className="min-w-0 break-words">{task.title}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </ShellLayout>
  );
}
