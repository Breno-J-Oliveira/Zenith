import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash, randomBytes } from 'crypto';

/**
 * UploadsService — armazena arquivos enviados pelos usuários.
 *
 * Implementação simples baseada em filesystem (sem dependência de S3/Cloudinary
 * por enquanto). Os arquivos são salvos em `apps/backend/uploads/` com nome
 * aleatório por conta. A URL autenticada segue o padrão
 * `GET /uploads/:filename` servida pelo UploadsController.
 *
 * Validações:
 *  - Tipos permitidos: imagens (image/*) e PDFs (application/pdf)
 *  - Tamanho máximo: 10 MB (configurável)
 */
@Injectable()
export class UploadsService {
  private readonly uploadDir = join(process.cwd(), 'apps', 'backend', 'uploads');
  private readonly maxSizeBytes = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = /^image\/(jpeg|png|gif|webp|svg\+xml)$|^application\/pdf$/;

  private directoryFor(userId: string): string {
    const owner = createHash('sha256').update(userId).digest('hex');
    return join(this.uploadDir, owner);
  }

  /**
   * Salva um arquivo por conta e retorna a URL autenticada.
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

    const directory = this.directoryFor(userId);
    await fs.mkdir(directory, { recursive: true });
    const ext = originalName.match(/\.([a-z0-9]{1,8})$/i)?.[1].toLowerCase() ?? 'bin';
    const hash = randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${hash}.${ext}`;
    const fullPath = join(directory, filename);

    await fs.writeFile(fullPath, buffer);

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
  async readFile(userId: string, filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!/^\d+-[a-f0-9]{16}\.[a-z0-9]{1,8}$/.test(filename)) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    const buffer = await fs.readFile(join(this.directoryFor(userId), filename)).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') throw new NotFoundException('Arquivo não encontrado');
      throw error;
    });
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
