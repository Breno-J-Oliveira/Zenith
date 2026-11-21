'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Target } from 'lucide-react';
import type { Goal, Routine, Task } from '@zenith/shared';
import { addCivilDays, getCivilDate } from '../../../../packages/shared/src/civil-date';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { QuickInput } from '../../components/ai/QuickInput';
import { apiGet } from '@/lib/api';

interface DashboardData {
  tasks: Task[];
  goals: Goal[];
  routines: Routine[];
}

export default function DashboardPage() {
  const today = getCivilDate();
  const from = addCivilDays(today, -6);
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([
      apiGet<Task[]>('/tasks', { signal, params: { from, to: today } }),
      apiGet<Goal[]>('/goals', { signal, params: { status: 'ACTIVE' } }),
      apiGet<Routine[]>('/routines', { signal }),
    ]).then(([tasks, goals, routines]) => {
      if (!signal.aborted) setData({ tasks, goals, routines });
    }).catch(() => { if (!signal.aborted) setError(true); });
    return () => controller.abort();
  }, [from, today, attempt]);

  const planned = data?.tasks.filter(task => task.date === today && task.status !== 'CANCELLED') ?? [];
  const completed = planned.filter(task => task.completed || task.status === 'COMPLETED').length;
  const progress = planned.length ? Math.round(completed / planned.length * 100) : 0;
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(new Date(today + 'T12:00:00Z'));

  return (
    <ShellLayout>
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-surface-2)] pb-6">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] capitalize">{dateLabel}</p>
            <h1 className="mt-1 font-orbitron text-2xl font-bold tracking-tight sm:text-3xl">Seu painel</h1>
          </div>
          <Link href="/hoje/?new=true" className="btn btn-primary min-h-11">
            <Plus size={18} aria-hidden="true" /> Capturar tarefa
          </Link>
        </header>

        {error ? (
          <div className="card mt-5 space-y-3 p-5">
            <p role="alert">Não foi possível atualizar o painel.</p>
            <button type="button" className="btn btn-secondary min-h-11" onClick={() => { setError(false); setAttempt(value => value + 1); }}>
              Tentar novamente
            </button>
          </div>
        ) : !data ? (
          <p role="status" className="py-8 text-[var(--color-text-secondary)]">Carregando painel…</p>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            <section className="rounded-xl border border-[var(--color-surface-2)] bg-[var(--color-surface-1)] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Progresso de hoje</h2>
                <Link href="/hoje/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold">
                  Abrir Hoje <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                {planned.length ? `${completed} de ${planned.length} tarefas planejadas concluídas` : 'Você ainda não tem tarefas planejadas para hoje.'}
              </p>
              {planned.length > 0 && (
                <div role="progressbar" aria-label="Tarefas planejadas para hoje" aria-valuenow={progress}
                  className="mt-4 h-2 rounded-full bg-[var(--color-surface-3)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="mt-7 border-t border-[var(--color-surface-2)] pt-4">
                <h3 className="text-base font-semibold">Últimos sete dias</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tarefas concluídas pela data em que foram planejadas.</p>
                <ol className="mt-3 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 7 }, (_, index) => {
                    const date = addCivilDays(from, index);
                    const day = data.tasks.filter(task => task.date === date && task.status !== 'CANCELLED');
                    const done = day.filter(task => task.completed || task.status === 'COMPLETED').length;
                    return (
                      <li key={date} className="min-w-0 rounded-md bg-[var(--color-surface-2)] py-2 text-center text-xs">
                        <time dateTime={date} className="block text-[var(--color-text-secondary)]">{date.slice(8)}/{date.slice(5, 7)}</time>
                        <span className="font-mono" aria-label={`${done} concluídas de ${day.length}`}>{done}/{day.length}</span>
                      </li>
                    );
                  })}
                </ol>
                <Link href="/relatorio/" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold">
                  Abrir revisão semanal <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--color-surface-2)] bg-[var(--color-surface-1)] p-5 sm:p-6">
              <h2 className="text-lg font-bold">Em andamento</h2>
              <div className="mt-2 divide-y divide-[var(--color-surface-2)]">
                <Link href="/metas/" className="flex min-h-12 items-center justify-between gap-2 py-2">
                  <span className="inline-flex items-center gap-2"><Target size={17} aria-hidden="true" /> Metas ativas</span>
                  <strong className="font-mono text-sm">{data.goals.length}</strong>
                </Link>
                <Link href="/rotinas/" className="flex min-h-12 items-center justify-between gap-2 py-2">
                  <span>Rotinas ativas</span>
                  <strong className="font-mono text-sm">{data.routines.filter(routine => routine.active).length}</strong>
                </Link>
              </div>
              <Link href="/metas/?new=true" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold">
                Criar meta <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </section>
          </div>
        )}

        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Captura com IA</h2>
          <QuickInput />
        </section>
      </div>
    </ShellLayout>
  );
}
