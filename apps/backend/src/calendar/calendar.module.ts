import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { GoalsModule } from '../goals/goals.module';
import { RoutinesModule } from '../routines/routines.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [GoalsModule, RoutinesModule, SchedulerModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
