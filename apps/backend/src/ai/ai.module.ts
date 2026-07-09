import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';

@Module({
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
