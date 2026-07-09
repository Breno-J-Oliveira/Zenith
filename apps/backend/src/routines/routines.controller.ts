import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import {
  CreateRoutineDTO, UpdateRoutineDTO, Routine,
} from '../../../../packages/shared/src/types';

@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  async create(@Body() dto: CreateRoutineDTO): Promise<Routine> {
    return this.routinesService.create(dto);
  }

  @Get()
  findAll(@Query('active') active?: string) {
    const filter = active !== undefined ? { active: active === 'true' } : undefined;
    return this.routinesService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Routine> {
    return this.routinesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoutineDTO): Promise<Routine> {
    return this.routinesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.routinesService.remove(id);
  }

  @Post(':id/generate-tasks')
  generateTasks(@Param('id') id: string, @Query('days') days?: string) {
    const n = days ? parseInt(days) : 7;
    return this.routinesService.generateTasks(id, n);
  }
}
