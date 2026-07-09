import {
  Controller, Get, Post,
  Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import {
  CreateAppointmentDTO, ReorganizationResult, Appointment,
} from '../../../../packages/shared/src/types';

@Controller('appointments')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDTO): ReorganizationResult {
    return this.schedulerService.createAppointment(dto);
  }

  @Get()
  findAll(): Appointment[] {
    return this.schedulerService.findAll();
  }
}
