import {
  Controller, Get, Post,
  Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import {
  CreateAppointmentDTO, ReorganizationResult, Appointment,
} from '../../../../packages/shared/src/types';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('appointments')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  async create(
    @CurrentUser() user: ZenithUser,
    @Body() dto: CreateAppointmentDTO,
  ): Promise<ReorganizationResult> {
    return this.schedulerService.createAppointment(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: ZenithUser): Promise<Appointment[]> {
    return this.schedulerService.findAll(user.id);
  }
}
