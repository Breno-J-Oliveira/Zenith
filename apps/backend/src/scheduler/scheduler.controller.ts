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
  async create(@Body() dto: CreateAppointmentDTO): Promise<ReorganizationResult> {
    return this.schedulerService.createAppointment(dto);
  }

  @Get()
  async findAll(): Promise<Appointment[]> {
    return this.schedulerService.findAll();
  }
}
