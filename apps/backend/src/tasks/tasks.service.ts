import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { GoalsService } from '../goals/goals.service';
import { PrismaService } from '../prisma.service';
import {
  Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';

const PERSONAL_TASK = { goalId: null, milestoneId: null, routineId: null } as const;
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE_LENGTH = 200;

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isBody(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

  async capture(userId: string, body: unknown): Promise<Task> {
    if (!isBody(body) || Object.keys(body).length !== 2 || typeof body.title !== 'string' ||
        typeof body.requestId !== 'string' || body.requestId.length !== 36 ||
        !REQUEST_ID_PATTERN.test(body.requestId)) {
      throw new BadRequestException('Informe um título e um requestId UUID válido.');
    }

    const title = body.title.trim();
    if (!title || title.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException(`O título deve ter de 1 a ${MAX_TITLE_LENGTH} caracteres.`);
    }

    // O índice único de Task.id arbitra requisições concorrentes, inclusive após um timeout.
    const key = JSON.stringify([userId, body.requestId.toLowerCase()]);
    const id = `capture_${createHash('sha256').update(key).digest('hex')}`;

    try {
      const record = await this.prisma.task.create({ data: { id, userId, title } });
      return this.toTask(record);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const existing = await this.prisma.task.findFirst({ where: { id, userId, ...PERSONAL_TASK } });
      if (!existing) throw error;
      return this.toTask(existing);
    }
  }

  async findPersonal(userId: string, from: unknown): Promise<{ inbox: Task[]; upcoming: Task[] }> {
    if (!isCivilDate(from)) throw new BadRequestException('A data inicial deve ser válida no formato AAAA-MM-DD.');

    const records = await this.prisma.task.findMany({
      where: {
        userId,
        ...PERSONAL_TASK,
        OR: [
          { date: null, status: 'ACTIVE', completed: false },
          { date: { gte: from } },
        ],
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });

    const inbox: Task[] = [];
    const upcoming: Task[] = [];
    for (const record of records) {
      const list = record.date === null ? inbox : upcoming;
      list.push(this.toTask(record));
    }
    return { inbox, upcoming };
  }

  async updatePersonal(userId: string, id: string, body: unknown): Promise<Task> {
    if (!isBody(body) || Object.keys(body).length !== 1) {
      throw new BadRequestException('Envie apenas a data ou o estado de conclusão.');
    }

    let data: Prisma.TaskUpdateInput;
    if (body.date === null || isCivilDate(body.date)) {
      data = { date: body.date };
    } else if (typeof body.completed === 'boolean') {
      data = { completed: body.completed, status: body.completed ? 'COMPLETED' : 'ACTIVE' };
    } else {
      throw new BadRequestException('Informe uma data válida (AAAA-MM-DD), null ou um estado de conclusão booleano.');
    }

    try {
      const record = await this.prisma.task.update({ where: { id, userId, ...PERSONAL_TASK }, data });
      return this.toTask(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Tarefa pessoal não encontrada.');
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    filter?: { goalId?: string; status?: TaskStatus; from?: string; to?: string },
  ): Promise<Task[]> {
    const { from, to } = filter ?? {};
    if ((from !== undefined && !isCivilDate(from)) || (to !== undefined && !isCivilDate(to))) {
      throw new BadRequestException('As datas devem ser válidas no formato AAAA-MM-DD.');
    }
    if (from && to && from > to) {
      throw new BadRequestException('A data inicial deve ser anterior ou igual à data final.');
    }

    const records = await this.prisma.task.findMany({
      where: {
        userId,
        ...(filter?.goalId && { goalId: filter.goalId }),
        ...(filter?.status && { status: filter.status }),
        ...(from || to ? { date: { gte: from, lte: to } } : {}),
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
