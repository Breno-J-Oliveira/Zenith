import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import {
  CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO,
  GoalStatus, GoalCategory,
} from '../../../../packages/shared/src/types';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@CurrentUser() user: ZenithUser, @Body() dto: CreateGoalDTO) {
    return this.goalsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: ZenithUser,
    @Query('status') status?: GoalStatus,
    @Query('category') category?: GoalCategory,
  ) {
    return this.goalsService.findAll(user.id, { status, category });
  }

  @Get(':id')
  findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.goalsService.findOne(user.id, id);
  }

  @Put(':id')
  update(@CurrentUser() user: ZenithUser, @Param('id') id: string, @Body() dto: UpdateGoalDTO) {
    return this.goalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    await this.goalsService.remove(user.id, id);
  }

  @Get(':id/progress')
  async getProgress(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return { progress: await this.goalsService.getProgress(user.id, id) };
  }

  @Post(':id/milestones')
  addMilestone(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDTO,
  ) {
    return this.goalsService.addMilestone(user.id, id, dto);
  }

  @Patch(':id/milestones/:milestoneId/toggle')
  toggleMilestone(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalsService.toggleMilestone(user.id, id, milestoneId);
  }

  @Delete(':id/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMilestone(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    await this.goalsService.removeMilestone(user.id, id, milestoneId);
  }
}
