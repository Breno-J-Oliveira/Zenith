import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';
import { RoutinesModule } from '../routines/routines.module';
import { PagesModule } from '../pages/pages.module';
import { DatabasesModule } from '../databases/databases.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [GoalsModule, TasksModule, RoutinesModule, PagesModule, DatabasesModule, SchedulerModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
