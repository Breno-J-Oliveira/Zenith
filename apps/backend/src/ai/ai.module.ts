import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { RoutinesModule } from '../routines/routines.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [RoutinesModule, SchedulerModule],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
