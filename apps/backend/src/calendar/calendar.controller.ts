import {
  Controller, Get, Patch,
  Query, Body,
} from '@nestjs/common';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';
import { CalendarService, RescheduleDTO } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getEvents(
    @CurrentUser() user: ZenithUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendarService.getEvents(user.id, from || '2000-01-01', to || '2099-12-31');
  }

  @Patch('reschedule')
  reschedule(@CurrentUser() user: ZenithUser, @Body() dto: RescheduleDTO) {
    return this.calendarService.reschedule(user.id, dto);
  }
}
