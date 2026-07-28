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
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';

@Controller('databases')
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  // ─── DATABASE ──────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: ZenithUser, @Query('pageId') pageId?: string) {
    return this.databasesService.findAll(user.id, pageId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.databasesService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: ZenithUser,
    @Body()
    body: {
      title: string;
      icon?: string;
      pageId?: string;
      isPreset?: boolean;
      presetType?: string;
    },
  ) {
    return this.databasesService.create(user.id, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: ZenithUser, @Param('id') id: string, @Body() body: { title?: string; icon?: string }) {
    return this.databasesService.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: ZenithUser, @Param('id') id: string) {
    return this.databasesService.remove(user.id, id);
  }

  // ─── PROPERTY ──────────────────────────────────────────────

  @Post(':id/properties')
  addProperty(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() body: { name: string; type: string; options?: string },
  ) {
    return this.databasesService.addProperty(user.id, id, body);
  }

  @Patch('properties/:propertyId')
  updateProperty(
    @CurrentUser() user: ZenithUser,
    @Param('propertyId') propertyId: string,
    @Body() body: { name?: string; type?: string; options?: string; order?: number },
  ) {
    return this.databasesService.updateProperty(user.id, propertyId, body);
  }

  @Delete('properties/:propertyId')
  removeProperty(@CurrentUser() user: ZenithUser, @Param('propertyId') propertyId: string) {
    return this.databasesService.removeProperty(user.id, propertyId);
  }

  // ─── ROW ───────────────────────────────────────────────────

  @Post(':id/rows')
  addRow(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() body: { values: string; coverImage?: string },
  ) {
    return this.databasesService.addRow(user.id, id, body);
  }

  @Patch('rows/:rowId')
  updateRow(
    @CurrentUser() user: ZenithUser,
    @Param('rowId') rowId: string,
    @Body() body: { values?: string; coverImage?: string; order?: number },
  ) {
    return this.databasesService.updateRow(user.id, rowId, body);
  }

  @Delete('rows/:rowId')
  removeRow(@CurrentUser() user: ZenithUser, @Param('rowId') rowId: string) {
    return this.databasesService.removeRow(user.id, rowId);
  }

  // ─── VIEW ──────────────────────────────────────────────────

  @Post(':id/views')
  addView(
    @CurrentUser() user: ZenithUser,
    @Param('id') id: string,
    @Body() body: { name: string; type: string; config: string },
  ) {
    return this.databasesService.addView(user.id, id, body);
  }

  @Patch('views/:viewId')
  updateView(
    @CurrentUser() user: ZenithUser,
    @Param('viewId') viewId: string,
    @Body() body: { name?: string; type?: string; config?: string },
  ) {
    return this.databasesService.updateView(user.id, viewId, body);
  }

  @Delete('views/:viewId')
  removeView(@CurrentUser() user: ZenithUser, @Param('viewId') viewId: string) {
    return this.databasesService.removeView(user.id, viewId);
  }

  // ─── PRESETS (rota deve vir antes de :id para evitar conflito) ──

  @Post('create-from-preset/:presetType')
  createFromPreset(@CurrentUser() user: ZenithUser, @Param('presetType') presetType: string) {
    return this.databasesService.createFromPreset(user.id, presetType);
  }
}
