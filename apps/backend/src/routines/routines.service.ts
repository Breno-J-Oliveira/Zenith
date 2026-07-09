import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Routine, CreateRoutineDTO, UpdateRoutineDTO,
  RoutineFrequency, Task, TaskStatus,
} from '../../../../packages/shared/src/types';

@Injectable()
export class RoutinesService {
  private routines: Routine[] = [];
  private generatedTasks: Task[] = [];

  create(dto: CreateRoutineDTO): Routine {
    const routine: Routine = {
      id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: dto.title,
      frequency: (dto.frequency || 'daily') as RoutineFrequency,
      time: dto.time,
      duration: dto.duration || 60,
      active: true,
      adaptable: true,
      createdAt: new Date().toISOString(),
    };
    this.routines.push(routine);
    return routine;
  }

  findAll(filter?: { active?: boolean }): Routine[] {
    return this.routines.filter(r => {
      if (filter?.active !== undefined && r.active !== filter.active) return false;
      return true;
    });
  }

  findOne(id: string): Routine {
    const routine = this.routines.find(r => r.id === id);
    if (!routine) throw new NotFoundException(`Routine ${id} not found`);
    return routine;
  }

  update(id: string, dto: UpdateRoutineDTO): Routine {
    const routine = this.findOne(id);
    if (dto.title !== undefined) routine.title = dto.title;
    if (dto.frequency !== undefined) routine.frequency = dto.frequency;
    if (dto.time !== undefined) routine.time = dto.time;
    if (dto.duration !== undefined) routine.duration = dto.duration;
    if (dto.active !== undefined) routine.active = dto.active;
    if (dto.adaptable !== undefined) routine.adaptable = dto.adaptable;
    return routine;
  }

  remove(id: string): void {
    const idx = this.routines.findIndex(r => r.id === id);
    if (idx === -1) throw new NotFoundException(`Routine ${id} not found`);
    this.routines.splice(idx, 1);
    this.generatedTasks = this.generatedTasks.filter(t => (t as any).routineId !== id);
  }

  generateTasks(routineId: string, days: number = 7): Task[] {
    const routine = this.findOne(routineId);
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
        const alreadyExists = this.generatedTasks.some(
          t => (t as any).routineId === routine.id && t.date === dateStr
        );
        if (alreadyExists) continue;

        const task: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
          title: routine.title,
          date: dateStr,
          status: 'ACTIVE' as TaskStatus,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        (task as any).routineId = routine.id;
        (task as any).time = routine.time;
        (task as any).duration = routine.duration;
        this.generatedTasks.push(task);
        tasks.push(task);
      }
    }

    return tasks;
  }

  getGeneratedTasks(): Task[] {
    return this.generatedTasks;
  }

  getTasksForDate(date: string): Task[] {
    return this.generatedTasks.filter(t => t.date === date);
  }

  updateGeneratedTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.generatedTasks.find(t => t.id === id);
    if (!task) return null;
    if (updates.date !== undefined) task.date = updates.date;
    if (updates.title !== undefined) task.title = updates.title;
    if ((updates as any).time !== undefined) (task as any).time = (updates as any).time;
    return task;
  }
}
