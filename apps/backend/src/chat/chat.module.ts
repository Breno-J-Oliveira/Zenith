import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma.module';
import { AIModule } from '../ai/ai.module';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';
import { RoutinesModule } from '../routines/routines.module';
import { DatabasesModule } from '../databases/databases.module';

@Module({
  imports: [PrismaModule, AIModule, GoalsModule, TasksModule, RoutinesModule, DatabasesModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}