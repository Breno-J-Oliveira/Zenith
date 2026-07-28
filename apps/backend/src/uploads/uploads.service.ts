import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * UploadsService — armazena arquivos enviados pelos usuários.
 *
 * Implementação simples baseada em filesystem (sem dependência de S3/Cloudinary
 * por enquanto). Os arquivos são salvos em `apps/backend/uploads/` com nome
 * aleatório + extensão original. A URL pública segue o padrão
 * `GET /uploads/:filename` servida pelo UploadsController.
 *
 * Validações:
 *  - Tipos permitidos: imagens (image/*) e PDFs (application/pdf)
 *  - Tamanho máximo: 10 MB (configurável)
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = join(process.cwd(), 'apps', 'backend', 'uploads');
  private readonly maxSizeBytes = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = /^image\/(jpeg|png|gif|webp|svg\+xml)$|^application\/pdf$/;

  /**
   * Garante que o diretório de uploads existe.
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Salva um arquivo (Buffer) no filesystem e retorna a URL pública.
   */
  async saveFile(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    if (buffer.length > this.maxSizeBytes) {
      throw new BadRequestException(
        `Arquivo muito grande: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Máximo: 10MB.`,
      );
    }
    if (!this.allowedTypes.test(mimeType)) {
      throw new BadRequestException(`Tipo não permitido: ${mimeType}. Permitidos: imagens e PDF.`);
    }

    await this.ensureDir();

    // Gera nome único: timestamp + random + extensão
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
    const hash = randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${hash}.${ext}`;
    const fullPath = join(this.uploadDir, filename);

    await fs.writeFile(fullPath, buffer);
    this.logger.log(`Upload salvo: ${filename} (${(buffer.length / 1024).toFixed(1)}KB) por user ${userId}`);

    return {
      url: `/uploads/${filename}`,
      filename,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Lê um arquivo do filesystem (para servir via endpoint estático).
   */
  async readFile(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    // Sanitização: não aceitar paths com ../
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestException('Filename inválido');
    }
    const fullPath = join(this.uploadDir, filename);
    const buffer = await fs.readFile(fullPath);
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType =
      ext === 'png' ? 'image/png' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'gif' ? 'image/gif' :
      ext === 'webp' ? 'image/webp' :
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'pdf' ? 'application/pdf' :
      'application/octet-stream';
    return { buffer, mimeType };
  }
}
