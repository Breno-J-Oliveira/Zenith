'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBr from '@fullcalendar/core/locales/pt-br';
import type { EventDropArg } from '@fullcalendar/core';
import { apiPatch, apiPut } from '@/lib/api';
import { addCivilDays, getCivilDate, getCivilTime, ZENITH_TIME_ZONE } from '../../../../packages/shared/src/civil-date';
import { loadCalendarEvents, type CalendarEvent } from './events';

const eventColors: Record<CalendarEvent['type'], string> = {
  task: 'var(--color-primary)', routine: 'var(--color-text-muted)', appointment: '#7254b8',
};

function getCalendarNow() {
  const instant = new Date();
  return `${getCivilDate(instant)}T${getCivilTime(instant)}:00`;
}

export function CalendarView({ date, onSelectDate, onMessage }: {
  date: string;
  onSelectDate: (date: string) => void;
  onMessage: (message: string) => void;
}) {
  const [range, setRange] = useState<{ from: string; to: string }>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!range) return;
    const controller = new AbortController();
    setLoadState('loading');
    loadCalendarEvents(range.from, range.to, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setEvents(items);
        setLoadState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setLoadState('error'); });
    return () => controller.abort();
  }, [range, attempt]);

  async function move({ event, revert }: EventDropArg) {
    if (saving) { revert(); return; }
    setSaving(true);
    try {
      const { sourceId, type } = event.extendedProps;
      if (type === 'task') {
        await apiPut(`/tasks/${sourceId}`, { date: event.startStr.slice(0, 10) });
        onMessage('Data da tarefa atualizada.');
      } else {
        const result = await apiPatch<{ message: string }>('/calendar/reschedule', {
          eventId: event.id, type: 'task', newStart: event.startStr, newEnd: event.endStr || undefined,
        });
        onMessage(result.message);
      }
      setAttempt(previous => previous + 1);
    } catch {
      revert();
      onMessage('Não foi possível mover o item. Confira se a data foi salva antes de tentar novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card min-w-0 p-3 sm:p-4">
      {loadState === 'error' && <div className="mb-3 flex flex-wrap items-center gap-2">
        <p role="alert">Não foi possível carregar a grade.</p>
        <button className="btn btn-secondary min-h-11" type="button" onClick={() => setAttempt(previous => previous + 1)}>Tentar novamente</button>
      </div>}
      {loadState === 'loading' && <p role="status" className="mb-3 text-sm text-[var(--color-text-secondary)]">Carregando grade…</p>}
      <style>{`
        .zenith-calendar .fc-toolbar { flex-wrap: wrap; gap: .75rem; }
        .zenith-calendar .fc-toolbar-title { font-family: var(--font-orbitron); font-size: 1rem; }
        .zenith-calendar .fc-button-primary { background: var(--color-surface-2); border-color: var(--border-default); color: var(--color-text); min-height: 2.75rem; }
        .zenith-calendar .fc-button-primary:not(:disabled).fc-button-active { background: var(--color-surface-3); border-color: var(--color-primary); }
        .zenith-calendar .fc-day-today { background: var(--color-primary-subtle) !important; }
        .zenith-calendar .fc-theme-standard td, .zenith-calendar .fc-theme-standard th,
        .zenith-calendar .fc-theme-standard .fc-scrollgrid { border-color: var(--border-default); }
        .zenith-calendar .fc-event { cursor: pointer; border-radius: .25rem; }
      `}</style>
      <div className="zenith-calendar min-w-0">
        <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} locale={ptBr}
          timeZone={ZENITH_TIME_ZONE} now={getCalendarNow} initialDate={date} initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          height="auto" slotMinTime="00:00:00" slotMaxTime="24:00:00" nowIndicator dayMaxEvents={3}
          editable={!saving && loadState === 'ready'} eventDurationEditable={false} eventDrop={move}
          dateClick={event => onSelectDate(event.dateStr.slice(0, 10))}
          eventClick={({ event }) => onSelectDate(event.startStr.slice(0, 10))}
          datesSet={({ startStr, endStr }) => {
            const from = startStr.slice(0, 10);
            const to = addCivilDays(endStr.slice(0, 10), -1);
            setRange(current => current?.from === from && current.to === to ? current : { from, to });
          }}
          events={loadState === 'ready' ? events.map(event => ({
            id: event.id, title: event.done ? `✓ ${event.title}` : event.title, start: event.start, end: event.end,
            allDay: event.type === 'task', startEditable: event.type !== 'appointment' && !saving, durationEditable: false,
            backgroundColor: event.done ? 'var(--color-surface-3)' : eventColors[event.type],
            borderColor: event.done ? 'var(--color-surface-3)' : eventColors[event.type],
            extendedProps: { type: event.type, sourceId: event.sourceId },
          })) : []} />
      </div>
    </div>
  );
}
