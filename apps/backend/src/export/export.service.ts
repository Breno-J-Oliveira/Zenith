import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';

/**
 * ExportService — exporta todos os dados do usuário em JSON ou CSV.
 *
 * O JSON inclui TODAS as entidades (metas, tarefas, rotinas, compromissos,
 * páginas, databases com rows, notificações, threads de chat).
 * O CSV é focado em dados tabulares (rows dos databases).
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export completo do usuário em JSON.
   * Estrutura: { version, exportedAt, userId, data: { ... } }
   */
  async exportAllAsJson(userId: string = MOCK_USER_ID) {
    this.logger.log(`Exportando dados JSON para userId=${userId}`);
    const [
      goals, tasks, routines, appointments,
      pages, databases, notifications, chatThreads, chatMessages,
    ] = await Promise.all([
      this.prisma.goal.findMany({ where: { userId }, include: { milestones: true } }),
      this.prisma.task.findMany({ where: { userId } }),
      this.prisma.routine.findMany({ where: { userId } }),
      this.prisma.appointment.findMany({ where: { userId } }),
      this.prisma.page.findMany({ where: { userId } }),
      this.prisma.database.findMany({ where: { userId }, include: { properties: true, rows: true, views: true } }),
      this.prisma.notification.findMany({ where: { userId } }),
      this.prisma.chatThread.findMany({ where: { userId } }),
      this.prisma.chatMessage.findMany({ where: { thread: { userId } } }),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId,
      data: {
        goals,
        tasks,
        routines,
        appointments,
        pages,
        databases,
        notifications,
        chatThreads,
        chatMessages,
      },
      summary: {
        goalsCount: goals.length,
        tasksCount: tasks.length,
        routinesCount: routines.length,
        appointmentsCount: appointments.length,
        pagesCount: pages.length,
        databasesCount: databases.length,
        notificationsCount: notifications.length,
        chatThreadsCount: chatThreads.length,
        chatMessagesCount: chatMessages.length,
      },
    };
  }

  /**
   * Export tabular de databases em CSV.
   * Cada database vira uma seção com seu nome.
   * Linhas são convertidas para CSV com as colunas do schema.
   */
  async exportAllAsCsv(userId: string = MOCK_USER_ID): Promise<string> {
    this.logger.log(`Exportando dados CSV para userId=${userId}`);
    const databases = await this.prisma.database.findMany({
      where: { userId },
      include: { properties: true, rows: true },
    });

    const lines: string[] = [];
    lines.push('# Zenith export — databases tabulares');
    lines.push(`# exportado em: ${new Date().toISOString()}`);
    lines.push('');

    for (const db of databases) {
      lines.push(`## ${db.title}`);
      // Header
      const header = ['id', 'order', ...db.properties.map((p) => this.escapeCsv(p.name))];
      lines.push(header.join(','));
      // Rows
      for (const row of db.rows) {
        let values: any = {};
        try { values = JSON.parse(row.values); } catch { /* ignore */ }
        const cells = [
          row.id,
          String(row.order),
          ...db.properties.map((p) => this.escapeCsv(String(values[p.id] ?? ''))),
        ];
        lines.push(cells.join(','));
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private escapeCsv(value: string): string {
    // Escapa aspas e vírgulas
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
