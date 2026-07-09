import { Injectable, Logger } from '@nestjs/common';
import { aiProvider } from '../../../../packages/shared/src/ai';
import { ParsedAIResult, AILogEntry, RoutinePayload, AppointmentPayload, ReorganizationResult } from '../../../../packages/shared/src/types';
import { GeminiProvider } from './gemini.provider';
import { RoutinesService } from '../routines/routines.service';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class AIService {
  private log: AILogEntry[] = [];
  private readonly logger = new Logger(AIService.name);
  private geminiProvider: GeminiProvider | null = null;

  constructor(
    private readonly routinesService: RoutinesService,
    private readonly schedulerService: SchedulerService,
  ) {
    try {
      this.geminiProvider = new GeminiProvider();
      this.logger.log('GeminiProvider inicializado — IA real ativa');
    } catch (err) {
      this.logger.warn(`GeminiProvider não inicializado: ${err.message}. Usando MockAIProvider apenas.`);
    }
  }

  async parse(text: string): Promise<ParsedAIResult & { source: 'gemini' | 'mock'; sideEffect?: any }> {
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

    let sideEffect: any = undefined;

    if (result.intent === 'CREATE_ROUTINE' && result.payload) {
      const payload = result.payload as RoutinePayload;
      const routine = this.routinesService.create({
        title: payload.title,
        frequency: payload.frequency,
        time: payload.time,
        duration: payload.duration,
      });
      sideEffect = { type: 'routine_created', routine };
    }

    if (result.intent === 'CREATE_APPOINTMENT' && result.payload) {
      const payload = result.payload as AppointmentPayload;
      const reorgResult = this.schedulerService.createAppointment({
        title: payload.title,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
      });
      sideEffect = { type: 'appointment_created', reorganization: reorgResult };
    }

    const entry: AILogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: text,
      result,
    };
    this.log.push(entry);

    return { ...result, source, sideEffect };
  }

  getLog(): AILogEntry[] {
    return this.log;
  }
}
