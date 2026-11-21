'use client';

import { CalendarView } from '../../components/calendar/CalendarView';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, List, Pencil, Plus } from 'lucide-react';
import type { Appointment, CreateAppointmentDTO } from '@zenith/shared';
import { addCivilDays, civilDateAnchor, getCivilDate } from '../../../../packages/shared/src/civil-date';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { EventBadge } from '../../components/calendar/EventBadge';
import { loadCalendarEvents, type CalendarEvent } from '../../components/calendar/events';
import { apiPost, apiPut } from '@/lib/api';

const longDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
});
const emptyDraft = (date: string) => ({ title: '', date, startTime: '09:00', endTime: '09:30' });

export default function CalendarioPage() {
  const today = getCivilDate();
  const [date, setDate] = useState(today);
  const [view, setView] = useState<'agenda' | 'grid'>('agenda');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState<{ id?: string; requestId: string; draft: CreateAppointmentDTO }>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const titleField = useRef<HTMLInputElement>(null);
  const formTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (view !== 'agenda') return;
    const controller = new AbortController();
    setLoadState('loading');
    loadCalendarEvents(date, date, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setEvents(items);
        setLoadState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setLoadState('error'); });
    return () => controller.abort();
  }, [date, view, attempt]);

  const openRequestId = form?.requestId;
  useEffect(() => { if (openRequestId) titleField.current?.focus(); }, [openRequestId]);

  function selectDate(next: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || !Number.isFinite(civilDateAnchor(next).getTime())) return;
    if (next !== date || view !== 'agenda') setLoadState('loading');
    setDate(next);
    setView('agenda');
  }

  function openForm(event?: CalendarEvent) {
    setFormError('');
    setNotice('');
    setForm({
      id: event?.sourceId, requestId: crypto.randomUUID(),
      draft: event ? {
        title: event.title, date: event.start.slice(0, 10),
        startTime: event.start.slice(11, 16), endTime: event.end?.slice(11, 16) ?? '',
      } : emptyDraft(date),
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving || !form.draft.title.trim()) return;
    const draft = { ...form.draft, title: form.draft.title.trim() };
    if (draft.endTime <= draft.startTime) {
      setFormError('O horário de fim precisa ser depois do início, no mesmo dia.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const saved = form.id
        ? await apiPut<Appointment>(`/appointments/${form.id}`, draft)
        : await apiPost<Appointment>('/appointments/manual', { ...draft, requestId: form.requestId });
      const matches = saved.title === draft.title && saved.date === draft.date &&
        saved.startTime === draft.startTime && saved.endTime === draft.endTime;
      setNotice(matches ? 'Compromisso salvo.' : 'A primeira versão foi salva. Abra o compromisso na agenda para ajustar os detalhes.');
      selectDate(saved.date);
      setAttempt(previous => previous + 1);
      setForm(undefined);
      requestAnimationFrame(() => formTrigger.current?.focus());
    } catch {
      setFormError('Não foi possível salvar. Seu preenchimento foi mantido.');
    } finally {
      setSaving(false);
    }
  }

  function change(field: keyof CreateAppointmentDTO, value: string) {
    setForm(current => current && { ...current, draft: { ...current.draft, [field]: value } });
  }

  const dateLabel = longDate.format(civilDateAnchor(date));

  return (
    <ShellLayout>
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-surface-2)] pb-6">
          <div>
            <h1 className="font-orbitron text-2xl font-bold tracking-tight sm:text-3xl">Calendário</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">Tarefas, rotinas e compromissos no mesmo dia.</p>
          </div>
          <button ref={formTrigger} className="btn btn-primary min-h-11 disabled:opacity-50" type="button"
            onClick={() => openForm()} disabled={Boolean(form)}>
            <Plus size={18} aria-hidden="true" /> Novo compromisso
          </button>
        </header>

        {form && (
          <form className="card mt-5 space-y-4 p-4 sm:p-5" onSubmit={save}>
            <h2 className="font-orbitron text-base font-semibold">{form.id ? 'Editar compromisso' : 'Novo compromisso'}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Horário de Brasília. Salvar preserva os horários dos outros itens.</p>
            <fieldset className="min-w-0 space-y-3" disabled={saving}>
              <label className="block space-y-1">
                <span className="text-sm font-semibold">Título</span>
                <input ref={titleField} className="input w-full" value={form.draft.title} maxLength={200}
                  required onChange={event => change('title', event.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block min-w-0 space-y-1">
                  <span className="text-sm font-semibold">Data</span>
                  <input className="input min-w-0 w-full" type="date" value={form.draft.date} required
                    onChange={event => change('date', event.target.value)} />
                </label>
                <label className="block min-w-0 space-y-1">
                  <span className="text-sm font-semibold">Início</span>
                  <input className="input min-w-0 w-full" type="time" value={form.draft.startTime} required
                    onChange={event => change('startTime', event.target.value)} />
                </label>
                <label className="block min-w-0 space-y-1">
                  <span className="text-sm font-semibold">Fim</span>
                  <input className="input min-w-0 w-full" type="time" value={form.draft.endTime} required
                    onChange={event => change('endTime', event.target.value)} />
                </label>
              </div>
            </fieldset>
            {formError && <p role="alert" className="text-sm text-[var(--color-text-secondary)]">{formError}</p>}
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary min-h-11 disabled:opacity-50" type="submit" disabled={saving || !form.draft.title.trim()}>
                {saving ? 'Salvando…' : 'Salvar compromisso'}
              </button>
              <button className="btn btn-ghost min-h-11 disabled:opacity-50" type="button" disabled={saving}
                onClick={() => { setForm(undefined); requestAnimationFrame(() => formTrigger.current?.focus()); }}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div role="group" aria-label="Visualização do calendário" className="inline-flex gap-1 rounded-lg bg-[var(--color-surface-1)] p-1">
            {([
              { id: 'agenda', label: 'Agenda', Icon: List },
              { id: 'grid', label: 'Grade', Icon: CalendarDays },
            ] as const).map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-pressed={view === id}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold ${view === id ? 'bg-[var(--color-surface-3)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}
                onClick={() => id === 'agenda' ? selectDate(date) : setView('grid')}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          {view === 'agenda' && (
            <div role="group" aria-label="Navegar por data" className="flex flex-wrap items-center gap-1.5">
              <button className="btn btn-secondary min-h-11" type="button" aria-label="Dia anterior"
                onClick={() => selectDate(addCivilDays(date, -1))}><ChevronLeft size={18} aria-hidden="true" /></button>
              <input type="date" aria-label="Selecionar data" value={date} className="input min-h-11 min-w-0"
                onChange={event => selectDate(event.target.value)} />
              <button className="btn btn-secondary min-h-11" type="button" aria-label="Próximo dia"
                onClick={() => selectDate(addCivilDays(date, 1))}><ChevronRight size={18} aria-hidden="true" /></button>
              <button className="btn btn-ghost min-h-11" type="button" onClick={() => selectDate(today)}>Hoje</button>
            </div>
          )}
        </div>

        {notice && <p role="status" className="mb-4 rounded-md border border-[var(--border-default)] px-4 py-3">{notice}</p>}

        {view === 'grid' ? <CalendarView date={date} onSelectDate={selectDate} onMessage={setNotice} /> : (
          <section aria-label="Agenda do dia">
            <h2 className="mb-3 text-lg font-bold"><time dateTime={date}>{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</time></h2>
            {loadState === 'loading' && <p role="status" className="py-4 text-[var(--color-text-secondary)]">Carregando agenda…</p>}
            {loadState === 'error' && (
              <div className="card space-y-3 p-4">
                <p role="alert">Não foi possível carregar a agenda deste dia.</p>
                <button type="button" className="btn btn-secondary min-h-11" onClick={() => setAttempt(previous => previous + 1)}>Tentar novamente</button>
              </div>
            )}
            {loadState === 'ready' && (!events.length ? (
              <div className="card p-5">
                <p className="font-semibold">Nada planejado para este dia.</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Crie um compromisso ou planeje uma tarefa em Hoje.</p>
              </div>
            ) : (
              <ul className="card divide-y divide-[var(--color-surface-2)]">
                {events.map(event => (
                  <li key={event.id} className="grid min-w-0 gap-2 px-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
                    <p className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {event.start.includes('T') ? <><Clock size={14} aria-hidden="true" /> {event.start.slice(11, 16)}{event.end && ` – ${event.end.slice(11, 16)}`}</> : 'Sem horário'}
                    </p>
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{event.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <EventBadge type={event.type} />
                        {event.done && <span className="text-sm text-[var(--color-text-secondary)]">Concluída</span>}
                      </div>
                    </div>
                    {event.type === 'appointment' && (
                      <button type="button" className="btn btn-ghost min-h-11 justify-self-start disabled:opacity-50"
                        aria-label={`Editar ${event.title}`} disabled={Boolean(form)} onClick={() => openForm(event)}>
                        <Pencil size={15} aria-hidden="true" /> Editar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </section>
        )}
      </div>
    </ShellLayout>
  );
}
