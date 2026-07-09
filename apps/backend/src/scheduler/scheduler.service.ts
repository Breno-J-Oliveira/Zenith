import { Injectable } from '@nestjs/common';
import { RoutinesService } from '../routines/routines.service';
import { ConflictResolver } from '../shared/conflict-resolver.service';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
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
  constructor(
    private readonly routinesService: RoutinesService,
    private readonly conflictResolver: ConflictResolver,
    private readonly prisma: PrismaService,
  ) {}

  async createAppointment(dto: CreateAppointmentDTO): Promise<ReorganizationResult> {
    const appointment = await this.prisma.appointment.create({
      data: {
        userId: MOCK_USER_ID,
        title: dto.title,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });

    return this.reorganizeDay(this.toAppointment(appointment));
  }

  async findAll(): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { userId: MOCK_USER_ID },
      orderBy: { date: 'asc' },
    });
    return records.map(r => this.toAppointment(r));
  }

  private async reorganizeDay(appointment: Appointment): Promise<ReorganizationResult> {
    const dayTasks = await this.routinesService.getTasksForDate(appointment.date);
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

      const busy = await this.buildBusyList(appointment.date, dayTasks, task.id, appointment.id);

      const newSlot = this.conflictResolver.findFreeSlot({
        conflictStart: apptStart,
        conflictEnd: apptEnd,
        duration: taskDuration || 60,
        busy,
      });
      if (!newSlot) continue;

      await this.routinesService.updateGeneratedTask(task.id, {
        date: appointment.date,
        time: newSlot.time,
      } as any);

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

  private async buildBusyList(date: string, dayTasks: Task[], excludeTaskId: string, excludeApptId: string) {
    const appts = await this.prisma.appointment.findMany({
      where: { date, id: { not: excludeApptId } },
    });

    return [
      ...dayTasks
        .filter(t => t.id !== excludeTaskId)
        .map(t => {
          const s = this.conflictResolver.toMinutes((t as any).time || '00:00');
          return { start: s, end: s + ((t as any).duration || 60) };
        }),
      ...appts.map(a => ({
        start: this.conflictResolver.toMinutes(a.startTime),
        end: this.conflictResolver.toMinutes(a.endTime),
      })),
    ];
  }

  private toAppointment(r: any): Appointment {
    return {
      id: r.id,
      title: r.title,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private formatDate(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
