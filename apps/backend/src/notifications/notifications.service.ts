import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationDTO {
  title: string;
  body: string;
  type?: NotificationType;
  relatedType?: string;
  relatedId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista notificações do utilizador autenticado.
   * @param unreadOnly se true devolve só não lidas
   */
  async findAll(userId: string, unreadOnly = false) {
    const records = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.format(r));
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
