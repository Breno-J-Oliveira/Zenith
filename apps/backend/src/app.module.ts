import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { DatabasesModule } from './databases/databases.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { NexusAuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AIModule,
    GoalsModule,
    TasksModule,
    RoutinesModule,
    SchedulerModule,
    CalendarModule,
    PagesModule,
    DatabasesModule,
    ChatModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global — protege todas as rotas por defeito.
    // Rotas públicas devem usar @Public().
    {
      provide: APP_GUARD,
      useClass: NexusAuthGuard,
    },
  ],
})
export class AppModule {}
