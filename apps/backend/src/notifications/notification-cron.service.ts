import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from './notifications.service';

/**
 * NotificationCronService — tarefas agendadas relacionadas a notificações.
 *
 * - A cada 1 hora, verifica rotinas do dia e cria lembretes pendentes.
 * - Executa para TODOS os usuários do sistema.
 */
@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Cron job que roda a cada hora cheia.
   * Varre todos os usuários e dispara notifyTodaysRoutines para cada um.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoCheckAllUsers() {
    this.logger.log('⏰ Iniciando auto-check de notificações para todos os usuários...');
    try {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      this.logger.log(`📋 ${users.length} usuários encontrados para verificação`);

      for (const user of users) {
        try {
          const result = await this.notificationsService.notifyTodaysRoutines(user.id);
          if (result.count > 0) {
            this.logger.log(`🔔 ${result.count} lembretes criados para user ${user.id}`);
          }
        } catch (err: any) {
          this.logger.warn(`⚠️ Erro no auto-check para user ${user.id}: ${err.message}`);
        }
      }

      this.logger.log('✅ Auto-check de notificações concluído');
    } catch (err: any) {
      this.logger.error(`❌ Erro no auto-check global: ${err.message}`);
    }
  }
}