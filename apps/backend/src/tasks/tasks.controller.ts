import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDTO) {
    return this.tasksService.create(dto);
  }

  @Get()
  findAll(
    @Query('goalId') goalId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasksService.findAll({ goalId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDTO) {
    return this.tasksService.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.tasksService.toggle(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
  }
}
