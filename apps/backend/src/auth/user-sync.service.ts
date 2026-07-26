/**
 * UserSyncService — Sincroniza o user do NexusAuth com o User do Zenith.
 *
 * Cada request autenticado garante que existe um User no Zenith com:
 *  - id = sub (do JWT) — ex: "usr_abc123"
 *  - email = email (do JWT)
 *  - name = email (fallback) ou "Usuário Nexus" (fallback final)
 *  - theme = "red" (default)
 *
 * O ID é estável entre requests porque vem do `sub` do JWT — não muda
 * a cada login, só se a conta NexusAuth for recriada.
 *
 * A primeira chamada cria; as seguintes são no-op (upsert).
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NexusJwtPayload } from './jwks.service';

@Injectable()
export class UserSyncService implements OnModuleInit {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Se o modo dev (skip validation) está ligado e ainda existe o MOCK_USER_ID,
    // mantemos-no como fallback para endpoints que ainda não usam AuthGuard.
    // Os endpoints novos vão usar o user real do JWT.
    this.logger.log('UserSyncService pronto — usuários do NexusAuth serão sincronizados on-demand');
  }

  /**
   * Garante que existe um User no Zenith para o `sub` do JWT.
   * Retorna o user criado/encontrado.
   */
  async syncFromJwt(payload: NexusJwtPayload): Promise<{ id: string; email: string; name: string; theme: string }> {
    const id = payload.sub;
    const email = payload.email;
    const name = deriveName(payload);

    const user = await this.prisma.user.upsert({
      where: { id },
      create: {
        id,
        email,
        name,
        theme: 'red',
      },
      update: {
        // Atualiza o email se mudou (ex: user trocou de email no NexusAuth)
        email,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      theme: user.theme,
    };
  }
}

function deriveName(payload: NexusJwtPayload): string {
  // NexusAuth guarda o nome no email local-part como fallback
  const local = payload.email.split('@')[0];
  return local || 'Usuário';
}
