import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Mock user ID (será substituído por auth real na Fase 13)
const MOCK_USER_ID = 'mock-user-id';

@Injectable()
export class DatabasesService {
  constructor(private prisma: PrismaService) {}

  // ─── DATABASE ──────────────────────────────────────────────

  async findAll(pageId?: string) {
    const where: any = { userId: MOCK_USER_ID };
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

  async findOne(id: string) {
    const database = await this.prisma.database.findFirst({
      where: { id, userId: MOCK_USER_ID },
      include: {
        properties: { orderBy: { order: 'asc' } },
        rows: { orderBy: { order: 'asc' } },
        views: true,
      },
    });

    if (!database) throw new NotFoundException('Database não encontrado');
    return database;
  }

  async create(data: {
    title: string;
    icon?: string;
    pageId?: string;
    isPreset?: boolean;
    presetType?: string;
  }) {
    return this.prisma.database.create({
      data: {
        ...data,
        userId: MOCK_USER_ID,
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

  async update(id: string, data: { title?: string; icon?: string }) {
    await this.findOne(id); // Verifica se existe
    return this.prisma.database.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.database.delete({ where: { id } });
  }

  // ─── PROPERTY ──────────────────────────────────────────────

  async addProperty(databaseId: string, data: {
    name: string;
    type: string;
    options?: string;
  }) {
    await this.findOne(databaseId);

    // Pega o próximo order
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

  async updateProperty(propertyId: string, data: {
    name?: string;
    type?: string;
    options?: string;
    order?: number;
  }) {
    return this.prisma.property.update({
      where: { id: propertyId },
      data,
    });
  }

  async removeProperty(propertyId: string) {
    return this.prisma.property.delete({ where: { id: propertyId } });
  }

  // ─── ROW ───────────────────────────────────────────────────

  async addRow(databaseId: string, data: {
    values: string;
    coverImage?: string;
  }) {
    await this.findOne(databaseId);

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

  async updateRow(rowId: string, data: {
    values?: string;
    coverImage?: string;
    order?: number;
  }) {
    return this.prisma.row.update({
      where: { id: rowId },
      data,
    });
  }

  async removeRow(rowId: string) {
    return this.prisma.row.delete({ where: { id: rowId } });
  }

  // ─── VIEW ──────────────────────────────────────────────────

  async addView(databaseId: string, data: {
    name: string;
    type: string;
    config: string;
  }) {
    await this.findOne(databaseId);

    return this.prisma.view.create({
      data: {
        ...data,
        databaseId,
      },
    });
  }

  async updateView(viewId: string, data: {
    name?: string;
    type?: string;
    config?: string;
  }) {
    return this.prisma.view.update({
      where: { id: viewId },
      data,
    });
  }

  async removeView(viewId: string) {
    return this.prisma.view.delete({ where: { id: viewId } });
  }

  // ─── PRESETS ───────────────────────────────────────────────

  async createFromPreset(presetType: string) {
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
        title: preset.title,
        icon: preset.icon,
        userId: MOCK_USER_ID,
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

    return this.findOne(database.id);
  }
}