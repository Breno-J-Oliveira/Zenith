'use client';

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Clock, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import type { Routine, Task } from '@zenith/shared';
import { civilDateAnchor, getCivilDate } from '../../../../packages/shared/src/civil-date';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

const frequencyLabels: Record<Routine['frequency'], string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const weekdays = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });

function recurrence(routine: Routine) {
  if (routine.frequency === 'daily') return 'Todos os dias';
  const anchor = civilDateAnchor(getCivilDate(new Date(routine.createdAt)));
  return routine.frequency === 'weekly'
    ? `Toda ${weekdays.format(anchor)}`
    : `Dia ${anchor.getUTCDate()}, nos meses com esse dia`;
}

const initialDraft = { title: '', frequency: 'daily' as Routine['frequency'], time: '08:00', duration: '30' };

function RoutineContent() {
  const search = useSearchParams();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<Record<string, number | undefined>>({});
  const addButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const activeCount = routines.filter(routine => routine.active).length;

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');
    apiGet<Routine[]>('/routines', { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        setRoutines(data);
        setLoadState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setLoadState('error'); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (search.get('new') === 'true') {
      setDraft(initialDraft);
      setFormError('');
      setEditing('');
    }
  }, [search]);

  useEffect(() => { if (editing !== null) input.current?.focus(); }, [editing]);

  function showForm(routine?: Routine) {
    setFormError('');
    setDraft(routine ? {
      title: routine.title, frequency: routine.frequency, time: routine.time, duration: String(routine.duration),
    } : initialDraft);
    setEditing(routine?.id ?? '');
  }

  function closeForm() {
    setEditing(null);
    setFormError('');
    const trigger = editing ? editButton.current : addButton.current;
    requestAnimationFrame(() => trigger?.focus());
  }

  function replaceRoutine(updated: Routine) {
    setRoutines(current => current.map(routine => routine.id === updated.id ? updated : routine));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loadState !== 'ready' || editing === null || !draft.title.trim()) return;
    const duration = Number(draft.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      setFormError('Informe uma duração inteira entre 1 e 1440 minutos.');
      return;
    }
    setSaving(true);
    setFormError('');
    const body = { ...draft, title: draft.title.trim(), duration };
    try {
      if (editing) {
        replaceRoutine(await apiPatch<Routine>(`/routines/${editing}`, body));
      } else {
        const created = await apiPost<Routine>('/routines', body);
        setRoutines(current => [created, ...current]);
      }
      closeForm();
    } catch {
      setFormError('Não foi possível salvar a rotina. Seu preenchimento foi mantido.');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(id: string, label: string, action: () => Promise<void>, failure: string) {
    if (actions[id]) return;
    setActions(current => ({ ...current, [id]: label }));
    setErrors(current => ({ ...current, [id]: '' }));
    try {
      await action();
    } catch {
      setErrors(current => ({ ...current, [id]: failure }));
    } finally {
      setActions(current => ({ ...current, [id]: '' }));
    }
  }

  function renderForm() {
    return (
      <form onSubmit={save} className="space-y-4 p-4 sm:p-5">
        <h2 className="font-orbitron text-base font-semibold">{editing ? 'Editar rotina' : 'Nova rotina'}</h2>
        {editing && <p className="text-sm text-[var(--color-text-secondary)]">As mudanças valem para as próximas tarefas geradas. As que já estão na agenda mantêm seus dados.</p>}
        <fieldset disabled={saving} className="min-w-0 space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Nome</span>
            <input ref={input} className="input w-full" required value={draft.title} placeholder="Ex.: Estudar React"
              onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="min-w-0 space-y-1">
              <span className="text-sm font-semibold">Frequência</span>
              <select className="input w-full" value={draft.frequency}
                onChange={event => setDraft(current => ({ ...current, frequency: event.target.value as Routine['frequency'] }))}>
                {Object.entries(frequencyLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-sm font-semibold">Horário</span>
              <input type="time" className="input min-w-0 w-full" required value={draft.time}
                onChange={event => setDraft(current => ({ ...current, time: event.target.value }))} />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-sm font-semibold">Duração em minutos</span>
              <input type="number" className="input w-full" required min={1} max={1440} step={1} value={draft.duration}
                onChange={event => setDraft(current => ({ ...current, duration: event.target.value }))} />
            </label>
          </div>
          {!editing && draft.frequency !== 'daily' && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {draft.frequency === 'weekly' ? 'A rotina se repete no dia da semana em que foi criada.' : 'A rotina se repete no dia do mês em que foi criada, nos meses com esse dia.'}
            </p>
          )}
        </fieldset>
        {formError && <p role="alert" className="text-sm text-[var(--color-text-secondary)]">{formError}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary min-h-11 disabled:opacity-50" disabled={saving || loadState !== 'ready' || !draft.title.trim()}>
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar rotina'}
          </button>
          <button type="button" className="btn btn-ghost min-h-11 disabled:opacity-50" disabled={saving} onClick={closeForm}>Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <ShellLayout>
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-surface-2)] pb-6">
          <div>
            <h1 className="font-orbitron text-2xl font-bold tracking-tight sm:text-3xl">Rotinas</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">Defina o ritmo dos seus hábitos e gere as tarefas dos próximos sete dias, a partir de hoje.</p>
          </div>
          <button ref={addButton} type="button" className="btn btn-primary min-h-11 disabled:opacity-50" onClick={() => showForm()} disabled={saving || loadState !== 'ready'}>
            <Plus size={18} aria-hidden="true" /> Nova rotina
          </button>
        </header>

        {editing === '' && <div className="card mt-5">{renderForm()}</div>}
        {loadState === 'loading' && <p role="status" className="py-6 text-[var(--color-text-secondary)]">Carregando rotinas…</p>}
        {loadState === 'error' && (
          <div className="card mt-5 space-y-3 p-4">
            <p role="alert">Não foi possível carregar suas rotinas.</p>
            <button type="button" className="btn btn-secondary min-h-11" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>
          </div>
        )}
        {loadState === 'ready' && !routines.length && editing === null && (
          <section className="card mt-5 p-5">
            <Repeat size={23} className="mb-2 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Que hábito você quer manter?</h2>
            <p className="mt-1 text-[var(--color-text-secondary)]">Comece com uma rotina curta e um horário que caiba no seu dia.</p>
          </section>
        )}
        {loadState === 'ready' && routines.length > 0 && (
          <section className="mt-5">
            <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{activeCount} {activeCount === 1 ? 'rotina ativa' : 'rotinas ativas'}</p>
            <ul className="space-y-3">
              {routines.map(routine => {
                const busy = Boolean(actions[routine.id]) || saving;
                const made = generated[routine.id];
                return (
                  <li key={routine.id} className="card min-w-0 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="min-w-0 break-words font-orbitron text-base font-semibold">{routine.title}</h2>
                      <span className={`badge ${routine.active ? 'badge-success' : 'badge-warning'}`}>{routine.active ? 'Ativa' : 'Pausada'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                      <span className="inline-flex items-center gap-1.5"><Repeat size={15} aria-hidden="true" /> {recurrence(routine)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" /> {routine.time} · {routine.duration} min</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="btn btn-primary min-h-11 disabled:opacity-50" disabled={busy || !routine.active}
                        onClick={() => void runAction(routine.id, 'Gerando…', async () => {
                          setGenerated(current => ({ ...current, [routine.id]: undefined }));
                          const tasks = await apiPost<Task[]>(`/routines/${routine.id}/generate-tasks?days=7`);
                          setGenerated(current => ({ ...current, [routine.id]: tasks.length }));
                        }, 'A geração não terminou. Você pode tentar de novo sem duplicar as tarefas.')}>
                        <CalendarDays size={16} aria-hidden="true" /> {actions[routine.id] === 'Gerando…' ? 'Gerando…' : 'Gerar para 7 dias'}
                      </button>
                      <button type="button" className="btn btn-secondary min-h-11 disabled:opacity-50" disabled={busy}
                        onClick={() => void runAction(routine.id, 'Atualizando…', async () => {
                          replaceRoutine(await apiPatch<Routine>(`/routines/${routine.id}`, { active: !routine.active }));
                        }, 'Não foi possível alterar a situação da rotina.')}>
                        {routine.active ? 'Pausar' : 'Retomar'}
                      </button>
                      <button ref={editing === routine.id ? editButton : undefined} type="button" className="btn btn-ghost min-h-11 disabled:opacity-50" disabled={busy}
                        onClick={() => showForm(routine)}>
                        <Pencil size={16} aria-hidden="true" /> Editar
                      </button>
                      <button type="button" className="btn btn-ghost min-h-11 hover:text-[var(--color-danger)]" disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Excluir “${routine.title}” e as tarefas vinculadas a ela, incluindo as concluídas?`)) return;
                          void runAction(routine.id, 'Excluindo…', async () => {
                            await apiDelete(`/routines/${routine.id}`);
                            setRoutines(current => current.filter(item => item.id !== routine.id));
                            if (editing === routine.id) closeForm();
                            addButton.current?.focus();
                          }, 'Não foi possível excluir a rotina.');
                        }}>
                        <Trash2 size={16} aria-hidden="true" /> Excluir
                      </button>
                    </div>
                    {!routine.active && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">As tarefas já geradas continuam na agenda.</p>}
                    {errors[routine.id] && <p role="alert" className="mt-2 text-sm">{errors[routine.id]}</p>}
                    {made !== undefined && (
                      <div className="mt-3 border-t border-[var(--color-surface-2)] pt-3">
                        <p role="status" className="text-sm">
                          {made ? `${made} ${made === 1 ? 'nova tarefa gerada' : 'novas tarefas geradas'}.` : 'Nenhuma nova tarefa prevista neste período.'}
                        </p>
                        <Link href="/relatorio/" className="inline-flex min-h-10 items-center text-sm font-semibold underline decoration-[var(--color-primary)] underline-offset-4">Ver revisão semanal</Link>
                      </div>
                    )}
                    {editing === routine.id && <div className="mt-4 rounded-lg border border-[var(--color-surface-2)]">{renderForm()}</div>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </ShellLayout>
  );
}

export default function RotinasPage() {
  return <Suspense fallback={<p role="status" className="p-6">Carregando rotinas…</p>}><RoutineContent /></Suspense>;
}
