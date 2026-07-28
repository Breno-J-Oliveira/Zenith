import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AgentService } from './agent.service';
import { PrismaModule } from '../prisma.module';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';
import { RoutinesModule } from '../routines/routines.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { DatabasesModule } from '../databases/databases.module';

@Module({
  imports: [
    PrismaModule,
    GoalsModule,
    TasksModule,
    RoutinesModule,
    SchedulerModule,
    DatabasesModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, AgentService],
  exports: [ChatService, AgentService],
})
export class ChatModule {}
