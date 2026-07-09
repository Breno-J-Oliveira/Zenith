import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import {
  CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO,
  GoalStatus, GoalCategory,
} from '../../../../packages/shared/src/types';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Body() dto: CreateGoalDTO) {
    return this.goalsService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: GoalStatus,
    @Query('category') category?: GoalCategory,
  ) {
    return this.goalsService.findAll({ status, category });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goalsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGoalDTO) {
    return this.goalsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.goalsService.remove(id);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    return { progress: await this.goalsService.getProgress(id) };
  }

  @Post(':id/milestones')
  addMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDTO) {
    return this.goalsService.addMilestone(id, dto);
  }

  @Patch(':id/milestones/:milestoneId/toggle')
  toggleMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalsService.toggleMilestone(id, milestoneId);
  }

  @Delete(':id/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    await this.goalsService.removeMilestone(id, milestoneId);
  }
}
