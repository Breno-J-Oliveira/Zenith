import { Injectable } from '@nestjs/common';
import { GoalsService } from '../goals/goals.service';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
import {
  Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class TasksService {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateTaskDTO): Promise<Task> {
    const record = await this.prisma.task.create({
      data: {
        userId: MOCK_USER_ID,
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

  async findAll(filter?: { goalId?: string; status?: TaskStatus }): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: {
        userId: MOCK_USER_ID,
        ...(filter?.goalId && { goalId: filter.goalId }),
        ...(filter?.status && { status: filter.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toTask(r));
  }

  async findOne(id: string): Promise<Task> {
    return this.goalsService.findTask(id);
  }

  async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
    return this.goalsService.updateTask(id, dto);
  }

  async toggle(id: string): Promise<Task> {
    const task = await this.findOne(id);
    return this.goalsService.updateTask(id, {
      completed: !task.completed,
      status: !task.completed ? ('COMPLETED' as TaskStatus) : ('ACTIVE' as TaskStatus),
    });
  }

  async remove(id: string): Promise<void> {
    await this.goalsService.removeTask(id);
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
