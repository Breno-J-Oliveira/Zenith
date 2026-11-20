import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { ExportController } from './export.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max para imports grandes
    }),
  ],
  controllers: [ExportController],
  providers: [ExportService, ImportService],
})
export class ExportModule {}
