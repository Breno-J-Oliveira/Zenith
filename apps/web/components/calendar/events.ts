import type { Task } from '@zenith/shared';
import { apiGet } from '@/lib/api';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'task' | 'appointment' | 'routine';
  sourceId: string;
  done?: boolean;
}

export async function loadCalendarEvents(from: string, to: string, signal?: AbortSignal) {
  const options = { params: { from, to }, signal };
  const [events, tasks] = await Promise.all([
    apiGet<CalendarEvent[]>('/calendar', options),
    apiGet<Task[]>('/tasks', options),
  ]);
  const taskById = new Map(tasks.map(task => [task.id, task]));
  const scheduled = new Set<string>();
  const agenda = events.flatMap(event => {
    if (event.type === 'appointment') return [event];
    if (taskById.get(event.sourceId)?.status === 'CANCELLED') return [];
    scheduled.add(event.sourceId);
    if (event.type !== 'task') return [event];
    return [{ ...event, start: event.start.slice(0, 10), end: undefined }];
  });
  for (const task of tasks) {
    if (!task.date || task.status === 'CANCELLED' || scheduled.has(task.id)) continue;
    agenda.push({
      id: `cal-task-${task.id}`, title: task.title, start: task.date,
      type: 'task', sourceId: task.id, done: task.completed || task.status === 'COMPLETED',
    });
  }
  return agenda.sort((first, second) => first.start.localeCompare(second.start));
}
