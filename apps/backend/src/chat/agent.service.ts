import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, Tool } from '@google/generative-ai';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
import { GoalsService } from '../goals/goals.service';
import { TasksService } from '../tasks/tasks.service';
import { RoutinesService } from '../routines/routines.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { DatabasesService } from '../databases/databases.service';

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Normaliza uma string removendo acentos e colocando em minúsculas.
 * Usado para comparar títulos de databases independente de
 * "Finanças" vs "Financas" vs "finanças" — todas devem casar.
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
const MAX_TOOL_TURNS = 6; // limite para evitar loops infinitos

const SYSTEM_INSTRUCTION = `Você é o assistente inteligente do Zenith, uma aplicação de organização pessoal.
Você tem acesso a ferramentas (tools) que consultam e modificam os dados do usuário (metas, tarefas, rotinas, compromissos, databases).

REGRAS:
1. Use as ferramentas sempre que precisar ler ou modificar dados — não invente dados que você não tem.
2. Para perguntas do tipo "quanto gastei", "quais minhas metas", "resuma minha semana" — use as tools de leitura (list_*, get_today, search).
3. Para criar/editar — use as tools de escrita (create_*, update_*, complete_*).
4. Quando o usuário descrever várias ações numa única mensagem (ex: "Acordo às 4h, trabalho às 6h, chego em casa às 16h, aí quero estudar inglês, fazer academia e ler um pouco. Também tenho uma meta de terminar um curso até o fim do mês"), identifique TODAS as ações e chame as tools necessárias numa única resposta. O sistema vai apresentar um resumo ao usuário ANTES de persistir.
5. Se a ação for destrutiva (delete, update que apaga algo) — mencione explicitamente na resposta em texto.
6. Respostas em português, amigáveis e concisas. Sem jargão técnico. Sem JSON cru para o usuário final.
7. Datas no formato ISO (YYYY-MM-DD). Horas no formato HH:MM (24h).
8. Categorias de meta válidas: pessoal, trabalho, financeiro, saude, estudo.
9. Frequência de rotina: daily, weekly, monthly.
10. Se você não souber o que fazer, peça esclarecimento de forma amigável.

Lembre-se: você é um assistente conversacional com memória. O histórico da conversa é fornecido a cada mensagem.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private tools: Tool[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly tasksService: TasksService,
    private readonly routinesService: RoutinesService,
    private readonly schedulerService: SchedulerService,
    private readonly databasesService: DatabasesService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada — agente desabilitado, usará fallback.');
    }
    this.tools = this.buildTools();
  }

  /**
   * Define as tools (function declarations) que o Gemini pode chamar.
   */
  private buildTools(): Tool[] {
    return [
      {
        functionDeclarations: [
          // ─── LEITURA ───────────────────────────────────────────
          {
            name: 'list_goals',
            description: 'Lista as metas do usuário. Pode filtrar por status (ACTIVE, COMPLETED, ARCHIVED) e categoria.',
            parameters: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
                  description: 'Filtrar por status da meta',
                },
                category: {
                  type: 'string',
                  enum: ['pessoal', 'trabalho', 'financeiro', 'saude', 'estudo'],
                  description: 'Filtrar por categoria',
                },
              },
            },
          },
          {
            name: 'list_tasks',
            description: 'Lista tarefas do usuário. Pode filtrar por status (ACTIVE/COMPLETED), goalId ou data (YYYY-MM-DD).',
            parameters: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] },
                goalId: { type: 'string', description: 'ID da meta para listar apenas suas tarefas' },
                date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
              },
            },
          },
          {
            name: 'list_routines',
            description: 'Lista as rotinas do usuário. Pode filtrar por ativas/inativas.',
            parameters: {
              type: 'object',
              properties: {
                activeOnly: { type: 'boolean', description: 'Se true, retorna apenas rotinas ativas' },
              },
            },
          },
          {
            name: 'list_appointments',
            description: 'Lista os compromissos do usuário. Pode filtrar por data (YYYY-MM-DD).',
            parameters: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
              },
            },
          },
          {
            name: 'get_today_summary',
            description: 'Retorna um resumo do dia atual: tarefas pendentes, rotinas de hoje, compromissos, metas em andamento.',
            parameters: { type: 'object', properties: {} },
          },
          {
            name: 'search',
            description: 'Busca por termo em metas, tarefas, rotinas, compromissos e databases do usuário.',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Termo de busca' },
              },
              required: ['query'],
            },
          },

          // ─── ESCRITA (criação) ────────────────────────────────
          {
            name: 'create_goal',
            description: 'Cria uma nova meta para o usuário.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Título da meta' },
                description: { type: 'string' },
                category: { type: 'string', enum: ['pessoal', 'trabalho', 'financeiro', 'saude', 'estudo'] },
                priority: { type: 'string', enum: ['baixa', 'media', 'alta'] },
                deadline: { type: 'string', description: 'Prazo no formato YYYY-MM-DD' },
              },
              required: ['title'],
            },
          },
          {
            name: 'create_task',
            description: 'Cria uma nova tarefa (pontual, não-recorrente).',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string', description: 'Data alvo no formato YYYY-MM-DD' },
                goalId: { type: 'string', description: 'Vincular à meta existente (opcional)' },
              },
              required: ['title'],
            },
          },
          {
            name: 'create_routine',
            description: 'Cria uma rotina recorrente (diária/semanal/mensal).',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                time: { type: 'string', description: 'Horário no formato HH:MM' },
                duration: { type: 'number', description: 'Duração em minutos' },
              },
              required: ['title', 'time'],
            },
          },
          {
            name: 'create_appointment',
            description: 'Cria um compromisso pontual e reorganiza rotinas conflitantes.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
                startTime: { type: 'string', description: 'Início no formato HH:MM' },
                endTime: { type: 'string', description: 'Fim no formato HH:MM' },
              },
              required: ['title', 'date', 'startTime', 'endTime'],
            },
          },
          {
            name: 'create_database',
            description: 'Cria um novo database vazio com propriedades customizadas. Para começar de um preset pronto (Finanças, Lista de Compras, etc.), use create_database_from_preset.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                icon: { type: 'string' },
                properties: {
                  type: 'array',
                  description: 'Lista de propriedades do database',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string', enum: ['text', 'number', 'currency', 'date', 'checkbox', 'select', 'multi_select'] },
                      options: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['name', 'type'],
                  },
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'create_database_from_preset',
            description: 'Cria um database pronto a partir de um preset. Presets disponíveis: finance (Finanças), shopping (Lista de Compras), study (Estudos), habits (Hábitos).',
            parameters: {
              type: 'object',
              properties: {
                presetType: {
                  type: 'string',
                  enum: ['finance', 'shopping', 'study', 'habits'],
                  description: 'Tipo do preset',
                },
              },
              required: ['presetType'],
            },
          },
          {
            name: 'add_to_database',
            description: 'Adiciona uma linha/registro a um database existente. Use databaseTitle (mais amigável) ou databaseId. Os valores são passados como { nomeDaColuna: valor } — a IA não precisa saber o ID da coluna.',
            parameters: {
              type: 'object',
              properties: {
                databaseTitle: { type: 'string', description: 'Título do database (ex: "Finanças", "Lista de Compras")' },
                databaseId: { type: 'string', description: 'ID do database (alternativa ao título)' },
                values: {
                  type: 'object',
                  description: 'Objeto { coluna: valor } — a IA deve usar o NOME da coluna, não o ID',
                },
              },
              required: ['values'],
            },
          },
          {
            name: 'log_expense',
            description: 'Atalho para registrar um gasto no preset Finanças. Cria o preset automaticamente se não existir. Use para: "gastei X em Y", "comprei X por Y", "paguei X de Y".',
            parameters: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'Descrição do gasto (ex: "pastel", "uber", "almoço")' },
                amount: { type: 'number', description: 'Valor em reais (ex: 25.50)' },
                category: { type: 'string', description: 'Categoria: Alimentação, Transporte, Lazer, Saúde, Educação, Moradia, Outros' },
                date: { type: 'string', description: 'Data do gasto (YYYY-MM-DD), opcional — default hoje' },
              },
              required: ['description', 'amount'],
            },
          },
          {
            name: 'list_databases',
            description: 'Lista todos os databases do usuário (exceto os que não são presets). Útil para descobrir quais databases existem antes de consultar.',
            parameters: {
              type: 'object',
              properties: {
                onlyPresets: { type: 'boolean', description: 'Se true, retorna apenas os databases que vieram de presets' },
              },
            },
          },
          {
            name: 'get_database_schema',
            description: 'Retorna o schema (nome, tipo, opções) das colunas de um database específico. Use ANTES de query_database para entender quais colunas e valores são válidos.',
            parameters: {
              type: 'object',
              properties: {
                databaseTitle: { type: 'string' },
                databaseId: { type: 'string' },
              },
            },
          },
          {
            name: 'get_database_rows',
            description: 'Lista as linhas (registros) de um database. Use para responder perguntas como "quais gastos eu tive essa semana", "o que tem na minha lista de compras".',
            parameters: {
              type: 'object',
              properties: {
                databaseTitle: { type: 'string' },
                databaseId: { type: 'string' },
                limit: { type: 'number', description: 'Limite de linhas a retornar (default 50)' },
              },
            },
          },
          {
            name: 'query_database',
            description: 'Consulta um database com filtro por categoria e/ou período. Útil para perguntas como "quanto gastei com Alimentação esta semana".',
            parameters: {
              type: 'object',
              properties: {
                databaseTitle: { type: 'string' },
                databaseId: { type: 'string' },
                categoryColumn: { type: 'string', description: 'Nome da coluna de categoria (ex: "Categoria")' },
                categoryValue: { type: 'string', description: 'Valor da categoria (ex: "Alimentação")' },
                dateColumn: { type: 'string', description: 'Nome da coluna de data' },
                dateFrom: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
                dateTo: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
                aggregate: { type: 'string', enum: ['sum', 'count', 'list', 'average'], description: 'Tipo de agregação: sum (somar coluna numérica), count (contar linhas), list (listar valores), average (média)' },
                aggregateColumn: { type: 'string', description: 'Coluna numérica para somar / agregar' },
              },
            },
          },

          // ─── ESCRITA (atualização) ─────────────────────────────
          {
            name: 'complete_task',
            description: 'Marca uma tarefa como concluída.',
            parameters: {
              type: 'object',
              properties: {
                taskId: { type: 'string' },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'update_routine_time',
            description: 'Atualiza o horário de uma rotina existente (usado para reagendar quando há conflito).',
            parameters: {
              type: 'object',
              properties: {
                routineId: { type: 'string' },
                newTime: { type: 'string', description: 'Novo horário no formato HH:MM' },
                newDate: { type: 'string', description: 'Nova data se for tarefa gerada (YYYY-MM-DD)' },
                taskId: { type: 'string', description: 'ID da tarefa gerada a mover (opcional)' },
              },
              required: ['routineId'],
            },
          },
        ],
      },
    ];
  }

  /**
   * Processa uma mensagem do usuário com o agente Gemini (function calling).
   * Retorna a resposta final em linguagem natural + as tools chamadas (para auditoria).
   */
  async process(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }> = [],
  ): Promise<{ text: string; toolCalls: Array<{ name: string; args: any; result: any }>; source: 'gemini' | 'fallback' }> {
    if (!this.genAI) {
      // Fallback quando Gemini não está configurado
      return {
        text: '⚠️ IA não configurada (GEMINI_API_KEY ausente). Verifique o arquivo `apps/backend/.env`.',
        toolCalls: [],
        source: 'fallback',
      };
    }

    // Retry com backoff para erros 503 (sobrecarga do Gemini)
    const MAX_RETRIES = 3;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.attemptProcess(userMessage, history);
      } catch (err: any) {
        lastErr = err;
        const isOverload = err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('overloaded');
        if (!isOverload || attempt === MAX_RETRIES) throw err;
        const wait = attempt * 2000; // 2s, 4s, 6s
        this.logger.warn(`Gemini sobrecarregado (tentativa ${attempt}/${MAX_RETRIES}), aguardando ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
    throw lastErr;
  }

  private async attemptProcess(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }> = [],
  ): Promise<{ text: string; toolCalls: Array<{ name: string; args: any; result: any }>; source: 'gemini' | 'fallback' }> {
    const model = this.genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      tools: this.tools,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    const toolCalls: Array<{ name: string; args: any; result: any }> = [];
    let turns = 0;

    // Loop: processa function calls até o modelo dar uma resposta final em texto
    while (response.functionCalls() && response.functionCalls()!.length > 0 && turns < MAX_TOOL_TURNS) {
      const calls = response.functionCalls()!;
      const functionResponses: any[] = [];

      for (const call of calls) {
        this.logger.log(`Tool call: ${call.name}(${JSON.stringify(call.args)})`);
        let toolResult: any;
        try {
          toolResult = await this.executeTool(call.name, call.args || {});
        } catch (err: any) {
          this.logger.error(`Tool ${call.name} falhou: ${err.message}`);
          toolResult = { error: err.message };
        }
        toolCalls.push({ name: call.name, args: call.args, result: toolResult });
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        });
      }

      // Envia os resultados das tools de volta ao Gemini
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      turns++;
    }

    const finalText = response.text() || 'Pronto, ação concluída.';

    // Persistir log da IA (igual ao /ai/parse)
    try {
      await this.prisma.aILog.create({
        data: {
          userId: MOCK_USER_ID,
          input: userMessage,
          result: JSON.stringify({ toolCalls, text: finalText }),
        },
      });
    } catch (err) {
      this.logger.warn(`Falha ao persistir AILog: ${err.message}`);
    }

    return { text: finalText, toolCalls, source: 'gemini' };
  }

  /**
   * Executa uma tool. Retorna um objeto simples (sem PII) para enviar de volta ao Gemini.
   */
  private async executeTool(name: string, args: any): Promise<any> {
    const userId = MOCK_USER_ID; // TODO: migrar para @CurrentUser quando backend estiver autenticado em todas as rotas
    switch (name) {
      // ─── LEITURA ─────────────────────────────────────────────
      case 'list_goals': {
        const goals = await this.goalsService.findAll(userId, {
          status: args.status,
          category: args.category,
        });
        return {
          count: goals.length,
          goals: goals.map((g) => ({
            id: g.id,
            title: g.title,
            category: g.category,
            status: g.status,
            deadline: g.deadline,
            milestones: g.milestones?.length || 0,
            tasks: g.tasks?.length || 0,
          })),
        };
      }
      case 'list_tasks': {
        const tasks = await this.tasksService.findAll(userId, {
          status: args.status,
          goalId: args.goalId,
        });
        let filtered = tasks;
        if (args.date) filtered = tasks.filter((t) => t.date === args.date);
        return {
          count: filtered.length,
          tasks: filtered.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.date,
            completed: t.completed,
            goalId: t.goalId,
          })),
        };
      }
      case 'list_routines': {
        const routines = await this.routinesService.findAll(userId, {
          active: args.activeOnly,
        });
        return {
          count: routines.length,
          routines: routines.map((r) => ({
            id: r.id,
            title: r.title,
            frequency: r.frequency,
            time: r.time,
            duration: r.duration,
            active: r.active,
          })),
        };
      }
      case 'list_appointments': {
        const appts = await this.schedulerService.findAll(userId);
        let filtered = appts;
        if (args.date) filtered = appts.filter((a) => a.date === args.date);
        return {
          count: filtered.length,
          appointments: filtered.map((a) => ({
            id: a.id,
            title: a.title,
            date: a.date,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
        };
      }
      case 'get_today_summary': {
        const today = new Date().toISOString().split('T')[0];
        const tasks = await this.tasksService.findAll(userId);
        const todayTasks = tasks.filter((t) => t.date === today);
        const routines = await this.routinesService.findAll(userId, { active: true });
        const appts = await this.schedulerService.findAll(userId);
        const todayAppts = appts.filter((a) => a.date === today);
        const goals = await this.goalsService.findAll(userId, { status: 'ACTIVE' });
        return {
          date: today,
          tasks: { total: todayTasks.length, completed: todayTasks.filter((t) => t.completed).length, pending: todayTasks.filter((t) => !t.completed).map((t) => t.title) },
          routines: { count: routines.length, list: routines.map((r) => ({ title: r.title, time: r.time })) },
          appointments: { count: todayAppts.length, list: todayAppts.map((a) => `${a.title} (${a.startTime}-${a.endTime})`) },
          activeGoals: goals.length,
        };
      }
      case 'search': {
        const q = String(args.query || '').toLowerCase();
        const goals = await this.goalsService.findAll(userId);
        const tasks = await this.tasksService.findAll(userId);
        const routines = await this.routinesService.findAll(userId);
        return {
          goals: goals.filter((g) => g.title.toLowerCase().includes(q)).map((g) => g.title),
          tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)).map((t) => t.title),
          routines: routines.filter((r) => r.title.toLowerCase().includes(q)).map((r) => r.title),
        };
      }

      // ─── ESCRITA ─────────────────────────────────────────────
      case 'create_goal': {
        const goal = await this.goalsService.create(userId, {
          title: args.title,
          description: args.description,
          category: args.category,
          priority: args.priority,
          deadline: args.deadline,
        });
        return { id: goal.id, title: goal.title, status: 'created' };
      }
      case 'create_task': {
        const task = await this.tasksService.create(userId, {
          title: args.title,
          description: args.description,
          date: args.date,
          goalId: args.goalId,
        });
        return { id: task.id, title: task.title, status: 'created' };
      }
      case 'create_routine': {
        const routine = await this.routinesService.create(userId, {
          title: args.title,
          frequency: args.frequency || 'daily',
          time: args.time,
          duration: args.duration || 60,
        });
        // Gera tarefas para os próximos 7 dias
        await this.routinesService.generateTasks(userId, routine.id, 7);
        return { id: routine.id, title: routine.title, frequency: routine.frequency, time: routine.time, status: 'created' };
      }
      case 'create_appointment': {
        const result = await this.schedulerService.createAppointment(userId, {
          title: args.title,
          date: args.date,
          startTime: args.startTime,
          endTime: args.endTime,
        });
        return {
          id: result.appointment.id,
          title: result.appointment.title,
          date: result.appointment.date,
          status: 'created',
          reorganization: { movedCount: result.moved.length, message: result.message },
        };
      }
      case 'create_database': {
        // Cria database + propriedades em sequência
        const db = await this.databasesService.create(userId, { title: args.title, icon: args.icon });
        const props = args.properties || [];
        for (let i = 0; i < props.length; i++) {
          const p = props[i];
          await this.databasesService.addProperty(userId, db.id, {
            name: p.name,
            type: p.type,
            options: p.options ? JSON.stringify(p.options) : undefined,
          } as any);
        }
        return { id: db.id, title: db.title, propertiesCount: props.length, status: 'created' };
      }
      case 'create_database_from_preset': {
        const db = await this.databasesService.createFromPreset(userId, args.presetType);
        return { id: db.id, title: db.title, icon: db.icon, propertiesCount: db.properties.length, status: 'created' };
      }
      case 'add_to_database': {
        // Resolve database (por ID ou título — normalizado para ignorar acentos/maiúsculas)
        let databaseId = args.databaseId;
        if (!databaseId && args.databaseTitle) {
          const db = await this.databasesService.findAll(userId);
          const target = normalize(args.databaseTitle);
          const found = db.find((d) => normalize(d.title) === target);
          if (!found) {
            return { error: `Database com título "${args.databaseTitle}" não encontrado. Crie-o primeiro.` };
          }
          databaseId = found.id;
        }
        if (!databaseId) return { error: 'Forneça databaseId ou databaseTitle.' };
        const row = await this.databasesService.addRow(userId, databaseId, { values: args.values });
        return { id: row.id, databaseId, values: args.values, status: 'row_added' };
      }
      case 'log_expense': {
        // Cria preset Finanças automaticamente se não existir
        const today = new Date().toISOString().split('T')[0];
        const values = {
          'Descrição': args.description,
          'Valor': args.amount,
          'Categoria': args.category || 'Outros',
          'Data': args.date || today,
          'Tipo': 'Despesa',
        };
        const row = await this.databasesService.addRowToPreset(userId, 'finance', values);
        return { id: row.id, ...values, status: 'expense_logged' };
      }
      case 'list_databases': {
        const all = await this.databasesService.findAll(userId);
        const filtered = args.onlyPresets ? all.filter((d) => d.isPreset) : all;
        return {
          count: filtered.length,
          databases: filtered.map((d) => ({
            id: d.id,
            title: d.title,
            icon: d.icon,
            isPreset: d.isPreset,
            presetType: d.presetType,
            propertiesCount: d.properties?.length || 0,
            rowsCount: (d as any)._count?.rows || 0,
          })),
        };
      }
      case 'get_database_schema': {
        let databaseId = args.databaseId;
        if (!databaseId && args.databaseTitle) {
          const db = await this.databasesService.findAll(userId);
          const target = normalize(args.databaseTitle);
          const found = db.find((d) => normalize(d.title) === target);
          if (!found) return { error: `Database "${args.databaseTitle}" não encontrado.` };
          databaseId = found.id;
        }
        if (!databaseId) return { error: 'Forneça databaseId ou databaseTitle.' };
        const db = await this.databasesService.findOne(userId, databaseId);
        return {
          databaseId: db.id,
          title: db.title,
          icon: db.icon,
          isPreset: db.isPreset,
          properties: db.properties.map((p: any) => {
            let opts: any = null;
            try { opts = p.options ? JSON.parse(p.options) : null; } catch {}
            return {
              id: p.id,
              name: p.name,
              type: p.type,
              options: opts,
              order: p.order,
            };
          }),
        };
      }
      case 'get_database_rows': {
        let databaseId = args.databaseId;
        if (!databaseId && args.databaseTitle) {
          const db = await this.databasesService.findAll(userId);
          const target = normalize(args.databaseTitle);
          const found = db.find((d) => normalize(d.title) === target);
          if (!found) return { error: `Database "${args.databaseTitle}" não encontrado.` };
          databaseId = found.id;
        }
        if (!databaseId) return { error: 'Forneça databaseId ou databaseTitle.' };
        const db = await this.databasesService.findOne(userId, databaseId);
        const limit = args.limit || 50;
        // Decodifica os values JSON de cada linha
        const decodedRows = db.rows.slice(0, limit).map((r: any) => {
          let values: any = {};
          try { values = JSON.parse(r.values); } catch {}
          // Converte { propertyId: value } → { propertyName: value } para legibilidade
          const named: Record<string, any> = {};
          for (const prop of db.properties) {
            named[prop.name] = values[prop.id];
          }
          return { id: r.id, order: r.order, values: named };
        });
        return {
          databaseId,
          title: db.title,
          properties: db.properties.map((p: any) => ({ name: p.name, type: p.type })),
          count: decodedRows.length,
          totalRows: db.rows.length,
          rows: decodedRows,
        };
      }
      case 'query_database': {
        let databaseId = args.databaseId;
        if (!databaseId && args.databaseTitle) {
          const db = await this.databasesService.findAll(userId);
          const target = normalize(args.databaseTitle);
          const found = db.find((d) => normalize(d.title) === target);
          if (!found) return { error: `Database "${args.databaseTitle}" não encontrado.` };
          databaseId = found.id;
        }
        if (!databaseId) return { error: 'Forneça databaseId ou databaseTitle.' };
        const db = await this.databasesService.findOne(userId, databaseId);

        // Encontra IDs das colunas pelos nomes
        const colByName: Record<string, any> = {};
        for (const p of db.properties) colByName[p.name] = p;
        const catCol = args.categoryColumn ? colByName[args.categoryColumn] : null;
        const dateCol = args.dateColumn ? colByName[args.dateColumn] : null;
        const aggCol = args.aggregateColumn ? colByName[args.aggregateColumn] : null;

        // Filtra linhas
        let rows = db.rows;
        const filtered: any[] = [];
        for (const r of rows) {
          let values: any = {};
          try { values = JSON.parse(r.values); } catch { continue; }
          if (catCol && args.categoryValue !== undefined && values[catCol.id] !== args.categoryValue) continue;
          if (dateCol) {
            const v = values[dateCol.id];
            if (args.dateFrom && v < args.dateFrom) continue;
            if (args.dateTo && v > args.dateTo) continue;
          }
          filtered.push(values);
        }

        // Agrega
        let aggregated: any = null;
        if (args.aggregate === 'count') {
          aggregated = { count: filtered.length };
        } else if (args.aggregate === 'sum' && aggCol) {
          const total = filtered.reduce((acc, v) => acc + (Number(v[aggCol.id]) || 0), 0);
          aggregated = { sum: total, count: filtered.length };
        } else if (args.aggregate === 'average' && aggCol) {
          const sum = filtered.reduce((acc, v) => acc + (Number(v[aggCol.id]) || 0), 0);
          aggregated = { average: filtered.length > 0 ? sum / filtered.length : 0, count: filtered.length };
        } else if (args.aggregate === 'list') {
          aggregated = { rows: filtered.map((v) => {
            const named: Record<string, any> = {};
            for (const p of db.properties) named[p.name] = v[p.id];
            return named;
          }) };
        } else {
          aggregated = { count: filtered.length, rows: filtered.slice(0, 50) };
        }

        return {
          databaseId,
          title: db.title,
          filter: { categoryColumn: args.categoryColumn, categoryValue: args.categoryValue, dateColumn: args.dateColumn, dateFrom: args.dateFrom, dateTo: args.dateTo },
          aggregate: args.aggregate,
          result: aggregated,
        };
      }
      case 'complete_task': {
        const task = await this.tasksService.toggle(userId, args.taskId);
        return { id: task.id, title: task.title, completed: task.completed, status: 'updated' };
      }
      case 'update_routine_time': {
        // Se foi passado taskId, move a tarefa gerada (caso pontual de reagendamento)
        if (args.taskId) {
          const updated = await this.routinesService.updateGeneratedTask(userId, args.taskId, {
            date: args.newDate,
            time: args.newTime,
          } as any);
          return { taskId: updated.id, date: (updated as any).date, time: (updated as any).time, status: 'task_moved' };
        }
        // Caso contrário, atualiza o horário padrão da rotina
        const updated = await this.routinesService.update(userId, args.routineId, {
          time: args.newTime,
        });
        return { id: updated.id, title: updated.title, time: updated.time, status: 'routine_updated' };
      }
      default:
        return { error: `Ferramenta desconhecida: ${name}` };
    }
  }
}
