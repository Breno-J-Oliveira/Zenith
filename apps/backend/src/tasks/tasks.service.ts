import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalsService } from '../goals/goals.service';
import { PrismaService } from '../prisma.service';
import {
  Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class TasksService {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateTaskDTO): Promise<Task> {
    // Se goalId for fornecido, valida ownership
    if (dto.goalId) {
      await this.goalsService.findOne(userId, dto.goalId);
    }
    const record = await this.prisma.task.create({
      data: {
        userId,
        goalId: dto.goalId || null,
        milestoneId: dto.milestoneId || null,
        title: dto.title,
        description: dto.description || null,
        date: dto.date || null,
        status: 'ACTIVE',
        completed: false,
      },
    });
    return this.toTask(record);
  }

  async findAll(userId: string, filter?: { goalId?: string; status?: TaskStatus }): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: {
        userId,
        ...(filter?.goalId && { goalId: filter.goalId }),
        ...(filter?.status && { status: filter.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toTask(r));
  }

  async findOne(userId: string, id: string): Promise<Task> {
    const record = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!record) throw new NotFoundException(`Task ${id} not found`);
    return this.toTask(record);
  }

  async update(userId: string, id: string, dto: UpdateTaskDTO): Promise<Task> {
    await this.findOne(userId, id); // ownership
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
        ...(dto.date !== undefined && { date: dto.date }),
      },
    });
    return this.toTask(record);
  }

  async toggle(userId: string, id: string): Promise<Task> {
    const task = await this.findOne(userId, id);
    return this.update(userId, id, {
      completed: !task.completed,
      status: !task.completed ? ('COMPLETED' as TaskStatus) : ('ACTIVE' as TaskStatus),
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  private toTask(r: any): Task {
    return {
      id: r.id,
      goalId: r.goalId || undefined,
      milestoneId: r.milestoneId || undefined,
      title: r.title,
      description: r.description || undefined,
      status: r.status as TaskStatus,
      date: r.date || undefined,
      completed: r.completed,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
