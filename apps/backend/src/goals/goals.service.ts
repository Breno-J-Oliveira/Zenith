import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Goal, Milestone, Task,
  CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO,
  GoalStatus, GoalCategory,
} from '../../../../packages/shared/src/types';

@Injectable()
export class GoalsService {
  private goals: Goal[] = [];
  private tasks: Task[] = [];

  create(dto: CreateGoalDTO): Goal {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: dto.title,
      description: dto.description,
      category: (dto.category || 'pessoal') as GoalCategory,
      priority: dto.priority || 'media',
      status: 'ACTIVE' as GoalStatus,
      deadline: dto.deadline,
      milestones: [],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };
    this.goals.push(goal);
    return goal;
  }

  findAll(filter?: { status?: GoalStatus; category?: GoalCategory }): Goal[] {
    return this.goals.filter(g => {
      if (filter?.status && g.status !== filter.status) return false;
      if (filter?.category && g.category !== filter.category) return false;
      return true;
    });
  }

  findOne(id: string): Goal {
    const goal = this.goals.find(g => g.id === id);
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    return goal;
  }

  update(id: string, dto: UpdateGoalDTO): Goal {
    const goal = this.findOne(id);
    if (dto.title !== undefined) goal.title = dto.title;
    if (dto.description !== undefined) goal.description = dto.description;
    if (dto.category !== undefined) goal.category = dto.category;
    if (dto.priority !== undefined) goal.priority = dto.priority;
    if (dto.status !== undefined) goal.status = dto.status;
    if (dto.deadline !== undefined) goal.deadline = dto.deadline;
    goal.updatedAt = new Date().toISOString();
    return goal;
  }

  remove(id: string): void {
    const idx = this.goals.findIndex(g => g.id === id);
    if (idx === -1) throw new NotFoundException(`Goal ${id} not found`);
    this.goals.splice(idx, 1);
    this.tasks = this.tasks.filter(t => t.goalId !== id);
  }

  getProgress(goalId: string): number {
    const goal = this.findOne(goalId);
    const items: { completed: boolean }[] = [...goal.milestones, ...this.tasks.filter(t => t.goalId === goalId)];
    if (items.length === 0) return 0;
    const done = items.filter(i => i.completed).length;
    return Math.round((done / items.length) * 100);
  }

  addMilestone(goalId: string, dto: CreateMilestoneDTO): Milestone {
    const goal = this.findOne(goalId);
    const milestone: Milestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      goalId,
      title: dto.title,
      deadline: dto.deadline,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    goal.milestones.push(milestone);
    goal.updatedAt = new Date().toISOString();
    return milestone;
  }

  toggleMilestone(goalId: string, milestoneId: string): Milestone {
    const goal = this.findOne(goalId);
    const ms = goal.milestones.find(m => m.id === milestoneId);
    if (!ms) throw new NotFoundException(`Milestone ${milestoneId} not found in goal ${goalId}`);
    ms.completed = !ms.completed;
    goal.updatedAt = new Date().toISOString();
    return ms;
  }

  removeMilestone(goalId: string, milestoneId: string): void {
    const goal = this.findOne(goalId);
    const idx = goal.milestones.findIndex(m => m.id === milestoneId);
    if (idx === -1) throw new NotFoundException(`Milestone ${milestoneId} not found in goal ${goalId}`);
    goal.milestones.splice(idx, 1);
    goal.updatedAt = new Date().toISOString();
  }

  addTaskToGoal(goalId: string, task: Task): void {
    const goal = this.findOne(goalId);
    goal.tasks.push(task);
    goal.updatedAt = new Date().toISOString();
  }

  removeTaskFromGoal(goalId: string, taskId: string): void {
    const goal = this.findOne(goalId);
    goal.tasks = goal.tasks.filter(t => t.id !== taskId);
    goal.updatedAt = new Date().toISOString();
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  addTask(task: Task): void {
    this.tasks.push(task);
    if (task.goalId) {
      this.addTaskToGoal(task.goalId, task);
    }
  }

  findTask(id: string): Task {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  updateTask(id: string, dto: Partial<Task>): Task {
    const task = this.findTask(id);
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.completed !== undefined) task.completed = dto.completed;
    if (dto.date !== undefined) task.date = dto.date;
    if (task.goalId) {
      const goal = this.findOne(task.goalId);
      const gt = goal.tasks.find(t => t.id === id);
      if (gt) {
        gt.completed = task.completed;
        gt.status = task.status;
      }
    }
    return task;
  }

  removeTask(id: string): void {
    const task = this.findTask(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (task.goalId) {
      this.removeTaskFromGoal(task.goalId, id);
    }
  }
}
