'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const API = 'http://localhost:3002';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'appointment' | 'routine';
  sourceId: string;
  done?: boolean;
}

interface CalendarViewProps {
  onReorgMessage?: (message: string) => void;
}

const eventColors: Record<string, string> = {
  task: 'var(--color-primary)',
  routine: 'var(--color-text-dim)',
  appointment: '#8b5cf6',
};

export function CalendarView({ onReorgMessage }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    try {
      const from = start.split('T')[0];
      const to = end.split('T')[0];
      const res = await fetch(`${API}/calendar?from=${from}&to=${to}`);
      const data = await res.json();
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, []);

  const handleDatesChange = useCallback((info: { startStr: string; endStr: string }) => {
    fetchEvents(info.startStr, info.endStr);
  }, [fetchEvents]);

  const handleEventDrop = useCallback(async (info: any) => {
    const event = info.event;
    const eventId = event.id;
    const type = eventId.startsWith('cal-rtask-') ? 'task' :
                 eventId.startsWith('cal-task-') ? 'task' :
                 eventId.startsWith('cal-appt-') ? 'appointment' : 'task';

    const newStart = event.start.toISOString();
    const newEnd = event.end ? event.end.toISOString() : undefined;

    try {
      const res = await fetch(`${API}/calendar/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, type, newStart, newEnd }),
      });
      const data = await res.json();

      if (data.moved && data.moved.length > 0 && onReorgMessage) {
        onReorgMessage(data.message);
      }

      // Refresh events
      const calendar = calendarRef.current;
      if (calendar) {
        const view = calendar.getApi().view;
        fetchEvents(view.activeStart.toISOString(), view.activeEnd.toISOString());
      }
    } catch {
      info.revert();
    }
  }, [fetchEvents, onReorgMessage]);

  const calendarEvents = events.map(e => ({
    id: e.id,
    title: e.done ? `✓ ${e.title}` : e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.done ? 'var(--color-surface-2)' : eventColors[e.type],
    borderColor: e.done ? 'var(--color-surface-2)' : eventColors[e.type],
    textColor: e.done ? 'var(--color-text-dim)' : '#fff',
    editable: e.type !== 'appointment',
    extendedProps: { type: e.type, sourceId: e.sourceId, done: e.done },
  }));

  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-4">
      <style>{`
        .fc { color: var(--color-text); }
        .fc .fc-toolbar-title { font-family: var(--font-orbitron); font-size: 1.1rem; }
        .fc .fc-button {
          background: var(--color-surface-2);
          border: 1px solid var(--color-surface-2);
          color: var(--color-text-dim);
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .fc .fc-button:hover { color: var(--color-primary); border-color: var(--color-primary); }
        .fc .fc-button-active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
        .fc .fc-col-header-cell-cushion { color: var(--color-text-dim); font-family: var(--font-mono); font-size: 0.7rem; }
        .fc .fc-daygrid-day-number, .fc .fc-timegrid-slot-label-cushion { color: var(--color-text); font-family: var(--font-mono); font-size: 0.8rem; }
        .fc .fc-day-today { background: var(--color-surface-2) !important; }
        .fc .fc-event { cursor: pointer; border-radius: 4px; padding: 1px 4px; font-size: 0.75rem; }
        .fc .fc-timegrid-slot { border-color: var(--color-surface-2); }
        .fc .fc-scrollgrid, .fc .fc-scrollgrid-section > * { border-color: var(--color-surface-2); }
        .fc .fc-col-header-cell, .fc .fc-daygrid-day { border-color: var(--color-surface-2); }
        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--color-surface-2); }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="pt-br"
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        nowIndicator
        editable
        droppable
        eventResizableFromStart
        events={calendarEvents}
        datesSet={handleDatesChange}
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
      />
    </div>
  );
}
