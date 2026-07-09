import { Injectable } from '@nestjs/common';
import { GoalsService } from '../goals/goals.service';
import { RoutinesService } from '../routines/routines.service';
import { SchedulerService } from '../scheduler/scheduler.service';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'appointment' | 'routine';
  sourceId: string;
  done?: boolean;
}

export interface RescheduleDTO {
  eventId: string;
  type: 'task' | 'appointment';
  newStart: string;
  newEnd?: string;
}

export interface RescheduleResult {
  event: CalendarEvent;
  moved: Array<{ taskId: string; taskTitle: string; from: { date: string; time: string }; to: { date: string; time: string } }>;
  message: string;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly routinesService: RoutinesService,
    private readonly schedulerService: SchedulerService,
  ) {}

  getEvents(from: string, to: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Tasks from goals (with date)
    const goalsTasks = this.goalsService.getTasks();
    for (const task of goalsTasks) {
      if (!task.date) continue;
      if (task.date >= from && task.date <= to) {
        events.push({
          id: `cal-task-${task.id}`,
          title: task.title,
          start: `${task.date}T00:00:00`,
          end: `${task.date}T01:00:00`,
          type: 'task',
          sourceId: task.id,
          done: task.completed,
        });
      }
    }

    // Tasks from routines (generated)
    const routineTasks = this.routinesService.getGeneratedTasks();
    for (const task of routineTasks) {
      if (!task.date) continue;
      if (task.date >= from && task.date <= to) {
        const time = (task as any).time || '08:00';
        const duration = (task as any).duration || 60;
        const endMinutes = this.toMinutes(time) + duration;
        events.push({
          id: `cal-rtask-${task.id}`,
          title: task.title,
          start: `${task.date}T${time}:00`,
          end: `${task.date}T${this.fromMinutes(endMinutes)}:00`,
          type: 'routine',
          sourceId: task.id,
          done: task.completed,
        });
      }
    }

    // Appointments
    const appointments = this.schedulerService.findAll();
    for (const appt of appointments) {
      if (appt.date >= from && appt.date <= to) {
        events.push({
          id: `cal-appt-${appt.id}`,
          title: appt.title,
          start: `${appt.date}T${appt.startTime}:00`,
          end: `${appt.date}T${appt.endTime}:00`,
          type: 'appointment',
          sourceId: appt.id,
        });
      }
    }

    return events.sort((a, b) => a.start.localeCompare(b.start));
  }

  reschedule(dto: RescheduleDTO): RescheduleResult {
    const newDate = dto.newStart.split('T')[0];
    const newTime = dto.newStart.split('T')[1]?.substring(0, 5) || '08:00';

    // Extract sourceId from eventId (format: cal-task-xxx, cal-rtask-xxx, cal-appt-xxx)
    const sourceId = dto.eventId.replace(/^cal-(task|rtask|appt)-/, '');

    if (dto.type === 'task') {
      const task = this.routinesService.updateGeneratedTask(sourceId, {
        date: newDate,
      } as any);
      if (task) {
        (task as any).time = newTime;
      }

      // Check for conflicts with other events on the new date
      const dayTasks = this.routinesService.getTasksForDate(newDate);
      const moved: RescheduleResult['moved'] = [];

      const taskDuration = (task as any)?.duration || 60;
      const taskStart = this.toMinutes(newTime);
      const taskEnd = taskStart + taskDuration;

      for (const other of dayTasks) {
        if (other.id === sourceId) continue;
        const otherTime = (other as any).time || '00:00';
        const otherDuration = (other as any).duration || 60;
        const otherStart = this.toMinutes(otherTime);
        const otherEnd = otherStart + otherDuration;

        if (taskStart < otherEnd && taskEnd > otherStart) {
          const newSlot = this.findFreeSlotForDate(newDate, otherDuration, other.id, sourceId);
          if (newSlot) {
            (other as any).time = newSlot.time;
            moved.push({
              taskId: other.id,
              taskTitle: other.title,
              from: { date: newDate, time: otherTime },
              to: { date: newDate, time: newSlot.time },
            });
          }
        }
      }

      const message = moved.length > 0
        ? `Reorganizei sua rotina do dia ${newDate.split('-').reverse().join('/')}. ${moved.map(m => `${m.taskTitle} movida para ${m.to.time}`).join(', ')}.`
        : 'Tarefa reagendada sem conflitos.';

      const event: CalendarEvent = {
        id: `cal-rtask-${sourceId}`,
        title: task?.title || 'Task',
        start: dto.newStart,
        end: dto.newEnd || `${newDate}T${this.fromMinutes(taskStart + taskDuration)}:00`,
        type: 'routine',
        sourceId,
        done: task?.completed,
      };

      return { event, moved, message };
    }

    if (dto.type === 'appointment') {
      const event: CalendarEvent = {
        id: `cal-appt-${sourceId}`,
        title: 'Appointment',
        start: dto.newStart,
        end: dto.newEnd || dto.newStart,
        type: 'appointment',
        sourceId,
      };
      return { event, moved: [], message: 'Compromissos não podem ser reagendados via drag-and-drop ainda.' };
    }

    return { event: null as any, moved: [], message: 'Tipo de evento desconhecido.' };
  }

  private findFreeSlotForDate(
    date: string,
    duration: number,
    excludeTaskId: string,
    alsoExcludeTaskId: string,
  ): { time: string } | null {
    const dayTasks = this.routinesService.getTasksForDate(date);
    const busy: Array<{ start: number; end: number }> = dayTasks
      .filter(t => t.id !== excludeTaskId && t.id !== alsoExcludeTaskId)
      .map(t => {
        const s = this.toMinutes((t as any).time || '00:00');
        return { start: s, end: s + ((t as any).duration || 60) };
      });

    const appointments = this.schedulerService.findAll().filter(a => a.date === date);
    for (const appt of appointments) {
      busy.push({ start: this.toMinutes(appt.startTime), end: this.toMinutes(appt.endTime) });
    }

    // Try slots after the moved task's position, then before
    for (let start = 0; start <= 23 * 60; start += 30) {
      const end = start + duration;
      if (end > 23 * 60 + 59) break;
      if (!busy.some(b => start < b.end && end > b.start)) {
        return { time: this.fromMinutes(start) };
      }
    }

    return null;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private fromMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
