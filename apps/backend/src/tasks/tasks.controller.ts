import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDTO, UpdateTaskDTO, TaskStatus,
} from '../../../../packages/shared/src/types';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@CurrentUser() user: ZenithUser, @Body() dto: CreateTaskDTO) {
    return this.tasksService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: ZenithUser,
    @Query('goalId') goalId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasksService.findAll(user.id, { goalId, status });
  }

  @Get(':id')
  findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.tasksService.findOne(user.id, id);
  }

  @Put(':id')
  update(@CurrentUser() user: ZenithUser, @Param('id') id: string, @Body() dto: UpdateTaskDTO) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.tasksService.toggle(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    await this.tasksService.remove(user.id, id);
  }
}
