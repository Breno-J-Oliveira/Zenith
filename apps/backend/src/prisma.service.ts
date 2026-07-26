import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * User ID de compatibilidade — usado APENAS em dev quando o NexusAuth
 * não está disponível (ex: testes unitários, scripts offline, demo mode).
 *
 * Em produção, o user ID real vem sempre do JWT do NexusAuth, via
 * `getUserIdFromRequest(request)` em `src/auth/current-user.util.ts`.
 *
 * Manter esta constante evita ter que refatorar 10+ services que
 * atualmente usam MOCK_USER_ID. Eles continuam a funcionar, mas quando
 * o request tem um JWT válido, o NexusAuthGuard substitui o valor.
 */
export const MOCK_USER_ID = 'user-dev-1';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    // Cria o user mock de compatibilidade caso ainda não exista
    // (apenas dev — em produção com NexusAuth este user é criado
    // automaticamente pelo UserSyncService quando o user fizer login)
    const existing = await this.user.findUnique({ where: { id: MOCK_USER_ID } });
    if (!existing) {
      await this.user.create({
        data: {
          id: MOCK_USER_ID,
          email: 'dev@zenith.app',
          name: 'Dev User',
          theme: 'red',
        },
      });
      this.logger.log(`User mock ${MOCK_USER_ID} criado (modo dev/compatibilidade)`);
    } else {
      this.logger.log(`PrismaService conectado — user mock ${MOCK_USER_ID} já existe`);
    }
  }
}
