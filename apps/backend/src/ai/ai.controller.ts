import { Controller, Post, Get, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { ParsedAIResult, AILogEntry } from '../../../../packages/shared/src/types';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('parse')
  async parse(@Body('text') text: string) {
    return this.aiService.parse(text);
  }

  @Get('log')
  getLog(): AILogEntry[] {
    return this.aiService.getLog();
  }
}
