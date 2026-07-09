import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PagesService, CreatePageDTO, UpdatePageDTO, CreateBlockDTO, UpdateBlockDTO, ReorderBlocksDTO } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // ─── Pages CRUD ───
  @Post()
  async createPage(@Body() dto: CreatePageDTO) {
    return this.pagesService.createPage(dto);
  }

  @Get()
  async getPages() {
    return this.pagesService.getPages();
  }

  @Get(':id')
  async getPage(@Param('id') id: string) {
    return this.pagesService.getPage(id);
  }

  // ─── Blocks CRUD (before :id to avoid route conflicts) ───
  @Patch('blocks/reorder')
  async reorderBlocks(@Body() dto: ReorderBlocksDTO) {
    return this.pagesService.reorderBlocks(dto);
  }

  @Patch('blocks/:blockId')
  async updateBlock(@Param('blockId') blockId: string, @Body() dto: UpdateBlockDTO) {
    return this.pagesService.updateBlock(blockId, dto);
  }

  @Delete('blocks/:blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlock(@Param('blockId') blockId: string) {
    await this.pagesService.deleteBlock(blockId);
  }

  @Patch(':id')
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageDTO) {
    return this.pagesService.updatePage(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePage(@Param('id') id: string) {
    await this.pagesService.deletePage(id);
  }

  @Post(':id/blocks')
  async createBlock(@Param('id') id: string, @Body() dto: CreateBlockDTO) {
    return this.pagesService.createBlock(id, dto);
  }
}
