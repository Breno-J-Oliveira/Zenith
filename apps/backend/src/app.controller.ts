import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { ZenithAuthClient } from './auth/auth.controller';
import { Public } from './auth/auth.guard';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly nexus: ZenithAuthClient,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'zenith-backend',
    };
  }

  @Public()
  @Get('ready')
  async getReadiness() {
    const [database, auth] = await Promise.allSettled([
      this.prisma.user.findFirst({ select: { id: true } }),
      this.nexus.client.health(),
    ]);
    const checks = {
      database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
      auth: auth.status === 'fulfilled' ? 'ok' : 'unavailable',
    };

    if (checks.database !== 'ok' || checks.auth !== 'ok') {
      throw new ServiceUnavailableException({ status: 'unavailable', checks });
    }

    return { status: 'ok', checks };
  }
}
