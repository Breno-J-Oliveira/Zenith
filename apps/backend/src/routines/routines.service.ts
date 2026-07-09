import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
import {
  Routine, CreateRoutineDTO, UpdateRoutineDTO,
  RoutineFrequency, Task, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoutineDTO): Promise<Routine> {
    const record = await this.prisma.routine.create({
      data: {
        userId: MOCK_USER_ID,
        title: dto.title,
        frequency: (dto.frequency || 'daily') as string,
        time: dto.time,
        duration: dto.duration || 60,
        active: true,
        adaptable: true,
      },
    });
    return this.toRoutine(record);
  }

  async findAll(filter?: { active?: boolean }): Promise<Routine[]> {
    const records = await this.prisma.routine.findMany({
      where: {
        userId: MOCK_USER_ID,
        ...(filter?.active !== undefined && { active: filter.active }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toRoutine(r));
  }

  async findOne(id: string): Promise<Routine> {
    const record = await this.prisma.routine.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Routine ${id} not found`);
    return this.toRoutine(record);
  }

  async update(id: string, dto: UpdateRoutineDTO): Promise<Routine> {
    const record = await this.prisma.routine.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.time !== undefined && { time: dto.time }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.adaptable !== undefined && { adaptable: dto.adaptable }),
      },
    });
    return this.toRoutine(record);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.task.deleteMany({ where: { routineId: id } });
    await this.prisma.routine.delete({ where: { id } });
  }

  async generateTasks(routineId: string, days: number = 7): Promise<Task[]> {
    const routine = await this.findOne(routineId);
    const tasks: Task[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      let shouldGenerate = false;
      if (routine.frequency === 'daily') {
        shouldGenerate = true;
      } else if (routine.frequency === 'weekly') {
        const createdDate = new Date(routine.createdAt);
        shouldGenerate = date.getDay() === createdDate.getDay();
      } else if (routine.frequency === 'monthly') {
        shouldGenerate = date.getDate() === new Date(routine.createdAt).getDate();
      }

      if (shouldGenerate) {
        const existing = await this.prisma.task.findFirst({
          where: { routineId: routine.id, date: dateStr },
        });
        if (existing) continue;

        const record = await this.prisma.task.create({
          data: {
            userId: MOCK_USER_ID,
            routineId: routine.id,
            title: routine.title,
            date: dateStr,
            status: 'ACTIVE',
            completed: false,
            time: routine.time,
            duration: routine.duration,
          },
        });
        tasks.push(this.toRoutineTask(record));
      }
    }

    return tasks;
  }

  async getGeneratedTasks(): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: { userId: MOCK_USER_ID, routineId: { not: null } },
      orderBy: { date: 'asc' },
    });
    return records.map(r => this.toRoutineTask(r));
  }

  async getTasksForDate(date: string): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: { userId: MOCK_USER_ID, routineId: { not: null }, date },
      orderBy: { time: 'asc' },
    });
    return records.map(r => this.toRoutineTask(r));
  }

  async updateGeneratedTask(id: string, updates: Partial<Task> & { time?: string }): Promise<Task | null> {
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.title !== undefined && { title: updates.title }),
        ...((updates as any).time !== undefined && { time: (updates as any).time }),
      },
    });
    return this.toRoutineTask(record);
  }

  private toRoutine(r: any): Routine {
    return {
      id: r.id,
      title: r.title,
      frequency: r.frequency as RoutineFrequency,
      time: r.time,
      duration: r.duration,
      active: r.active,
      adaptable: r.adaptable,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toRoutineTask(r: any): Task {
    return {
      id: r.id,
      title: r.title,
      date: r.date || undefined,
      status: r.status as TaskStatus,
      completed: r.completed,
      createdAt: r.createdAt.toISOString(),
      ...((r as any).routineId && { routineId: (r as any).routineId }),
      ...((r as any).time && { time: (r as any).time, duration: (r as any).duration }),
    } as Task & { time?: string; duration?: number; routineId?: string };
  }
}
