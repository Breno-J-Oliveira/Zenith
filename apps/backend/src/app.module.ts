import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AIModule } from './ai/ai.module';
import { GoalsModule } from './goals/goals.module';
import { TasksModule } from './tasks/tasks.module';
import { RoutinesModule } from './routines/routines.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CalendarModule } from './calendar/calendar.module';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AIModule,
    GoalsModule,
    TasksModule,
    RoutinesModule,
    SchedulerModule,
    CalendarModule,
    PagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
