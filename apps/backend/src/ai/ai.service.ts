import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiProvider } from '../../../../packages/shared/src/ai';
import { ParsedAIResult, AILogEntry, RoutinePayload, AppointmentPayload, ReorganizationResult } from '../../../../packages/shared/src/types';
import { GeminiProvider } from './gemini.provider';
import { GoalsService } from '../goals/goals.service';
import { RoutinesService } from '../routines/routines.service';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class AIService {
  private log: AILogEntry[] = [];
  private readonly logger = new Logger(AIService.name);
  private geminiProvider: GeminiProvider | null = null;

  constructor(
    private readonly goalsService: GoalsService,
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

  async getBriefing(): Promise<{ text: string; source: 'gemini' | 'template' }> {
    const today = new Date().toISOString().split('T')[0];

    const goals = this.goalsService.findAll({ status: 'ACTIVE' as any });
    const routineTasks = this.routinesService.getTasksForDate(today);
    const goalTasks = this.goalsService.getTasks().filter(t => t.date === today);
    const appointments = this.schedulerService.findAll().filter(a => a.date === today);

    const allTodayItems = [
      ...routineTasks.map(t => ({ title: t.title, time: (t as any).time || '—', type: 'rotina' })),
      ...goalTasks.map(t => ({ title: t.title, time: '—', type: 'tarefa' })),
      ...appointments.map(a => ({ title: a.title, time: `${a.startTime}-${a.endTime}`, type: 'compromisso' })),
    ].sort((a, b) => a.time.localeCompare(b.time));

    const activeRoutines = this.routinesService.findAll({ active: true });

    const goalProgress = goals.map(g => ({
      title: g.title,
      progress: this.goalsService.getProgress(g.id),
    }));

    // Try Gemini first
    if (this.geminiProvider) {
      try {
        const context = {
          date: today,
          tasksToday: allTodayItems,
          totalTasks: allTodayItems.length,
          activeGoals: goalProgress,
          activeRoutines: activeRoutines.length,
        };

        const prompt = `Você é o assistente do Zenith. Gere um briefing diário curto e amigável (máximo 3 frases) baseado nos dados abaixo. Comece com "Bom dia!" ou saudação apropriada. Seja encorajador mas conciso.

Dados do dia ${today}:
- ${allTodayItems.length} itens agendados: ${allTodayItems.map(i => `${i.title} (${i.type}, ${i.time})`).join(', ') || 'nenhum'}
- ${goals.length} metas ativas: ${goalProgress.map(g => `${g.title} em ${g.progress}%`).join(', ') || 'nenhuma'}
- ${activeRoutines.length} rotinas ativas

Gere apenas o texto do briefing, sem JSON.`;

        const model = this.geminiProvider['genAI'].getGenerativeModel({ model: this.geminiProvider['model'] });
        const result = await model.generateContent([{ text: prompt }]);
        const text = result.response.text().trim();
        return { text, source: 'gemini' };
      } catch (err) {
        this.logger.warn(`Gemini briefing falhou: ${err.message}. Usando template.`);
      }
    }

    // Fallback template
    const parts: string[] = [];
    parts.push(`Bom dia! Você tem ${allTodayItems.length} ${allTodayItems.length === 1 ? 'item' : 'itens'} hoje`);
    if (appointments.length > 0) {
      parts.push(`, incluindo ${appointments.map(a => `${a.title} às ${a.startTime}`).join(' e ')}`);
    }
    parts.push('.');
    if (goalProgress.length > 0) {
      const topGoal = goalProgress.sort((a, b) => b.progress - a.progress)[0];
      parts.push(` Sua meta "${topGoal.title}" está em ${topGoal.progress}% — continue assim!`);
    }
    if (allTodayItems.length === 0) {
      parts.push(' Dia livre para se organizar ou criar novas metas.');
    }

    return { text: parts.join(''), source: 'template' };
  }
}
