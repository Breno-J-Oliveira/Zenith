import { AIIntent, ParsedAIResult, ExpensePayload, GoalPayload, TaskPayload, EventPayload } from '../types';

const EXPENSE_KEYWORDS = ['gastei', 'gastou', 'comi', 'paguei', 'gasto', 'gasta'];
const EVENT_KEYWORDS = ['reunião', 'reuniao', 'compromisso', 'evento', 'encontro'];
const GOAL_KEYWORDS = ['tenho que', 'preciso', 'meta', 'objetivo', 'quero'];
const TASK_KEYWORDS = ['tarefa', 'fazer', 'lembrar', 'lembra', 'estudar', 'ler'];

const FOOD_KEYWORDS = ['pastel', 'comida', 'almoço', 'almoco', 'janta', 'jantar', 'lanche', 'café', 'cafe', 'pizza', 'hamburguer', 'restaurante'];
const TRANSPORT_KEYWORDS = ['uber', 'taxi', 'ônibus', 'onibus', 'metro', 'metrô', 'gasolina', 'estacionamento'];
const LEISURE_KEYWORDS = ['cinema', 'jogo', 'festa', 'bar', 'show', 'streaming', 'netflix'];

function extractAmount(text: string): number | null {
  const match = text.match(/(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  if (FOOD_KEYWORDS.some(k => lower.includes(k))) return 'alimentação';
  if (TRANSPORT_KEYWORDS.some(k => lower.includes(k))) return 'transporte';
  if (LEISURE_KEYWORDS.some(k => lower.includes(k))) return 'lazer';
  return 'outros';
}

function extractDate(text: string): string | undefined {
  const dayMatch = text.match(/dia\s*(\d{1,2})/i);
  if (dayMatch) {
    const now = new Date();
    const day = parseInt(dayMatch[1]);
    const month = now.getMonth();
    const year = now.getFullYear();
    const date = new Date(year, month, day);
    if (date < now) date.setMonth(month + 1);
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

function extractTime(text: string): string | undefined {
  const timeMatch = text.match(/(\d{1,2})h(?:as)?\s*(\d{0,2})?/i);
  if (timeMatch) {
    const h = timeMatch[1].padStart(2, '0');
    const m = (timeMatch[2] || '00').padStart(2, '0');
    return `${h}:${m}`;
  }
  return undefined;
}

export class MockAIProvider {
  async parse(text: string): Promise<ParsedAIResult> {
    // TODO(ai-openai-integration): substituir parsing determinístico por chamada à OpenAI API (GPT-4o-mini)
    // O prompt template está documentado em ANOTAÇÕES.md seção "Prompt template"
    const lower = text.toLowerCase();
    const now = new Date().toISOString();

    if (EXPENSE_KEYWORDS.some(k => lower.includes(k))) {
      const amount = extractAmount(text);
      if (amount !== null) {
        const payload: ExpensePayload = {
          amount,
          category: guessCategory(text),
          description: text.trim(),
          date: now,
        };
        return { intent: 'LOG_EXPENSE', confidence: 0.9, payload, rawText: text };
      }
    }

    if (EVENT_KEYWORDS.some(k => lower.includes(k))) {
      const date = extractDate(text);
      const time = extractTime(text);
      const payload: EventPayload = {
        title: text.trim(),
        date: date || now.split('T')[0],
        time,
      };
      return { intent: 'CREATE_EVENT', confidence: 0.85, payload, rawText: text };
    }

    if (GOAL_KEYWORDS.some(k => lower.includes(k))) {
      const deadline = extractDate(text);
      const payload: GoalPayload = {
        title: text.trim(),
        deadline,
        category: 'pessoal',
      };
      return { intent: 'CREATE_GOAL', confidence: 0.8, payload, rawText: text };
    }

    if (TASK_KEYWORDS.some(k => lower.includes(k))) {
      const date = extractDate(text);
      const payload: TaskPayload = {
        title: text.trim(),
        date,
      };
      return { intent: 'CREATE_TASK', confidence: 0.75, payload, rawText: text };
    }

    return { intent: 'UNKNOWN', confidence: 0.3, payload: null, rawText: text };
  }
}

export const aiProvider = new MockAIProvider();
