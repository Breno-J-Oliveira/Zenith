import { Injectable, Logger } from '@nestjs/common';
import { aiProvider } from '../../../../packages/shared/src/ai';
import { ParsedAIResult, AILogEntry } from '../../../../packages/shared/src/types';
import { GeminiProvider } from './gemini.provider';

@Injectable()
export class AIService {
  private log: AILogEntry[] = [];
  private readonly logger = new Logger(AIService.name);
  private geminiProvider: GeminiProvider | null = null;

  constructor() {
    try {
      this.geminiProvider = new GeminiProvider();
      this.logger.log('GeminiProvider inicializado — IA real ativa');
    } catch (err) {
      this.logger.warn(`GeminiProvider não inicializado: ${err.message}. Usando MockAIProvider apenas.`);
    }
  }

  async parse(text: string): Promise<ParsedAIResult & { source: 'gemini' | 'mock' }> {
    let result: ParsedAIResult;
    let source: 'gemini' | 'mock' = 'gemini';

    if (this.geminiProvider) {
      try {
        result = await this.geminiProvider.parse(text);
      } catch (err) {
        this.logger.warn(`Gemini falhou (${err.message}). Caindo para MockAIProvider.`);
        result = await aiProvider.parse(text);
        source = 'mock';
      }
    } else {
      result = await aiProvider.parse(text);
      source = 'mock';
    }

    const entry: AILogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: text,
      result,
    };
    this.log.push(entry);

    return { ...result, source };
  }

  getLog(): AILogEntry[] {
    return this.log;
  }
}
