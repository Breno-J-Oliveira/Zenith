import { Controller, Post, Get, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { AILogEntry } from '../../../../packages/shared/src/types';
import { Public } from '../auth/auth.guard';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * POST /ai/parse — processa texto do utilizador via IA.
   *
   * Este endpoint permanece PÚBLICO por compatibilidade com o QuickInput
   * que está no Dashboard (utilizadores não-autenticados podem experimentar
   * a IA sem fazer login). O `sideEffect` do dispatch (criar goal/task)
   * continua a usar MOCK_USER_ID — quando o user fizer login, migra.
   *
   * Para forçar autenticação, basta remover o @Public().
   */
  @Public()
  @Post('parse')
  async parse(@Body('text') text: string) {
    return this.aiService.parse(text);
  }

  @Public()
  @Get('log')
  async getLog(): Promise<AILogEntry[]> {
    return this.aiService.getLog();
  }

  @Public()
  @Get('briefing')
  async getBriefing() {
    return this.aiService.getBriefing();
  }
}
