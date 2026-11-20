import { Controller, Post, Get, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { AILogEntry } from '../../../../packages/shared/src/types';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('parse')
  async parse(@CurrentUser() user: ZenithUser, @Body('text') text: string) {
    return this.aiService.parse(user.id, text);
  }

  @Get('log')
  async getLog(@CurrentUser() user: ZenithUser): Promise<AILogEntry[]> {
    return this.aiService.getLog(user.id);
  }

  @Get('briefing')
  async getBriefing(@CurrentUser() user: ZenithUser) {
    return this.aiService.getBriefing(user.id);
  }
}
