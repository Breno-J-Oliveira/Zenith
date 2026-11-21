import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export interface CreatePageDTO {
  title?: string;
  parentId?: string | null;
  icon?: string;
}

export interface UpdatePageDTO {
  title?: string;
  parentId?: string | null;
  icon?: string;
}

export interface CreateBlockDTO {
  type: string;
  content?: any;
  order?: number;
}

export interface UpdateBlockDTO {
  type?: string;
  content?: any;
  order?: number;
}

export interface ReorderBlocksDTO {
  blocks: Array<{ id: string; order: number }>;
}

const treeRelations = (userId: string) => ({
  parent: { select: { userId: true } },
  children: { where: { userId }, select: { id: true } },
});

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Pages ─────────────────────────────────────────────────────

  async createPage(userId: string, dto: CreatePageDTO) {
    const parentId = this.parseParent(dto.parentId);
    const create = (db: Prisma.TransactionClient) => db.page.create({
      data: {
        userId,
        title: dto.title || 'Sem título',
        parentId,
        icon: dto.icon || null,
      },
      include: { ...treeRelations(userId), blocks: { orderBy: { order: 'asc' } } },
    });
    const page = parentId ? await this.writeTree(async tx => {
      await this.checkParent(tx, userId, parentId);
      return create(tx);
    }) : await create(this.prisma);
    return this.formatPage(page);
  }

  async getPages(userId: string) {
    const pages = await this.prisma.page.findMany({
      where: { userId },
      include: treeRelations(userId),
      orderBy: { createdAt: 'desc' },
    });
    return pages.map(p => this.formatPage(p));
  }

  async getPage(userId: string, id: string) {
    const page = await this.prisma.page.findFirst({
      where: { id, userId },
      include: {
        ...treeRelations(userId),
        blocks: { orderBy: { order: 'asc' } },
      },
    });
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    return this.formatPage(page);
  }

  async updatePage(userId: string, id: string, dto: UpdatePageDTO) {
    const parentId = this.parseParent(dto.parentId);
    const update = (db: Prisma.TransactionClient) => db.page.update({
      where: { id, userId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.parentId !== undefined && { parentId }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
      include: { ...treeRelations(userId), blocks: { orderBy: { order: 'asc' } } },
    });
    try {
      const page = parentId ? await this.writeTree(async tx => {
        const owned = await tx.page.findFirst({ where: { id, userId }, select: { id: true } });
        if (!owned) throw new NotFoundException('Página não encontrada.');
        await this.checkParent(tx, userId, parentId, id);
        return update(tx);
      }) : await update(this.prisma);
      return this.formatPage(page);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Página não encontrada.');
      }
      throw error;
    }
  }

  async deletePage(userId: string, id: string) {
    await this.getPage(userId, id); // ownership
    await this.prisma.page.delete({ where: { id } });
  }

  // ─── Blocks ────────────────────────────────────────────────────

  async createBlock(userId: string, pageId: string, dto: CreateBlockDTO) {
    await this.getPage(userId, pageId); // ownership
    const order = dto.order ?? await this.getNextOrder(userId, pageId);
    const block = await this.prisma.block.create({
      data: {
        pageId,
        type: dto.type,
        content: JSON.stringify(dto.content || {}),
        order,
      },
    });
    return this.formatBlock(block);
  }

  async updateBlock(userId: string, id: string, dto: UpdateBlockDTO) {
    // Valida ownership via pageId
    const block = await this.prisma.block.findUnique({ where: { id }, include: { page: true } });
    if (!block) throw new NotFoundException(`Block ${id} not found`);
    if (block.page.userId !== userId) throw new NotFoundException(`Block ${id} not found`);

    const updated = await this.prisma.block.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: JSON.stringify(dto.content) }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
    return this.formatBlock(updated);
  }

  async deleteBlock(userId: string, id: string) {
    const block = await this.prisma.block.findUnique({ where: { id }, include: { page: true } });
    if (!block) throw new NotFoundException(`Block ${id} not found`);
    if (block.page.userId !== userId) throw new NotFoundException(`Block ${id} not found`);
    await this.prisma.block.delete({ where: { id } });
  }

  async reorderBlocks(userId: string, dto: ReorderBlocksDTO) {
    // Valida ownership de todos os blocos
    const ids = dto.blocks.map(b => b.id);
    const blocks = await this.prisma.block.findMany({
      where: { id: { in: ids } },
      include: { page: true },
    });

    for (const block of blocks) {
      if (block.page.userId !== userId) {
        throw new NotFoundException(`Block ${block.id} not found`);
      }
    }

    const updates = dto.blocks.map(b =>
      this.prisma.block.update({
        where: { id: b.id },
        data: { order: b.order },
      })
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private parseParent(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('Informe uma página pai válida.');
    }
    return value;
  }

  private async checkParent(db: Prisma.TransactionClient, userId: string, parentId: string, pageId?: string) {
    const visited = new Set<string>();
    let ancestor: string | null = parentId;
    while (ancestor !== null) {
      if (ancestor === pageId || visited.has(ancestor)) {
        throw new BadRequestException('O vínculo criaria ou manteria um ciclo na hierarquia de Páginas.');
      }
      visited.add(ancestor);
      const page = await db.page.findFirst({
        where: { id: ancestor, userId },
        select: { parentId: true },
      });
      if (!page) throw new NotFoundException('Página pai não encontrada.');
      ancestor = page.parentId;
    }
  }

  private async writeTree<T>(write: (db: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(write, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P1008')) {
        throw new ConflictException('A hierarquia está sendo editada. Atualize a lista e tente novamente.');
      }
      throw error;
    }
  }

  private async getNextOrder(userId: string, pageId: string): Promise<number> {
    const last = await this.prisma.block.findFirst({
      where: { pageId },
      orderBy: { order: 'desc' },
    });
    return last ? last.order + 1 : 0;
  }

  private formatPage(p: any) {
    return {
      id: p.id,
      title: p.title,
      parentId: p.parent?.userId === p.userId ? p.parentId : null,
      icon: p.icon || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      children: (p.children || []).map((c: any) => c.id),
      blocks: (p.blocks || []).map((b: any) => this.formatBlock(b)),
    };
  }

  private formatBlock(b: any) {
    return {
      id: b.id,
      pageId: b.pageId,
      type: b.type,
      content: JSON.parse(b.content || '{}'),
      order: b.order,
      createdAt: b.createdAt.toISOString(),
    };
  }
}
