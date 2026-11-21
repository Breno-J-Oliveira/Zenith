'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCivilDate, getCivilTime, ZENITH_TIME_ZONE } from '../../../../packages/shared/src/civil-date';
import type { Task } from '../../../../packages/shared/src/types';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { EventBadge } from '../../components/calendar/EventBadge';
import { apiGet, apiPatch } from '@/lib/api';
import { CaptureForm, formatTaskDate, PlanActions } from './PersonalTaskControls';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  type: 'task' | 'appointment' | 'routine';
  sourceId: string;
  done?: boolean;
}

interface TodayItem extends Omit<CalendarEvent, 'start'> {
  time?: string;
  personal?: Task;
}

interface Briefing {
  text: string;
  source: 'gemini' | 'template';
}

interface PersonalTasks {
  inbox: Task[];
  upcoming: Task[];
}

type Filter = 'all' | TodayItem['type'];

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'task', label: 'Tarefas' },
  { value: 'routine', label: 'Rotinas' },
  { value: 'appointment', label: 'Compromissos' },
];

function withSavedTask(tasks: Task[], saved: Task): Task[] {
  return tasks.some((task) => task.id === saved.id)
    ? tasks.map((task) => task.id === saved.id ? saved : task)
    : [saved, ...tasks];
}

function HojePageContent() {
  const searchParams = useSearchParams();
  const [now, setNow] = useState(() => new Date());
  const today = getCivilDate(now);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(false);
  const [tasksError, setTasksError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingError, setBriefingError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [focusTarget, setFocusTarget] = useState<'today' | 'completed' | 'upcoming' | null>(null);
  const todayHeading = useRef<HTMLHeadingElement>(null);
  const completedHeading = useRef<HTMLHeadingElement>(null);
  const upcomingHeading = useRef<HTMLHeadingElement>(null);
  const pending = useRef(new Set<string>());
  const readingTasks = useRef<Map<string, Task> | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCalendarLoading(true);
    setCalendarError(false);
    apiGet<CalendarEvent[]>('/calendar', { params: { from: today, to: today }, signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setEvents(data); })
      .catch(() => { if (!controller.signal.aborted) setCalendarError(true); })
      .finally(() => { if (!controller.signal.aborted) setCalendarLoading(false); });
    return () => controller.abort();
  }, [today, retry]);

  useEffect(() => {
    const controller = new AbortController();
    // Um GET iniciado antes de uma escrita não pode sobrescrever o resultado confirmado.
    const savedDuringRead = new Map<string, Task>();
    readingTasks.current = savedDuringRead;
    setTasksLoading(true);
    setTasksError(false);
    apiGet<PersonalTasks>('/tasks/personal', { params: { from: today }, signal: controller.signal })
      .then(({ inbox, upcoming }) => {
        if (controller.signal.aborted) return;
        let current = [...inbox, ...upcoming];
        for (const task of savedDuringRead.values()) current = withSavedTask(current, task);
        setTasks(current);
      })
      .catch(() => { if (!controller.signal.aborted) setTasksError(true); })
      .finally(() => {
        if (!controller.signal.aborted) {
          readingTasks.current = null;
          setTasksLoading(false);
        }
      });
    return () => {
      controller.abort();
      if (readingTasks.current === savedDuringRead) readingTasks.current = null;
    };
  }, [today, retry]);

  useEffect(() => {
    const controller = new AbortController();
    setBriefing(null);
    setBriefingError(false);
    apiGet<Briefing>('/ai/briefing', { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setBriefing(data); })
      .catch(() => { if (!controller.signal.aborted) setBriefingError(true); });
    return () => controller.abort();
  }, [today]);

  useEffect(() => {
    if (!focusTarget) return;
    const target = focusTarget === 'today' ? todayHeading
      : focusTarget === 'completed' ? completedHeading
      : upcomingHeading;
    target.current?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  function savePersonalTask(task: Task) {
    readingTasks.current?.set(task.id, task);
    setTasks((current) => withSavedTask(current, task));
  }

  async function changeTask(task: Task, change: { date: string } | { completed: boolean }) {
    if (pending.current.has(task.id)) return;
    pending.current.add(task.id);
    setPendingIds([...pending.current]);
    setActionErrors((errors) => ({ ...errors, [task.id]: '' }));
    setNotice('');

    try {
      const saved = await apiPatch<Task>(`/tasks/personal/${encodeURIComponent(task.id)}`, change);
      savePersonalTask(saved);
      if ('date' in change) {
        if (saved.date === getCivilDate()) {
          setFilter('all');
          setFocusTarget('today');
          setNotice('Tarefa planejada para hoje.');
        } else {
          setFocusTarget('upcoming');
          setNotice(`Tarefa planejada para ${formatTaskDate(saved.date || change.date)}.`);
        }
      } else {
        setFocusTarget(saved.completed ? 'completed' : 'today');
        setNotice(saved.completed ? 'Tarefa concluída.' : 'Tarefa devolvida aos pendentes.');
      }
    } catch {
      setActionErrors((errors) => ({
        ...errors,
        [task.id]: 'Não foi possível confirmar a alteração. Tente novamente.',
      }));
    } finally {
      pending.current.delete(task.id);
      setPendingIds([...pending.current]);
    }
  }

  async function toggleCalendarItem(item: TodayItem) {
    if (calendarLoading || pending.current.has(item.sourceId)) return;
    pending.current.add(item.sourceId);
    setPendingIds([...pending.current]);
    setActionErrors((errors) => ({ ...errors, [item.sourceId]: '' }));
    try {
      const saved = await apiPatch<Task>(`/tasks/${encodeURIComponent(item.sourceId)}/toggle`);
      setEvents((current) => current.map((event) =>
        event.sourceId === saved.id ? { ...event, done: saved.completed } : event,
      ));
    } catch {
      setActionErrors((errors) => ({
        ...errors,
        [item.sourceId]: 'Não foi possível alterar a tarefa. Tente novamente.',
      }));
    } finally {
      pending.current.delete(item.sourceId);
      setPendingIds([...pending.current]);
    }
  }

  const inbox = tasks.filter((task) => !task.date);
  const upcoming = tasks
    .filter((task) => task.date && task.date > today)
    .sort((a, b) => a.date!.localeCompare(b.date!));
  const personalToday = tasks.filter((task) => task.date === today);
  const personalIds = new Set(tasks.map((task) => task.id));
  const items: TodayItem[] = [
    ...events
      .filter((event) => event.start.split('T')[0] === today &&
        (event.type !== 'task' || !personalIds.has(event.sourceId)))
      .map((event) => ({ ...event, time: event.start.split('T')[1]?.slice(0, 5) })),
    ...personalToday.map((task): TodayItem => ({
      id: `personal-${task.id}`,
      title: task.title,
      type: 'task',
      sourceId: task.id,
      done: task.completed,
      personal: task,
    })),
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter);
  const pendingItems = filtered.filter((item) => !item.personal || !item.done);
  const completedItems = filtered.filter((item) => item.personal && item.done);
  const completedCount = items.filter((item) => item.done).length;
  const currentTime = getCivilTime(now);
  const loading = calendarLoading || tasksLoading;

  function renderItem(item: TodayItem) {
    const past = item.time && item.time < currentTime && !item.done;
    const action = item.done ? 'Desfazer' : 'Concluir';
    const busy = pendingIds.includes(item.sourceId);
    const error = actionErrors[item.sourceId];

    return (
      <li key={item.id} className="card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex-1 min-w-0 basis-32">
            <p className={`font-medium break-words ${item.done ? 'line-through text-[var(--color-text-dim)]' : 'text-[var(--color-text)]'}`}>
              {item.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <EventBadge type={item.type} done={item.done} />
              {item.time && <span className={`font-mono text-xs ${past ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-dim)]'}`}>{item.time}</span>}
            </div>
          </div>
          {item.type !== 'appointment' && (
            <button
              type="button"
              className="btn btn-secondary min-h-11 shrink-0"
              disabled={busy || (!item.personal && calendarLoading)}
              aria-label={`${action}: ${item.title}`}
              onClick={() => item.personal
                ? void changeTask(item.personal, { completed: !item.done })
                : void toggleCalendarItem(item)}
            >
              {action}
            </button>
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
      </li>
    );
  }

  return (
    <ShellLayout>
      <div className="mx-auto max-w-4xl min-w-0 space-y-6 pb-16 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--color-text)]">
        <header>
          <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Hoje</h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            {now.toLocaleDateString('pt-BR', {
              timeZone: ZENITH_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </header>

        <section className="card p-4 sm:p-5 space-y-4" aria-labelledby="inbox-heading">
          <h2 id="inbox-heading" className="font-orbitron text-base font-bold">Caixa de entrada</h2>
          <CaptureForm
            autoFocus={searchParams.get('new') === 'true'}
            onSaved={(task) => {
              savePersonalTask(task);
              setNotice('Tarefa salva na caixa de entrada.');
            }}
          />
          <p role="status" className="text-sm text-[var(--color-text-secondary)]">{notice}</p>

          {tasksError && (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert" className="text-sm text-[var(--color-danger)]">Não foi possível carregar as tarefas pessoais.</p>
              <button type="button" className="btn btn-secondary min-h-11" onClick={() => setRetry((value) => value + 1)}>
                Tentar novamente
              </button>
            </div>
          )}
          {tasksLoading && inbox.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">Carregando tarefas…</p>}
          {!tasksLoading && !tasksError && inbox.length === 0 && (
            <p className="text-sm text-[var(--color-text-dim)]">A caixa de entrada está vazia.</p>
          )}

          {inbox.length > 0 && (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {inbox.map((task) => (
                <li key={task.id} className="space-y-2 py-3">
                  <p className="font-medium break-words text-[var(--color-text)]">{task.title}</p>
                  <PlanActions
                    task={task}
                    today={today}
                    busy={pendingIds.includes(task.id)}
                    onPlan={(item, date) => void changeTask(item, { date })}
                  />
                  {actionErrors[task.id] && <p role="alert" className="text-sm text-[var(--color-danger)]">{actionErrors[task.id]}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="today-agenda-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="today-agenda-heading" ref={todayHeading} tabIndex={-1} className="font-orbitron text-base font-bold">
              Agenda de hoje
            </h2>
            {items.length > 0 && (
              <p className="text-sm text-[var(--color-text-dim)]">{completedCount} de {items.length} itens concluídos</p>
            )}
          </div>

          {calendarError && (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert" className="text-sm text-[var(--color-danger)]">Não foi possível carregar a agenda.</p>
              <button type="button" className="btn btn-secondary min-h-11" onClick={() => setRetry((value) => value + 1)}>
                Tentar carregar agenda
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div aria-label="Filtrar agenda" role="group" className="flex flex-wrap gap-2">
              {filters.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`btn min-h-11 ${filter === value ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {loading && items.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">Carregando seu dia…</p>}
          {!loading && !calendarError && !tasksError && filtered.length === 0 && (
            <p className="text-sm text-[var(--color-text-dim)]">
              {filter === 'all' ? 'Nenhum item planejado para hoje.' : 'Nenhum item para este filtro.'}
            </p>
          )}
          {pendingItems.length > 0 && <ul className="space-y-2">{pendingItems.map(renderItem)}</ul>}
          {completedItems.length > 0 && (
            <div className="space-y-2">
              <h3 ref={completedHeading} tabIndex={-1} className="text-sm font-medium text-[var(--color-text-secondary)]">
                Concluídas
              </h3>
              <ul className="space-y-2">{completedItems.map(renderItem)}</ul>
            </div>
          )}
        </section>

        <section className="card p-4 sm:p-5 space-y-3" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" ref={upcomingHeading} tabIndex={-1} className="font-orbitron text-base font-bold">
            Próximos dias
          </h2>
          {upcoming.length > 0 && (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {upcoming.map((task) => (
                <li key={task.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <p className="min-w-0 basis-32 flex-1 break-words">{task.title}</p>
                    <time dateTime={task.date} className="text-sm text-[var(--color-text-dim)]">{formatTaskDate(task.date!)}</time>
                  </div>
                  <PlanActions
                    task={task}
                    today={today}
                    busy={pendingIds.includes(task.id)}
                    onPlan={(item, date) => void changeTask(item, { date })}
                  />
                  {actionErrors[task.id] && <p role="alert" className="text-sm text-[var(--color-danger)]">{actionErrors[task.id]}</p>}
                </li>
              ))}
            </ul>
          )}
          {!tasksLoading && !tasksError && upcoming.length === 0 && (
            <p className="text-sm text-[var(--color-text-dim)]">Nenhuma tarefa pessoal planejada para os próximos dias.</p>
          )}
        </section>

        {(briefing || briefingError) && (
          <section className="card p-4 sm:p-5 space-y-2" aria-labelledby="briefing-heading">
            <h2 id="briefing-heading" className="font-orbitron text-base font-bold">Briefing</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {briefing ? briefing.text : 'O briefing está indisponível.'}
            </p>
          </section>
        )}
      </div>
    </ShellLayout>
  );
}

export default function HojePage() {
  return (
    <Suspense fallback={<p className="p-6 text-[var(--color-text-dim)]">Carregando Hoje…</p>}>
      <HojePageContent />
    </Suspense>
  );
}
