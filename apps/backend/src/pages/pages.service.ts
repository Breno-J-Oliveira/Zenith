import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, MOCK_USER_ID } from '../prisma.service';

export interface CreatePageDTO {
  title?: string;
  parentId?: string;
  icon?: string;
}

export interface UpdatePageDTO {
  title?: string;
  parentId?: string;
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

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Pages ───
  async createPage(dto: CreatePageDTO) {
    const page = await this.prisma.page.create({
      data: {
        userId: MOCK_USER_ID,
        title: dto.title || 'Sem título',
        parentId: dto.parentId || null,
        icon: dto.icon || null,
      },
      include: { children: true, blocks: { orderBy: { order: 'asc' } } },
    });
    return this.formatPage(page);
  }

  async getPages() {
    const pages = await this.prisma.page.findMany({
      where: { userId: MOCK_USER_ID },
      include: { children: true },
      orderBy: { createdAt: 'desc' },
    });
    return pages.map(p => this.formatPage(p));
  }

  async getPage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        blocks: { orderBy: { order: 'asc' } },
        children: true,
      },
    });
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    return this.formatPage(page);
  }

  async updatePage(id: string, dto: UpdatePageDTO) {
    const page = await this.prisma.page.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId || null }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
      include: { children: true, blocks: { orderBy: { order: 'asc' } } },
    });
    return this.formatPage(page);
  }

  async deletePage(id: string) {
    await this.getPage(id);
    await this.prisma.page.delete({ where: { id } });
  }

  // ─── Blocks ───
  async createBlock(pageId: string, dto: CreateBlockDTO) {
    const order = dto.order ?? await this.getNextOrder(pageId);
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

  async updateBlock(id: string, dto: UpdateBlockDTO) {
    const block = await this.prisma.block.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: JSON.stringify(dto.content) }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
    return this.formatBlock(block);
  }

  async deleteBlock(id: string) {
    await this.prisma.block.delete({ where: { id } });
  }

  async reorderBlocks(dto: ReorderBlocksDTO) {
    const updates = dto.blocks.map(b =>
      this.prisma.block.update({
        where: { id: b.id },
        data: { order: b.order },
      })
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }

  private async getNextOrder(pageId: string): Promise<number> {
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
      parentId: p.parentId || null,
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
