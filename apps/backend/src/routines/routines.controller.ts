import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import {
  CreateRoutineDTO, UpdateRoutineDTO, Routine,
} from '../../../../packages/shared/src/types';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  async create(@CurrentUser() user: ZenithUser, @Body() dto: CreateRoutineDTO): Promise<Routine> {
    return this.routinesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: ZenithUser, @Query('active') active?: string) {
    const filter = active !== undefined ? { active: active === 'true' } : undefined;
    return this.routinesService.findAll(user.id, filter);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string): Promise<Routine> {
    return this.routinesService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoutineDTO,
  ): Promise<Routine> {
    return this.routinesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    await this.routinesService.remove(user.id, id);
  }

  @Post(':id/generate-tasks')
  generateTasks(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const n = days ? parseInt(days) : 7;
    return this.routinesService.generateTasks(user.id, id, n);
  }
}
