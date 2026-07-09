import {
  Controller, Get, Patch,
  Query, Body,
} from '@nestjs/common';
import { CalendarService, RescheduleDTO } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getEvents(@Query('from') from: string, @Query('to') to: string) {
    return this.calendarService.getEvents(from || '2000-01-01', to || '2099-12-31');
  }

  @Patch('reschedule')
  reschedule(@Body() dto: RescheduleDTO) {
    return this.calendarService.reschedule(dto);
  }
}
