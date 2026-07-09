import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const MOCK_USER_ID = 'user-dev-1';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Auto-create mock user if not exists
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
    }
  }
}
