import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DatabasesService {
  constructor(private prisma: PrismaService) {}

  // ─── DATABASE ──────────────────────────────────────────────

  async findAll(userId: string, pageId?: string) {
    const where: any = { userId };
    if (pageId) where.pageId = pageId;
    return this.prisma.database.findMany({
      where,
      include: {
        properties: { orderBy: { order: 'asc' } },
        views: true,
        _count: { select: { rows: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const database = await this.prisma.database.findFirst({
      where: { id, userId },
      include: {
        properties: { orderBy: { order: 'asc' } },
        rows: { orderBy: { order: 'asc' } },
        views: true,
      },
    });
    if (!database) throw new NotFoundException('Database não encontrado');
    return database;
  }

  async create(userId: string, data: {
    title: string;
    icon?: string;
    pageId?: string;
    isPreset?: boolean;
    presetType?: string;
  }) {
    return this.prisma.database.create({
      data: {
        ...data,
        userId,
        // Cria view padrão "Tabela"
        views: {
          create: {
            name: 'Tabela',
            type: 'table',
            config: JSON.stringify({}),
          },
        },
      },
      include: {
        properties: true,
        views: true,
      },
    });
  }

  async update(userId: string, id: string, data: { title?: string; icon?: string }) {
    await this.findOne(userId, id); // ownership
    return this.prisma.database.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.database.delete({ where: { id } });
  }

  // ─── PROPERTY ──────────────────────────────────────────────

  async addProperty(userId: string, databaseId: string, data: {
    name: string;
    type: string;
    options?: string;
  }) {
    await this.findOne(userId, databaseId);

    const lastProperty = await this.prisma.property.findFirst({
      where: { databaseId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.property.create({
      data: {
        ...data,
        databaseId,
        order: (lastProperty?.order ?? -1) + 1,
      },
    });
  }

  async updateProperty(userId: string, propertyId: string, data: {
    name?: string;
    type?: string;
    options?: string;
    order?: number;
  }) {
    await this.assertPropertyOwner(userId, propertyId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data,
    });
  }

  async removeProperty(userId: string, propertyId: string) {
    await this.assertPropertyOwner(userId, propertyId);
    return this.prisma.property.delete({ where: { id: propertyId } });
  }

  // ─── ROW ────────────────────────────────────────────────────

  async addRow(userId: string, databaseId: string, data: { values: string; coverImage?: string }) {
    await this.findOne(userId, databaseId);

    const lastRow = await this.prisma.row.findFirst({
      where: { databaseId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.row.create({
      data: {
        ...data,
        databaseId,
        order: (lastRow?.order ?? -1) + 1,
      },
    });
  }

  async updateRow(userId: string, rowId: string, data: {
    values?: string;
    coverImage?: string;
    order?: number;
  }) {
    await this.assertRowOwner(userId, rowId);
    return this.prisma.row.update({
      where: { id: rowId },
      data,
    });
  }

  async removeRow(userId: string, rowId: string) {
    await this.assertRowOwner(userId, rowId);
    return this.prisma.row.delete({ where: { id: rowId } });
  }

  // ─── VIEW ────────────────────────────────────────────────────

  async addView(userId: string, databaseId: string, data: {
    name: string;
    type: string;
    config: string;
  }) {
    await this.findOne(userId, databaseId);

    return this.prisma.view.create({
      data: {
        ...data,
        databaseId,
      },
    });
  }

  async updateView(userId: string, viewId: string, data: {
    name?: string;
    type?: string;
    config?: string;
  }) {
    await this.assertViewOwner(userId, viewId);
    return this.prisma.view.update({
      where: { id: viewId },
      data,
    });
  }

  async removeView(userId: string, viewId: string) {
    await this.assertViewOwner(userId, viewId);
    return this.prisma.view.delete({ where: { id: viewId } });
  }

  // ─── PRESETS ────────────────────────────────────────────────

  async createFromPreset(userId: string, presetType: string) {
    const presets: Record<string, any> = {
      finance: {
        title: 'Finanças',
        icon: '💰',
        properties: [
          { name: 'Descrição', type: 'text', order: 0 },
          { name: 'Valor', type: 'currency', options: JSON.stringify({ currency: 'BRL' }), order: 1 },
          { name: 'Categoria', type: 'select', options: JSON.stringify({ options: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'] }), order: 2 },
          { name: 'Data', type: 'date', order: 3 },
          { name: 'Tipo', type: 'select', options: JSON.stringify({ options: ['Receita', 'Despesa'] }), order: 4 },
        ],
      },
      shopping: {
        title: 'Lista de Compras',
        icon: '🛒',
        properties: [
          { name: 'Item', type: 'text', order: 0 },
          { name: 'Quantidade', type: 'number', order: 1 },
          { name: 'Preço', type: 'currency', options: JSON.stringify({ currency: 'BRL' }), order: 2 },
          { name: 'Comprado', type: 'checkbox', order: 3 },
          { name: 'Categoria', type: 'select', options: JSON.stringify({ options: ['Frutas', 'Verduras', 'Carnes', 'Laticínios', 'Padaria', 'Bebidas', 'Limpeza', 'Outros'] }), order: 4 },
        ],
      },
      study: {
        title: 'Estudos',
        icon: '📚',
        properties: [
          { name: 'Matéria', type: 'text', order: 0 },
          { name: 'Tópico', type: 'text', order: 1 },
          { name: 'Status', type: 'select', options: JSON.stringify({ options: ['Não iniciado', 'Em andamento', 'Concluído'] }), order: 2 },
          { name: 'Prioridade', type: 'select', options: JSON.stringify({ options: ['Alta', 'Média', 'Baixa'] }), order: 3 },
          { name: 'Data da Prova', type: 'date', order: 4 },
        ],
      },
      habits: {
        title: 'Hábitos',
        icon: '✅',
        properties: [
          { name: 'Hábito', type: 'text', order: 0 },
          { name: 'Frequência', type: 'select', options: JSON.stringify({ options: ['Diário', 'Semanal', 'Mensal'] }), order: 1 },
          { name: 'Streak', type: 'number', order: 2 },
          { name: 'Última execução', type: 'date', order: 3 },
          { name: 'Concluído', type: 'checkbox', order: 4 },
        ],
      },
    };

    const preset = presets[presetType];
    if (!preset) throw new NotFoundException('Preset não encontrado');

    // Cria o database com propriedades
    const database = await this.prisma.database.create({
      data: {
        userId,
        title: preset.title,
        icon: preset.icon,
        isPreset: true,
        presetType,
        views: {
          create: {
            name: 'Tabela',
            type: 'table',
            config: JSON.stringify({}),
          },
        },
      },
    });

    // Cria as propriedades
    for (const prop of preset.properties) {
      await this.prisma.property.create({
        data: {
          databaseId: database.id,
          ...prop,
        },
      });
    }

    return this.findOne(userId, database.id);
  }

  // ─── Helpers de ownership ──────────────────────────────────

  private async assertPropertyOwner(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { database: true },
    });
    if (!property) throw new NotFoundException(`Property ${propertyId} não encontrada`);
    if (property.database.userId !== userId) {
      throw new NotFoundException(`Property ${propertyId} não encontrada`);
    }
  }

  private async assertRowOwner(userId: string, rowId: string) {
    const row = await this.prisma.row.findUnique({
      where: { id: rowId },
      include: { database: true },
    });
    if (!row) throw new NotFoundException(`Row ${rowId} não encontrada`);
    if (row.database.userId !== userId) {
      throw new NotFoundException(`Row ${rowId} não encontrada`);
    }
  }

  private async assertViewOwner(userId: string, viewId: string) {
    const view = await this.prisma.view.findUnique({
      where: { id: viewId },
      include: { database: true },
    });
    if (!view) throw new NotFoundException(`View ${viewId} não encontrada`);
    if (view.database.userId !== userId) {
      throw new NotFoundException(`View ${viewId} não encontrada`);
    }
  }
}
