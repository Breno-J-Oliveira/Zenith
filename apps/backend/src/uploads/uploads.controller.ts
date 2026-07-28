import {
  Controller, Post, Get, Param, UseInterceptors, UploadedFile,
  BadRequestException, Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';
import { MOCK_USER_ID } from '../prisma.service';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /uploads — recebe um arquivo via multipart/form-data (campo "file").
   * Retorna { url, filename, size, mimeType } com a URL pública para usar
   * em campos como coverImage de Page ou Row.
   *
   * Por enquanto usa MOCK_USER_ID (consistência com os outros services).
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() _user: ZenithUser,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado (campo "file" obrigatório)');
    const result = await this.uploadsService.saveFile(
      MOCK_USER_ID,
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
  serve(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    return this.uploadsService.readFile(filename).then(({ buffer, mimeType }) => {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return new StreamableFile(createReadStream(join(process.cwd(), 'apps', 'backend', 'uploads', filename)));
    });
  }
}
