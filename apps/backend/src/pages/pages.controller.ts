import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PagesService, CreatePageDTO, UpdatePageDTO, CreateBlockDTO, UpdateBlockDTO, ReorderBlocksDTO } from './pages.service';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // ─── Pages CRUD ──────────────────────────────────────────────

  @Post()
  async createPage(@CurrentUser() user: ZenithUser, @Body() dto: CreatePageDTO) {
    return this.pagesService.createPage(user.id, dto);
  }

  @Get()
  async getPages(@CurrentUser() user: ZenithUser) {
    return this.pagesService.getPages(user.id);
  }

  @Get(':id')
  async getPage(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.pagesService.getPage(user.id, id);
  }

  // ─── Blocks (rotas com prefixo "blocks/" para evitar conflitos) ─

  @Patch('blocks/reorder')
  async reorderBlocks(@CurrentUser() user: ZenithUser, @Body() dto: ReorderBlocksDTO) {
    return this.pagesService.reorderBlocks(user.id, dto);
  }

  @Patch('blocks/:blockId')
  async updateBlock(
    @CurrentUser() user: ZenithUser,
    @Param('blockId') blockId: string,
    @Body() dto: UpdateBlockDTO,
  ) {
    return this.pagesService.updateBlock(user.id, blockId, dto);
  }

  @Delete('blocks/:blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlock(@CurrentUser() user: ZenithUser, @Param('blockId') blockId: string) {
    await this.pagesService.deleteBlock(user.id, blockId);
  }

  @Patch(':id')
  async updatePage(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePageDTO,
  ) {
    return this.pagesService.updatePage(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePage(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    await this.pagesService.deletePage(user.id, id);
  }

  @Post(':id/blocks')
  async createBlock(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() dto: CreateBlockDTO,
  ) {
    return this.pagesService.createBlock(user.id, id, dto);
  }
}
