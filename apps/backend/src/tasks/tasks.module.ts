import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [GoalsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
