import {
  Controller, Get, Post, Body, Res, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';
import { ExportService } from './export.service';
import { ImportService } from './import.service';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService,
  ) {}

  /**
   * GET /export/json — retorna o JSON completo do usuário.
   * Pode ser baixado pelo browser.
   */
  @Get('json')
  async exportJson(
    @CurrentUser() user: ZenithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.exportService.exportAllAsJson(user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zenith-export-${new Date().toISOString().split('T')[0]}.json"`,
    );
    return data;
  }

  /**
   * GET /export/csv — retorna o CSV tabular dos databases.
   */
  @Get('csv')
  async exportCsv(
    @CurrentUser() user: ZenithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.exportService.exportAllAsCsv(user.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zenith-export-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return csv;
  }

  /**
   * POST /export/import — recebe arquivo JSON ou CSV (multipart/form-data, campo "file")
   * e importa os dados no banco.
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importFile(
    @CurrentUser() user: ZenithUser,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado (campo "file" obrigatório)');
    const result = await this.importService.importFile(
      user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return result;
  }
}
