import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedAIResult, AIIntent, ExpensePayload, GoalPayload, TaskPayload, EventPayload, RoutinePayload, AppointmentPayload } from '../../../../packages/shared/src/types';

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Você é o orquestrador do Zenith, um app de produtividade.
Receba o texto do usuário em linguagem natural e identifique a intenção.

INTENTS possíveis:
- LOG_EXPENSE: registrar gasto (extrair amount, category, description)
- CREATE_GOAL: criar meta (extrair title, deadline, category)
- CREATE_TASK: criar tarefa simples (extrair title, date)
- CREATE_ROUTINE: criar rotina recorrente (extrair title, frequency: daily/weekly/monthly, time, duration em minutos)
- CREATE_APPOINTMENT: criar compromisso pontual que dispara reorganização de rotina (extrair title, date, startTime, endTime)
- UNKNOWN: não conseguiu identificar

Diferença CREATE_TASK vs CREATE_GOAL:
- CREATE_TASK: ação pontual, algo para fazer ("comprar leite amanhã")
- CREATE_GOAL: objetivo maior ou contínuo ("quero aprender python até dezembro")

Diferença CREATE_ROUTINE vs CREATE_APPOINTMENT:
- CREATE_ROUTINE: algo recorrente ("estudar React das 19h às 21h todo dia" → frequency: daily, time: 19:00, duration: 120)
- CREATE_APPOINTMENT: evento pontual num dia específico ("reunião dia 23 das 14h às 16h" → date: 2026-07-23, startTime: 14:00, endTime: 16:00)

Categorias de gasto: alimentação, transporte, lazer, outros.
Categorias de meta: pessoal, trabalho, financeiro, saude, estudo.
Datas no formato ISO (YYYY-MM-DD). Horas no formato HH:MM.

Retorne APENAS um JSON válido, sem texto explicativo antes ou depois, no formato:
{
  "intent": "LOG_EXPENSE | CREATE_GOAL | CREATE_TASK | CREATE_ROUTINE | CREATE_APPOINTMENT | UNKNOWN",
  "confidence": 0.0 a 1.0,
  "payload": { ... } ou null,
  "rawText": "texto original do usuário"
}

Exemplos:
Input: "gastei 25 no pastel"
Output: {"intent":"LOG_EXPENSE","confidence":0.95,"payload":{"amount":25,"category":"alimentação","description":"gastei 25 no pastel","date":"2026-07-09"},"rawText":"gastei 25 no pastel"}

Input: "reunião dia 23 das 14h às 16h"
Output: {"intent":"CREATE_APPOINTMENT","confidence":0.9,"payload":{"title":"reunião","date":"2026-07-23","startTime":"14:00","endTime":"16:00"},"rawText":"reunião dia 23 das 14h às 16h"}

Input: "estudar React das 19h às 21h todo dia"
Output: {"intent":"CREATE_ROUTINE","confidence":0.9,"payload":{"title":"Estudar React","frequency":"daily","time":"19:00","duration":120},"rawText":"estudar React das 19h às 21h todo dia"}

Input: "oi"
Output: {"intent":"UNKNOWN","confidence":0.1,"payload":null,"rawText":"oi"}`;

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada. Crie apps/backend/.env com GEMINI_API_KEY=sua_key');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = GEMINI_MODEL;
  }

  async parse(text: string): Promise<ParsedAIResult> {
    const model = this.genAI.getGenerativeModel({ model: this.model });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `Input: "${text}"\nOutput:` },
    ]);

    const responseText = result.response.text().trim();

    try {
      const jsonStr = this.extractJson(responseText);
      const parsed = JSON.parse(jsonStr);
      return this.validateResult(parsed, text);
    } catch {
      return {
        intent: 'UNKNOWN' as AIIntent,
        confidence: 0,
        payload: null,
        rawText: text,
      };
    }
  }

  private extractJson(text: string): string {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    return text;
  }

  private validateResult(parsed: any, rawText: string): ParsedAIResult {
    const validIntents: AIIntent[] = ['CREATE_GOAL', 'CREATE_TASK', 'LOG_EXPENSE', 'CREATE_EVENT', 'CREATE_ROUTINE', 'CREATE_APPOINTMENT', 'UNKNOWN'];

    const intent = validIntents.includes(parsed.intent) ? parsed.intent : 'UNKNOWN';
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
    const payload = this.validatePayload(intent, parsed.payload);

    return { intent, confidence, payload, rawText };
  }

  private validatePayload(intent: AIIntent, payload: any): ParsedAIResult['payload'] {
    if (!payload || typeof payload !== 'object') return null;

    switch (intent) {
      case 'LOG_EXPENSE':
        return {
          amount: Number(payload.amount) || 0,
          category: String(payload.category || 'outros'),
          description: String(payload.description || ''),
          date: String(payload.date || new Date().toISOString()),
        } as ExpensePayload;
      case 'CREATE_EVENT':
        return {
          title: String(payload.title || ''),
          date: String(payload.date || new Date().toISOString().split('T')[0]),
          time: payload.time ? String(payload.time) : undefined,
        } as EventPayload;
      case 'CREATE_GOAL':
        return {
          title: String(payload.title || ''),
          deadline: payload.deadline ? String(payload.deadline) : undefined,
          category: String(payload.category || 'pessoal'),
        } as GoalPayload;
      case 'CREATE_TASK':
        return {
          title: String(payload.title || ''),
          date: payload.date ? String(payload.date) : undefined,
        } as TaskPayload;
      case 'CREATE_ROUTINE':
        return {
          title: String(payload.title || ''),
          frequency: (['daily', 'weekly', 'monthly'].includes(payload.frequency) ? payload.frequency : 'daily') as 'daily' | 'weekly' | 'monthly',
          time: String(payload.time || '08:00'),
          duration: Number(payload.duration) || 60,
        } as RoutinePayload;
      case 'CREATE_APPOINTMENT':
        return {
          title: String(payload.title || ''),
          date: String(payload.date || new Date().toISOString().split('T')[0]),
          startTime: String(payload.startTime || '00:00'),
          endTime: String(payload.endTime || '01:00'),
        } as AppointmentPayload;
      default:
        return null;
    }
  }
}
