import { Injectable } from '@nestjs/common';
import { aiProvider } from '../../../../packages/shared/src/ai';
import { ParsedAIResult, AILogEntry } from '../../../../packages/shared/src/types';

@Injectable()
export class AIService {
  private log: AILogEntry[] = [];

  async parse(text: string): Promise<ParsedAIResult> {
    const result = await aiProvider.parse(text);

    const entry: AILogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: text,
      result,
    };
    this.log.push(entry);

    return result;
  }

  getLog(): AILogEntry[] {
    return this.log;
  }
}
