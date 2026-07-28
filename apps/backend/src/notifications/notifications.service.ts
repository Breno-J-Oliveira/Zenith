import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder';

export interface CreateNotificationDTO {
  title: string;
  body: string;
  type?: NotificationType;
  relatedType?: string;
  relatedId?: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista notificações do utilizador.
   * @param userId id do utilizador
   * @param unreadOnly se true devolve só não lidas
   * @param type filtro opcional por tipo (info, success, warning, error, reminder)
   * @param limit máximo de notificações (default 50)
   */
  async findAll(userId: string, unreadOnly = false, type?: NotificationType, limit = 50) {
    const records = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
        ...(type && { type: type as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map((r) => this.format(r));
  }

  /**
   * Conta notificações: total, não lidas, e por tipo.
   * Usado pelo frontend para o badge do sino de notificações.
   */
  async count(userId: string): Promise<NotificationCount> {
    const records = await this.prisma.notification.findMany({
      where: { userId },
      select: { read: true, type: true },
    });
    const byType: Record<string, number> = {
      info: 0, success: 0, warning: 0, error: 0, reminder: 0,
    };
    let unread = 0;
    for (const r of records) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      if (!r.read) unread++;
    }
    return { total: records.length, unread, byType: byType as any };
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!record) throw new NotFoundException(`Notificação ${id} não encontrada`);
    return this.format(record);
  }

  async create(userId: string, dto: CreateNotificationDTO) {
    const record = await this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        body: dto.body,
        type: (dto.type || 'info') as any,
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
      },
    });
    return this.format(record);
  }

  /**
   * Auto-cria notificação quando um compromisso é criado.
   * Chamado pelo SchedulerService.createAppointment.
   */
  async createForAppointment(userId: string, appointmentId: string, title: string, date: string, startTime: string) {
    return this.create(userId, {
      title: `📅 Compromisso: ${title}`,
      body: `Hoje às ${startTime}`,
      type: 'reminder',
      relatedType: 'appointment',
      relatedId: appointmentId,
    });
  }

  /**
   * Auto-cria notificação para rotinas que estão agendadas para hoje.
   * Chamado pelo /notifications/auto-check (que pode ser invocado por cron).
   */
  async notifyTodaysRoutines(userId: string) {
    const routines = await this.prisma.routine.findMany({
      where: { userId, active: true },
    });
    const today = new Date().toISOString().split('T')[0];
    const created: any[] = [];
    for (const r of routines) {
      // Evita duplicar: só cria se não existir notificação para essa rotina hoje
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          relatedType: 'routine',
          relatedId: r.id,
          createdAt: { gte: new Date(today + 'T00:00:00.000Z') },
        },
      });
      if (existing) continue;
      const created1 = await this.create(userId, {
        title: `🔄 Rotina: ${r.title}`,
        body: `Não esqueça da sua rotina de hoje às ${r.time}!`,
        type: 'reminder',
        relatedType: 'routine',
        relatedId: r.id,
      });
      created.push(created1);
    }
    return { count: created.length, notifications: created };
  }

  /**
   * Auto-cria notificação quando a IA reorganiza algo (ex: reagendamento de rotina).
   * Chamado pelo SchedulerService.reorganizeDay quando moved.length > 0.
   */
  async createForAIReorg(userId: string, movedTasks: Array<{ taskTitle: string; toTime: string }>) {
    if (movedTasks.length === 0) return null;
    const summary = movedTasks.map((m) => `• ${m.taskTitle} → ${m.toTime}`).join('\n');
    return this.create(userId, {
      title: `🤖 IA reorganizou ${movedTasks.length} tarefa(s)`,
      body: `Para liberar espaço para o novo compromisso:\n${summary}`,
      type: 'info',
      relatedType: 'ai_reorg',
    });
  }

  async markAsRead(userId: string, id: string) {
    const existing = await this.findOne(userId, id);
    const record = await this.prisma.notification.update({
      where: { id: existing.id },
      data: { read: true },
    });
    return this.format(record);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);
    await this.prisma.notification.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { success: true };
  }

  private format(r: any) {
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      type: r.type as NotificationType,
      read: r.read,
      relatedType: r.relatedType,
      relatedId: r.relatedId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
