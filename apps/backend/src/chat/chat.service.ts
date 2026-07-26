import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
import { GoalsService } from '../goals/goals.service';
import { TasksService } from '../tasks/tasks.service';
import { RoutinesService } from '../routines/routines.service';
import { DatabasesService } from '../databases/databases.service';

// MOCK_USER_ID importado de prisma.service.ts para garantir consistência.

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private goalsService: GoalsService,
    private tasksService: TasksService,
    private routinesService: RoutinesService,
    private databasesService: DatabasesService,
  ) {}

  // ─── THREADS ──────────────────────────────────────────────

  async getThreads() {
    return this.prisma.chatThread.findMany({
      where: { userId: MOCK_USER_ID },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getThread(id: string) {
    const thread = await this.prisma.chatThread.findFirst({
      where: { id, userId: MOCK_USER_ID },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!thread) throw new NotFoundException('Thread não encontrada');
    return thread;
  }

  async createThread(title?: string) {
    return this.prisma.chatThread.create({
      data: {
        userId: MOCK_USER_ID,
        title: title || 'Nova conversa',
      },
    });
  }

  async deleteThread(id: string) {
    return this.prisma.chatThread.delete({ where: { id } });
  }

  // ─── MENSAGENS ────────────────────────────────────────────

  async sendMessage(threadId: string, content: string) {
    // Salvar mensagem do usuário
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'user',
        content,
      },
    });

    // Processar com IA (mock por enquanto)
    const response = await this.processWithAI(threadId, content);

    // Atualizar thread
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage,
      assistantMessage: response,
    };
  }

  // ─── PROCESSAMENTO IA ─────────────────────────────────────

  private async processWithAI(threadId: string, userMessage: string) {
    // Detectar intenção e executar ferramentas
    const tools = this.detectTools(userMessage);
    const toolResults: ToolResult[] = [];

    for (const tool of tools) {
      const result = await this.executeTool(tool);
      toolResults.push(result);
    }

    // Gerar resposta
    const response = this.generateResponse(userMessage, tools, toolResults);

    // Salvar mensagem da IA
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'assistant',
        content: response,
        toolCalls: tools.length > 0 ? JSON.stringify(tools) : null,
      },
    });

    return assistantMessage;
  }

  // ─── DETECÇÃO DE FERRAMENTAS ──────────────────────────────

  private detectTools(message: string): ToolCall[] {
    const tools: ToolCall[] = [];
    const lowerMsg = message.toLowerCase();

    // Listar metas
    if (lowerMsg.includes('listar metas') || lowerMsg.includes('minhas metas') || lowerMsg.includes('show metas')) {
      tools.push({ name: 'list_goals', arguments: {} });
    }

    // Listar tarefas
    if (lowerMsg.includes('listar tarefas') || lowerMsg.includes('minhas tarefas') || lowerMsg.includes('show tasks')) {
      tools.push({ name: 'list_tasks', arguments: {} });
    }

    // Listar rotinas
    if (lowerMsg.includes('listar rotinas') || lowerMsg.includes('minhas rotinas') || lowerMsg.includes('show routines')) {
      tools.push({ name: 'list_routines', arguments: {} });
    }

    // Criar meta
    const metaMatch = lowerMsg.match(/criar meta[:\s]+["']?([^"'\n]+)["']?/);
    if (metaMatch) {
      tools.push({
        name: 'create_goal',
        arguments: { title: metaMatch[1].trim() },
      });
    }

    // Criar tarefa
    const tarefaMatch = lowerMsg.match(/criar tarefa[:\s]+["']?([^"'\n]+)["']?/);
    if (tarefaMatch) {
      tools.push({
        name: 'create_task',
        arguments: { title: tarefaMatch[1].trim() },
      });
    }

    // Criar rotina
    const rotinaMatch = lowerMsg.match(/criar rotina[:\s]+["']?([^"'\n]+)["']?/);
    if (rotinaMatch) {
      tools.push({
        name: 'create_routine',
        arguments: { title: rotinaMatch[1].trim() },
      });
    }

    // Resumo do dia
    if (lowerMsg.includes('resumo do dia') || lowerMsg.includes('como está meu dia') || lowerMsg.includes('briefing')) {
      tools.push({ name: 'get_today_summary', arguments: {} });
    }

    // Buscar
    const buscaMatch = lowerMsg.match(/buscar[:\s]+["']?([^"'\n]+)["']?/);
    if (buscaMatch) {
      tools.push({
        name: 'search',
        arguments: { query: buscaMatch[1].trim() },
      });
    }

    return tools;
  }

  // ─── EXECUÇÃO DE FERRAMENTAS ──────────────────────────────

  private async executeTool(tool: ToolCall): Promise<ToolResult> {
    try {
      switch (tool.name) {
        case 'list_goals': {
          const goals = await this.goalsService.findAll({});
          return { success: true, data: goals };
        }

        case 'list_tasks': {
          const tasks = await this.tasksService.findAll();
          return { success: true, data: tasks };
        }

        case 'list_routines': {
          const routines = await this.routinesService.findAll();
          return { success: true, data: routines };
        }

        case 'create_goal': {
          const goal = await this.goalsService.create({
            title: tool.arguments.title,
            category: tool.arguments.category || 'pessoal',
            priority: tool.arguments.priority || 'media',
          });
          return { success: true, data: goal };
        }

        case 'create_task': {
          const task = await this.tasksService.create({
            title: tool.arguments.title,
            goalId: tool.arguments.goalId,
          });
          return { success: true, data: task };
        }

        case 'create_routine': {
          const routine = await this.routinesService.create({
            title: tool.arguments.title,
            time: tool.arguments.time || '08:00',
            duration: tool.arguments.duration || 60,
            frequency: tool.arguments.frequency || 'daily',
          });
          return { success: true, data: routine };
        }

        case 'get_today_summary': {
          const tasks = await this.tasksService.findAll();
          const routines = await this.routinesService.findAll();
          const today = new Date().toISOString().split('T')[0];
          const todayTasks = tasks.filter((t: any) => t.date === today);
          return {
            success: true,
            data: {
              totalTasks: tasks.length,
              todayTasks: todayTasks.length,
              completedToday: todayTasks.filter((t: any) => t.completed).length,
              activeRoutines: routines.filter((r: any) => r.active).length,
            },
          };
        }

        case 'search': {
          const query = tool.arguments.query.toLowerCase();
          const goals = await this.goalsService.findAll({});
          const tasks = await this.tasksService.findAll();
          
          const matchedGoals = goals.filter((g: any) => 
            g.title.toLowerCase().includes(query)
          );
          const matchedTasks = tasks.filter((t: any) => 
            t.title.toLowerCase().includes(query)
          );

          return {
            success: true,
            data: {
              goals: matchedGoals,
              tasks: matchedTasks,
            },
          };
        }

        default:
          return { success: false, error: `Ferramenta desconhecida: ${tool.name}` };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─── GERAÇÃO DE RESPOSTA ──────────────────────────────────

  private generateResponse(userMessage: string, tools: ToolCall[], results: ToolResult[]): string {
    if (tools.length === 0) {
      return this.generateGeneralResponse(userMessage);
    }

    const responses: string[] = [];

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const result = results[i];

      if (!result.success) {
        responses.push(`❌ Erro ao executar ${tool.name}: ${result.error}`);
        continue;
      }

      switch (tool.name) {
        case 'list_goals': {
          const goals = result.data;
          if (goals.length === 0) {
            responses.push('📋 Você não tem metas cadastradas.');
          } else {
            const active = goals.filter((g: any) => g.status === 'ACTIVE');
            const completed = goals.filter((g: any) => g.status === 'COMPLETED');
            responses.push(
              `📋 **Suas Metas:**\n` +
              `• Total: ${goals.length}\n` +
              `• Ativas: ${active.length}\n` +
              `• Concluídas: ${completed.length}\n\n` +
              goals.map((g: any) => `  → ${g.title} (${g.status})`).join('\n')
            );
          }
          break;
        }

        case 'list_tasks': {
          const tasks = result.data;
          const pending = tasks.filter((t: any) => !t.completed);
          const completed = tasks.filter((t: any) => t.completed);
          responses.push(
            `✅ **Suas Tarefas:**\n` +
            `• Total: ${tasks.length}\n` +
            `• Pendentes: ${pending.length}\n` +
            `• Concluídas: ${completed.length}`
          );
          break;
        }

        case 'list_routines': {
          const routines = result.data;
          const active = routines.filter((r: any) => r.active);
          responses.push(
            `🔄 **Suas Rotinas:**\n` +
            `• Total: ${routines.length}\n` +
            `• Ativas: ${active.length}\n\n` +
            routines.map((r: any) => `  → ${r.title} (${r.frequency} às ${r.time})`).join('\n')
          );
          break;
        }

        case 'create_goal': {
          responses.push(`🎯 Meta criada com sucesso: **${result.data.title}**`);
          break;
        }

        case 'create_task': {
          responses.push(`✅ Tarefa criada com sucesso: **${result.data.title}**`);
          break;
        }

        case 'create_routine': {
          responses.push(`🔄 Rotina criada com sucesso: **${result.data.title}** (${result.data.frequency} às ${result.data.time})`);
          break;
        }

        case 'get_today_summary': {
          const data = result.data;
          responses.push(
            `📊 **Resumo do Dia:**\n` +
            `• Tarefas hoje: ${data.todayTasks}\n` +
            `• Concluídas: ${data.completedToday}\n` +
            `• Rotinas ativas: ${data.activeRoutines}`
          );
          break;
        }

        case 'search': {
          const data = result.data;
          const total = data.goals.length + data.tasks.length;
          responses.push(
            `🔍 **Resultados da busca:**\n` +
            `• Metas encontradas: ${data.goals.length}\n` +
            `• Tarefas encontradas: ${data.tasks.length}\n` +
            `• Total: ${total} resultados`
          );
          break;
        }
      }
    }

    return responses.join('\n\n');
  }

  private generateGeneralResponse(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('hey')) {
      return '👋 Olá! Como posso ajudar você hoje? Posso listar suas metas, tarefas, rotinas, criar novas items, ou fazer um resumo do seu dia.';
    }

    if (lowerMsg.includes('ajuda') || lowerMsg.includes('help')) {
      return (
        '🤖 **Comandos disponíveis:**\n\n' +
        '• `listar metas` - Ver todas as suas metas\n' +
        '• `listar tarefas` - Ver todas as suas tarefas\n' +
        '• `listar rotinas` - Ver todas as suas rotinas\n' +
        '• `criar meta: [título]` - Criar uma nova meta\n' +
        '• `criar tarefa: [título]` - Criar uma nova tarefa\n' +
        '• `criar rotina: [título]` - Criar uma nova rotina\n' +
        '• `resumo do dia` - Ver resumo do dia\n' +
        '• `buscar: [termo]` - Buscar metas e tarefas'
      );
    }

    if (lowerMsg.includes('obrigado') || lowerMsg.includes('valeu')) {
      return '😊 De nada! Estou aqui para ajudar. Precisa de mais alguma coisa?';
    }

    return '🤔 Não entendi completamente. Tente usar `ajuda` para ver os comandos disponíveis, ou seja mais específico no que precisa.';
  }
}