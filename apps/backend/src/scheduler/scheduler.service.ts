import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { RoutinesService } from '../routines/routines.service';
import { ConflictResolver } from '../shared/conflict-resolver.service';
import { PrismaService } from '../prisma.service';
import {
  Appointment, CreateAppointmentDTO,
  ReorganizationResult, MovedTask, Task,
} from '../../../../packages/shared/src/types';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly routinesService: RoutinesService,
    private readonly conflictResolver: ConflictResolver,
    private readonly prisma: PrismaService,
  ) {}

  private appointmentFields(dto: CreateAppointmentDTO) {
    const title = typeof dto?.title === 'string' ? dto.title.trim() : '';
    const { date, startTime, endTime } = dto ?? {};
    const civil = /^\d{4}-\d{2}-\d{2}$/;
    const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const day = typeof date === 'string' && civil.test(date) ? new Date(date + 'T00:00:00Z') : null;
    if (!title || title.length > 200) throw new BadRequestException('Informe um título de até 200 caracteres.');
    if (!day || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('Informe uma data válida.');
    }
    if (typeof startTime !== 'string' || typeof endTime !== 'string' ||
        !time.test(startTime) || !time.test(endTime) || endTime <= startTime) {
      throw new BadRequestException('O fim deve ser após o início no mesmo dia.');
    }
    return { title, date, startTime, endTime };
  }

  async createManualAppointment(userId: string, dto: CreateAppointmentDTO & { requestId: string }): Promise<Appointment> {
    const fields = this.appointmentFields(dto);
    const requestId = dto.requestId;
    if (typeof requestId !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(requestId)) {
      throw new BadRequestException('Identificador de criação inválido.');
    }
    const id = 'manual-' + createHash('sha256').update(JSON.stringify([userId, requestId.toLowerCase()])).digest('hex');
    try {
      const record = await this.prisma.appointment.create({ data: { id, userId, ...fields } });
      return this.toAppointment(record);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const existing = await this.prisma.appointment.findFirst({ where: { id, userId } });
      if (!existing) throw error;
      return this.toAppointment(existing);
    }
  }

  async updateAppointment(userId: string, id: string, dto: CreateAppointmentDTO): Promise<Appointment> {
    const data = this.appointmentFields(dto);
    try {
      return this.toAppointment(await this.prisma.appointment.update({ where: { id, userId }, data }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Compromisso não encontrado.');
      }
      throw error;
    }
  }

  async createAppointment(userId: string, dto: CreateAppointmentDTO): Promise<ReorganizationResult> {
    const appointment = await this.prisma.appointment.create({
      data: { userId, ...this.appointmentFields(dto) },
    });

    return this.reorganizeDay(userId, this.toAppointment(appointment));
  }

  async findAll(userId: string): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    return records.map(r => this.toAppointment(r));
  }

  private async reorganizeDay(userId: string, appointment: Appointment): Promise<ReorganizationResult> {
    const dayTasks = await this.routinesService.getTasksForDate(userId, appointment.date);
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

      const busy = await this.buildBusyList(userId, appointment.date, dayTasks, task.id, appointment.id);

      const newSlot = this.conflictResolver.findFreeSlot({
        conflictStart: apptStart,
        conflictEnd: apptEnd,
        duration: taskDuration || 60,
        busy,
      });
      if (!newSlot) continue;

      await this.routinesService.updateGeneratedTask(userId, task.id, {
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

  private async buildBusyList(userId: string, date: string, dayTasks: Task[], excludeTaskId: string, excludeApptId: string) {
    const appts = await this.prisma.appointment.findMany({
      where: { userId, date, id: { not: excludeApptId } },
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
