import {
  Controller, Get, Post, Put,
  Body, Param,
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

  @Post('manual')
  createManual(
    @CurrentUser() user: ZenithUser,
    @Body() dto: CreateAppointmentDTO & { requestId: string },
  ): Promise<Appointment> {
    return this.schedulerService.createManualAppointment(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() dto: CreateAppointmentDTO,
  ): Promise<Appointment> {
    return this.schedulerService.updateAppointment(user.id, id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: ZenithUser): Promise<Appointment[]> {
    return this.schedulerService.findAll(user.id);
  }
}
