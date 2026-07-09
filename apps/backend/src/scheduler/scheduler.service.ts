import { Injectable } from '@nestjs/common';
import { RoutinesService } from '../routines/routines.service';
import { ConflictResolver } from '../shared/conflict-resolver.service';
import {
  Appointment, CreateAppointmentDTO,
  ReorganizationResult, MovedTask, Task,
} from '../../../../packages/shared/src/types';

/**
 * SchedulerService — Reorganização de rotina quando um compromisso é criado.
 *
 * Usa ConflictResolver compartilhado para encontrar horário livre
 * (heurística: depois do conflito → antes do conflito).
 */
@Injectable()
export class SchedulerService {
  private appointments: Appointment[] = [];

  constructor(
    private readonly routinesService: RoutinesService,
    private readonly conflictResolver: ConflictResolver,
  ) {}

  createAppointment(dto: CreateAppointmentDTO): ReorganizationResult {
    const appointment: Appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: dto.title,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      createdAt: new Date().toISOString(),
    };
    this.appointments.push(appointment);

    return this.reorganizeDay(appointment);
  }

  findAll(): Appointment[] {
    return this.appointments;
  }

  private reorganizeDay(appointment: Appointment): ReorganizationResult {
    const dayTasks = this.routinesService.getTasksForDate(appointment.date);
    const moved: MovedTask[] = [];

    const apptStart = this.conflictResolver.toMinutes(appointment.startTime);
    const apptEnd = this.conflictResolver.toMinutes(appointment.endTime);

    for (const task of dayTasks) {
      const taskTime = (task as any).time as string;
      const taskDuration = (task as any).duration as number;
      if (!taskTime) continue;

      const taskStart = this.conflictResolver.toMinutes(taskTime);
      const taskEnd = taskStart + (taskDuration || 60);

      if (!this.conflictResolver.hasConflict(taskStart, taskEnd, apptStart, apptEnd)) continue;

      const busy = this.buildBusyList(appointment.date, dayTasks, task.id, appointment.id);

      const newSlot = this.conflictResolver.findFreeSlot({
        conflictStart: apptStart,
        conflictEnd: apptEnd,
        duration: taskDuration || 60,
        busy,
      });
      if (!newSlot) continue;

      this.routinesService.updateGeneratedTask(task.id, {
        date: appointment.date,
      } as any);
      (task as any).time = newSlot.time;

      moved.push({
        taskId: task.id,
        taskTitle: task.title,
        from: { date: appointment.date, time: taskTime },
        to: { date: appointment.date, time: newSlot.time },
      });
    }

    const message = moved.length > 0
      ? `Reorganizei sua rotina do dia ${this.formatDate(appointment.date)}. ${moved.map(m => `${m.taskTitle} movida para ${m.to.time}`).join(', ')}. Ok?`
      : `Compromisso criado para ${this.formatDate(appointment.date)}. Nenhuma rotina conflitante encontrada.`;

    return { appointment, moved, message };
  }

  private buildBusyList(date: string, dayTasks: Task[], excludeTaskId: string, excludeApptId: string) {
    return [
      ...dayTasks
        .filter(t => t.id !== excludeTaskId)
        .map(t => {
          const s = this.conflictResolver.toMinutes((t as any).time || '00:00');
          return { start: s, end: s + ((t as any).duration || 60) };
        }),
      ...this.appointments
        .filter(a => a.date === date && a.id !== excludeApptId)
        .map(a => ({
          start: this.conflictResolver.toMinutes(a.startTime),
          end: this.conflictResolver.toMinutes(a.endTime),
        })),
    ];
  }

  private formatDate(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
