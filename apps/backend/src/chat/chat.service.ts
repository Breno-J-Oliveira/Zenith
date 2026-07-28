import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';
import { AgentService } from './agent.service';

/**
 * ChatService — gerencia threads e mensagens do chat com a IA.
 *
 * A "inteligência" do agente (function calling, raciocínio, etc.) vive no
 * AgentService. Este service só cuida de:
 *  - CRUD de threads
 *  - Persistência de mensagens
 *  - Conversão do histórico (Prisma) para o formato esperado pelo Gemini
 *  - Delegar o processamento para o AgentService
 *
 * MOCK_USER_ID é usado por enquanto — quando o auth real cobrir o chat,
 * basta passar `user.id` para o AgentService (que já recebe o userId no
 * `executeTool`).
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
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
    // Verifica ownership antes de deletar
    const thread = await this.prisma.chatThread.findFirst({
      where: { id, userId: MOCK_USER_ID },
    });
    if (!thread) throw new NotFoundException('Thread não encontrada');
    return this.prisma.chatThread.delete({ where: { id } });
  }

  // ─── MENSAGENS ────────────────────────────────────────────

  async sendMessage(threadId: string, content: string) {
    // 1. Buscar thread + histórico (precisa para enviar ao Gemini)
    const thread = await this.getThread(threadId);

    // 2. Salvar mensagem do usuário
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'user',
        content,
      },
    });

    // 3. Converter histórico para o formato do Gemini
    //    (só user/assistant — mensagens 'tool' são apenas log, não fazem parte do chat do modelo)
    const history = thread.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.content }],
      }));

    // 4. Processar com o agente (function calling nativo do Gemini)
    //    Com fallback gracioso se o provedor estiver sobrecarregado.
    let result;
    try {
      result = await this.agentService.process(content, history);
    } catch (err: any) {
      this.logger.error(`Agent falhou: ${err.message}`);
      result = {
        text: '⚠️ A IA está temporariamente sobrecarregada (erro do provedor). Tente novamente em alguns segundos.',
        toolCalls: [],
        source: 'fallback' as const,
      };
    }

    // 5. Salvar resposta do assistente com as tool calls
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'assistant',
        content: result.text,
        toolCalls: result.toolCalls.length > 0 ? JSON.stringify(result.toolCalls) : null,
      },
    });

    // 6. Atualizar thread (bumped updatedAt)
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage,
      assistantMessage,
    };
  }
}
