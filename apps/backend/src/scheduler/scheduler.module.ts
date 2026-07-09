import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { RoutinesModule } from '../routines/routines.module';
import { ConflictResolver } from '../shared/conflict-resolver.service';

@Module({
  imports: [RoutinesModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, ConflictResolver],
  exports: [SchedulerService, ConflictResolver],
})
export class SchedulerModule {}
