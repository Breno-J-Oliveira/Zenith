import { Injectable } from '@nestjs/common';
import { GoalsService } from '../goals/goals.service';
import {
  Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class TasksService {
  constructor(private readonly goalsService: GoalsService) {}

  create(dto: CreateTaskDTO): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: dto.title,
      description: dto.description,
      goalId: dto.goalId,
      milestoneId: dto.milestoneId,
      date: dto.date,
      status: 'ACTIVE' as TaskStatus,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.goalsService.addTask(task);
    return task;
  }

  findAll(filter?: { goalId?: string; status?: TaskStatus }): Task[] {
    return this.goalsService.getTasks().filter(t => {
      if (filter?.goalId && t.goalId !== filter.goalId) return false;
      if (filter?.status && t.status !== filter.status) return false;
      return true;
    });
  }

  findOne(id: string): Task {
    return this.goalsService.findTask(id);
  }

  update(id: string, dto: UpdateTaskDTO): Task {
    return this.goalsService.updateTask(id, dto);
  }

  toggle(id: string): Task {
    const task = this.findOne(id);
    return this.goalsService.updateTask(id, {
      completed: !task.completed,
      status: !task.completed ? 'COMPLETED' as TaskStatus : 'ACTIVE' as TaskStatus,
    });
  }

  remove(id: string): void {
    this.goalsService.removeTask(id);
  }
}
