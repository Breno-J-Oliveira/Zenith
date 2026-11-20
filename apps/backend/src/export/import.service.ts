import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  constructor(private readonly prisma: PrismaService) {}

  async importFile(
    userId: string = MOCK_USER_ID,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ success: boolean; counts: Record<string, number>; errors: string[] }> {
    const errors: string[] = [];
    const counts: Record<string, number> = {};
    if (originalName.endsWith('.json') || mimeType === 'application/json') {
      await this.importJson(userId, buffer, counts, errors);
    } else if (originalName.endsWith('.csv') || mimeType === 'text/csv') {
      await this.importCsv(userId, buffer, counts, errors);
    } else {
      throw new BadRequestException('Use .json ou .csv');
    }
    return { success: errors.length === 0, counts, errors };
  }

  private async importJson(userId: string, buffer: Buffer, counts: Record<string, number>, errors: string[]) {
    let payload: any;
    try { payload = JSON.parse(buffer.toString('utf8')); }
    catch (e: any) { errors.push(`JSON inválido: ${e.message}`); return; }
    if (!payload.data) { errors.push('JSON sem campo "data"'); return; }
    for (const g of payload.data.goals || []) {
      try {
        await this.prisma.goal.upsert({
          where: { id: g.id, userId },
          update: { title: g.title, description: g.description, category: g.category, priority: g.priority, status: g.status, deadline: g.deadline },
          create: { id: g.id, userId, title: g.title, description: g.description, category: g.category, priority: g.priority, status: g.status, deadline: g.deadline },
        });
        counts.goals = (counts.goals || 0) + 1;
      } catch (e: any) { errors.push(`goal ${g.id}: ${e.message}`); }
    }
    for (const t of payload.data.tasks || []) {
      try {
        if (t.goalId && !await this.prisma.goal.findUnique({
          where: { id: t.goalId, userId },
          select: { id: true },
        })) {
          errors.push('Uma tarefa referencia uma meta indisponível para esta conta.');
          continue;
        }
        await this.prisma.task.upsert({
          where: { id: t.id, userId },
          update: { title: t.title, description: t.description, date: t.date, completed: t.completed, status: t.status },
          create: { id: t.id, userId, title: t.title, description: t.description, date: t.date, completed: t.completed, status: t.status, goalId: t.goalId },
        });
        counts.tasks = (counts.tasks || 0) + 1;
      } catch (e: any) { errors.push(`task ${t.id}: ${e.message}`); }
    }
    for (const r of payload.data.routines || []) {
      try {
        await this.prisma.routine.upsert({
          where: { id: r.id, userId },
          update: { title: r.title, frequency: r.frequency, time: r.time, duration: r.duration, active: r.active },
          create: { id: r.id, userId, title: r.title, frequency: r.frequency, time: r.time, duration: r.duration, active: r.active },
        });
        counts.routines = (counts.routines || 0) + 1;
      } catch (e: any) { errors.push(`routine ${r.id}: ${e.message}`); }
    }
    for (const a of payload.data.appointments || []) {
      try {
        await this.prisma.appointment.upsert({
          where: { id: a.id, userId },
          update: { title: a.title, date: a.date, startTime: a.startTime, endTime: a.endTime },
          create: { id: a.id, userId, title: a.title, date: a.date, startTime: a.startTime, endTime: a.endTime },
        });
        counts.appointments = (counts.appointments || 0) + 1;
      } catch (e: any) { errors.push(`appointment ${a.id}: ${e.message}`); }
    }
    for (const p of payload.data.pages || []) {
      try {
        await this.prisma.page.upsert({
          where: { id: p.id, userId },
          update: { title: p.title, icon: p.icon },
          create: { id: p.id, userId, title: p.title, icon: p.icon },
        });
        counts.pages = (counts.pages || 0) + 1;
      } catch (e: any) { errors.push(`page ${p.id}: ${e.message}`); }
    }
    this.logger.log(`Import JSON: ${JSON.stringify(counts)}`);
  }

  private async importCsv(userId: string, buffer: Buffer, counts: Record<string, number>, errors: string[]) {
    const lines = buffer.toString('utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    let currentDb: { title: string; header: string[]; rows: string[][] } | null = null;
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentDb) await this.upsertDatabase(userId, currentDb, counts);
        currentDb = { title: line.substring(3).trim(), header: [], rows: [] };
        continue;
      }
      if (!currentDb) continue;
      const cells = line.split(',');
      if (currentDb.header.length === 0) currentDb.header = cells;
      else currentDb.rows.push(cells);
    }
    if (currentDb) await this.upsertDatabase(userId, currentDb, counts);
    this.logger.log(`Import CSV done`);
  }

  private async upsertDatabase(userId: string, db: { title: string; header: string[]; rows: string[][] }, counts: Record<string, number>) {
    try {
      const existing = await this.prisma.database.findFirst({ where: { userId, title: db.title } });
      let dbId: string;
      if (existing) { await this.prisma.database.update({ where: { id: existing.id }, data: { title: db.title } }); dbId = existing.id; }
      else { const created = await this.prisma.database.create({ data: { userId, title: db.title, isPreset: false } }); dbId = created.id; }
      const propNames = db.header.filter((h) => h !== 'id' && h !== 'order');
      const propIdByName = new Map<string, string>();
      const existingProps = await this.prisma.property.findMany({ where: { databaseId: dbId } });
      for (const name of propNames) {
        const e2 = existingProps.find((p) => p.name === name);
        if (e2) propIdByName.set(name, e2.id);
        else { const c = await this.prisma.property.create({ data: { databaseId: dbId, name, type: 'text', order: propIdByName.size } }); propIdByName.set(name, c.id); }
      }
      counts.databases = (counts.databases || 0) + 1;
      for (const cells of db.rows) {
        const idIdx = db.header.indexOf('id');
        const orderIdx = db.header.indexOf('order');
        const rowId = idIdx >= 0 ? cells[idIdx] : undefined;
        const order = orderIdx >= 0 ? parseInt(cells[orderIdx], 10) || 0 : 0;
        const values: any = {};
        for (let i = 0; i < db.header.length; i++) {
          const h = db.header[i];
          if (h === 'id' || h === 'order') continue;
          const propId = propIdByName.get(h);
          if (propId) values[propId] = cells[i] ?? '';
        }
        if (rowId) {
          await this.prisma.row.upsert({
            where: { id: rowId, databaseId: dbId }, update: { values: JSON.stringify(values), order },
            create: { id: rowId, databaseId: dbId, values: JSON.stringify(values), order },
          });
        } else {
          await this.prisma.row.create({ data: { databaseId: dbId, values: JSON.stringify(values), order } });
        }
        counts.rows = (counts.rows || 0) + 1;
      }
    } catch (e: any) { this.logger.error(`Erro importando database ${db.title}: ${e.message}`); }
  }
}
