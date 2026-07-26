import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Goal, Milestone, Task,
  CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO,
  GoalStatus, GoalCategory, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDTO): Promise<Goal> {
    const record = await this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: (dto.category || 'pessoal') as string,
        priority: (dto.priority || 'media') as string,
        status: 'ACTIVE',
        deadline: dto.deadline,
      },
      include: { milestones: true, tasks: true },
    });
    return this.toGoal(record);
  }

  async findAll(userId: string, filter?: { status?: GoalStatus; category?: GoalCategory }): Promise<Goal[]> {
    const records = await this.prisma.goal.findMany({
      where: {
        userId,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.category && { category: filter.category }),
      },
      include: { milestones: true, tasks: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toGoal(r));
  }

  async findOne(userId: string, id: string): Promise<Goal> {
    const record = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: { milestones: true, tasks: true },
    });
    if (!record) throw new NotFoundException(`Goal ${id} not found`);
    return this.toGoal(record);
  }

  async update(userId: string, id: string, dto: UpdateGoalDTO): Promise<Goal> {
    // Confirma ownership antes de atualizar
    await this.findOne(userId, id);

    const record = await this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline }),
      },
      include: { milestones: true, tasks: true },
    });
    return this.toGoal(record);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id); // verifica ownership
    await this.prisma.goal.delete({ where: { id } });
  }

  async getProgress(userId: string, goalId: string): Promise<number> {
    const goal = await this.findOne(userId, goalId);
    const items: { completed: boolean }[] = [...goal.milestones, ...goal.tasks];
    if (items.length === 0) return 0;
    const done = items.filter(i => i.completed).length;
    return Math.round((done / items.length) * 100);
  }

  async addMilestone(userId: string, goalId: string, dto: CreateMilestoneDTO): Promise<Milestone> {
    await this.findOne(userId, goalId); // ownership
    const record = await this.prisma.milestone.create({
      data: { goalId, title: dto.title, deadline: dto.deadline },
    });
    await this.prisma.goal.update({ where: { id: goalId }, data: { updatedAt: new Date() } });
    return this.toMilestone(record);
  }

  async toggleMilestone(userId: string, goalId: string, milestoneId: string): Promise<Milestone> {
    await this.findOne(userId, goalId); // ownership
    const ms = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!ms || ms.goalId !== goalId) throw new NotFoundException(`Milestone ${milestoneId} not found in goal ${goalId}`);

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { completed: !ms.completed },
    });
    await this.prisma.goal.update({ where: { id: goalId }, data: { updatedAt: new Date() } });
    return this.toMilestone(updated);
  }

  async removeMilestone(userId: string, goalId: string, milestoneId: string): Promise<void> {
    await this.findOne(userId, goalId); // ownership
    const ms = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!ms || ms.goalId !== goalId) throw new NotFoundException(`Milestone ${milestoneId} not found in goal ${goalId}`);

    await this.prisma.milestone.delete({ where: { id: milestoneId } });
    await this.prisma.goal.update({ where: { id: goalId }, data: { updatedAt: new Date() } });
  }

  async getTasks(userId: string): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      where: { userId, goalId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toTask(r));
  }

  async addTask(userId: string, task: Task): Promise<void> {
    await this.prisma.task.create({
      data: {
        id: task.id,
        userId,
        goalId: task.goalId || null,
        milestoneId: task.milestoneId || null,
        title: task.title,
        description: task.description || null,
        status: task.status,
        date: task.date || null,
        completed: task.completed,
      },
    });
  }

  async findTask(userId: string, id: string): Promise<Task> {
    const record = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!record) throw new NotFoundException(`Task ${id} not found`);
    return this.toTask(record);
  }

  async updateTask(userId: string, id: string, dto: Partial<Task>): Promise<Task> {
    await this.findTask(userId, id); // ownership
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

  async removeTask(userId: string, id: string): Promise<void> {
    await this.findTask(userId, id); // ownership
    await this.prisma.task.delete({ where: { id } });
  }

  private toGoal(r: any): Goal {
    return {
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      category: r.category as GoalCategory,
      priority: r.priority as 'baixa' | 'media' | 'alta',
      status: r.status as GoalStatus,
      deadline: r.deadline || undefined,
      milestones: (r.milestones || []).map((m: any) => this.toMilestone(m)),
      tasks: (r.tasks || []).map((t: any) => this.toTask(t)),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private toMilestone(r: any): Milestone {
    return {
      id: r.id,
      goalId: r.goalId,
      title: r.title,
      deadline: r.deadline || undefined,
      completed: r.completed,
      createdAt: r.createdAt.toISOString(),
    };
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
