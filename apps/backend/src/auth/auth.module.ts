/**
 * AuthModule — Módulo global de autenticação do Zenith.
 *
 * Exporta:
 *  - NexusAuthGuard (para uso em controllers com @UseGuards)
 *  - Public (decorator)
 *  - CurrentUser (decorator)
 *  - JwksService
 *  - UserSyncService
 *  - ZenithAuthClient (wrapper do SDK)
 *  - AuthController (rotas /auth/*)
 *
 * Registado como módulo global (Global) para que o guard e os
 * decorators fiquem disponíveis em todos os controllers sem imports
 * explícitos.
 */

import { Global, Module } from '@nestjs/common';
import { JwksService } from './jwks.service';
import { UserSyncService } from './user-sync.service';
import { AuthController, ZenithAuthClient } from './auth.controller';
import { NexusAuthGuard } from './auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    JwksService,
    UserSyncService,
    NexusAuthGuard,
    ZenithAuthClient,
  ],
  exports: [
    JwksService,
    UserSyncService,
    NexusAuthGuard,
    ZenithAuthClient,
  ],
})
export class AuthModule {}
