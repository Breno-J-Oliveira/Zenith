import { Injectable } from '@nestjs/common';
import { RoutinesService } from '../routines/routines.service';
import {
  Appointment, CreateAppointmentDTO,
  ReorganizationResult, MovedTask, Task,
} from '../../../../packages/shared/src/types';

/**
 * SchedulerService — Heurística de reorganização de rotina
 *
 * Quando um compromisso pontual (Appointment) é criado para um dia,
 * o Scheduler verifica se existe conflito de horário com tarefas de rotina
 * já geradas para aquele dia.
 *
 * Regra de conflito: sobreposição de intervalos [startTime, endTime) da tarefa
 * vs [startTime, endTime) do compromisso.
 *
 * Heurística de realocação (simples e determinística):
 * 1. Tenta encaixar a tarefa DEPOIS do compromisso (startTime = appointment.endTime)
 * 2. Se não couber (passa das 23h), tenta ANTES (endTime = appointment.startTime)
 * 3. Se não couber em nenhum caso, mantém a tarefa onde está (não move)
 *
 * Exemplo (do ANOTAÇÕES.md):
 *   Rotina: Estudo React 14h-16h
 *   Compromisso: Reunião 14h-16h
 *   Conflito detectado → move Estudo React para 16h-18h (depois do compromisso)
 */
@Injectable()
export class SchedulerService {
  private appointments: Appointment[] = [];

  constructor(private readonly routinesService: RoutinesService) {}

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

    for (const task of dayTasks) {
      const taskTime = (task as any).time as string;
      const taskDuration = (task as any).duration as number;
      if (!taskTime) continue;

      const taskStart = this.toMinutes(taskTime);
      const taskEnd = taskStart + (taskDuration || 60);

      const apptStart = this.toMinutes(appointment.startTime);
      const apptEnd = this.toMinutes(appointment.endTime);

      const hasConflict = taskStart < apptEnd && taskEnd > apptStart;
      if (!hasConflict) continue;

      const newSlot = this.findFreeSlot(appointment, dayTasks, taskDuration || 60);
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

  /**
   * Encontra um horário livre para mover a tarefa conflitante.
   * Regra: tenta depois do compromisso primeiro, depois antes.
   * "Livre" = não sobrepõe com outros compromissos nem tarefas já existentes no dia.
   */
  private findFreeSlot(
    appointment: Appointment,
    dayTasks: Task[],
    duration: number,
  ): { time: string } | null {
    const apptEnd = this.toMinutes(appointment.endTime);
    const apptStart = this.toMinutes(appointment.startTime);

    const busy: Array<{ start: number; end: number }> = [
      { start: apptStart, end: apptEnd },
      ...dayTasks.map(t => {
        const s = this.toMinutes((t as any).time || '00:00');
        return { start: s, end: s + ((t as any).duration || 60) };
      }),
      ...this.appointments
        .filter(a => a.date === appointment.date && a.id !== appointment.id)
        .map(a => ({ start: this.toMinutes(a.startTime), end: this.toMinutes(a.endTime) })),
    ];

    // Tentativa 1: depois do compromisso
    let candidateStart = apptEnd;
    let candidateEnd = candidateStart + duration;
    if (candidateEnd <= this.toMinutes('23:59')) {
      if (!this.overlapsAny(candidateStart, candidateEnd, busy, appointment.id)) {
        return { time: this.fromMinutes(candidateStart) };
      }
    }

    // Tentativa 2: antes do compromisso
    candidateEnd = apptStart;
    candidateStart = candidateEnd - duration;
    if (candidateStart >= this.toMinutes('00:00')) {
      if (!this.overlapsAny(candidateStart, candidateEnd, busy, appointment.id)) {
        return { time: this.fromMinutes(candidateStart) };
      }
    }

    return null;
  }

  private overlapsAny(start: number, end: number, busy: Array<{ start: number; end: number }>, excludeApptId: string): boolean {
    return busy.some(b => start < b.end && end > b.start);
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

  private formatDate(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
