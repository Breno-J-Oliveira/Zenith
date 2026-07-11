import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DatabasesService } from './databases.service';

@Controller('databases')
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  // ─── DATABASE ──────────────────────────────────────────────

  @Get()
  findAll(@Query('pageId') pageId?: string) {
    return this.databasesService.findAll(pageId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.databasesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      title: string;
      icon?: string;
      pageId?: string;
      isPreset?: boolean;
      presetType?: string;
    },
  ) {
    return this.databasesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; icon?: string }) {
    return this.databasesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.databasesService.remove(id);
  }

  // ─── PROPERTY ──────────────────────────────────────────────

  @Post(':id/properties')
  addProperty(
    @Param('id') id: string,
    @Body() body: { name: string; type: string; options?: string },
  ) {
    return this.databasesService.addProperty(id, body);
  }

  @Patch('properties/:propertyId')
  updateProperty(
    @Param('propertyId') propertyId: string,
    @Body() body: { name?: string; type?: string; options?: string; order?: number },
  ) {
    return this.databasesService.updateProperty(propertyId, body);
  }

  @Delete('properties/:propertyId')
  removeProperty(@Param('propertyId') propertyId: string) {
    return this.databasesService.removeProperty(propertyId);
  }

  // ─── ROW ───────────────────────────────────────────────────

  @Post(':id/rows')
  addRow(
    @Param('id') id: string,
    @Body() body: { values: string; coverImage?: string },
  ) {
    return this.databasesService.addRow(id, body);
  }

  @Patch('rows/:rowId')
  updateRow(
    @Param('rowId') rowId: string,
    @Body() body: { values?: string; coverImage?: string; order?: number },
  ) {
    return this.databasesService.updateRow(rowId, body);
  }

  @Delete('rows/:rowId')
  removeRow(@Param('rowId') rowId: string) {
    return this.databasesService.removeRow(rowId);
  }

  // ─── VIEW ──────────────────────────────────────────────────

  @Post(':id/views')
  addView(
    @Param('id') id: string,
    @Body() body: { name: string; type: string; config: string },
  ) {
    return this.databasesService.addView(id, body);
  }

  @Patch('views/:viewId')
  updateView(
    @Param('viewId') viewId: string,
    @Body() body: { name?: string; type?: string; config?: string },
  ) {
    return this.databasesService.updateView(viewId, body);
  }

  @Delete('views/:viewId')
  removeView(@Param('viewId') viewId: string) {
    return this.databasesService.removeView(viewId);
  }

  // ─── PRESETS (rota deve vir antes de :id para evitar conflito) ──

  @Post('create-from-preset/:presetType')
  createFromPreset(@Param('presetType') presetType: string) {
    return this.databasesService.createFromPreset(presetType);
  }
}
