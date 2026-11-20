import {
  Controller, Post, Get, Param, UseInterceptors, UploadedFile,
  BadRequestException, Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /uploads — recebe um arquivo via multipart/form-data (campo "file").
   * Retorna { url, filename, size, mimeType } com a URL autenticada para usar
   * em campos como coverImage de Page ou Row.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @CurrentUser() user: ZenithUser,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado (campo "file" obrigatório)');
    const result = await this.uploadsService.saveFile(
      user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return result;
  }

  /**
   * GET /uploads/:filename — serve o arquivo para o frontend.
   */
  @Get(':filename')
  async serve(
    @CurrentUser() user: ZenithUser,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, mimeType } = await this.uploadsService.readFile(user.id, filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Security-Policy', 'sandbox');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(buffer);
  }
}
