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
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tasksService.findAll(user.id, { goalId, status, from, to });
  }

  @Post('capture')
  capture(@CurrentUser() user: ZenithUser, @Body() body: unknown) {
    return this.tasksService.capture(user.id, body);
  }

  @Get('personal')
  findPersonal(@CurrentUser() user: ZenithUser, @Query('from') from: string) {
    return this.tasksService.findPersonal(user.id, from);
  }

  @Patch('personal/:id')
  updatePersonal(@CurrentUser() user: ZenithUser, @Param('id') id: string, @Body() body: unknown) {
    return this.tasksService.updatePersonal(user.id, id, body);
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
