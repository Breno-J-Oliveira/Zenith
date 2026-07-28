/**
 * AuthController do Zenith — Endpoints auxiliares relacionados à auth.
 *
 * O backend do Zenith NÃO implementa registo/login (isso é o NexusAuth).
 * Apenas expõe helpers para o frontend, como:
 *  - GET /auth/me → dados do user atual (a partir do JWT)
 *  - GET /auth/health → verifica se NexusAuth está acessível
 *
 * Todas as rotas (exceto /auth/health) exigem JWT válido.
 */

import {
  Controller,
  Get,
  UseGuards,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NexusAuthClient } from '../../../../packages/shared/src/auth';
import { ConfigService } from '@nestjs/config';
import { NexusAuthGuard, Public } from './auth.guard';
import { CurrentUser, ZenithUser } from './current-user.decorator';
import { NexusJwtPayload } from './jwks.service';

@Injectable()
export class ZenithAuthClient {
  readonly client: NexusAuthClient;

  constructor(config: ConfigService) {
    const baseUrl = (config.get<string>('NEXUS_AUTH_URL') || 'http://localhost:3000').replace(/\/$/, '');
    this.client = new NexusAuthClient({ baseUrl });
  }
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly nexus: ZenithAuthClient) {}

  /**
   * GET /auth/me — dados do user Zenith (sincronizado a partir do JWT).
   */
  @Get('me')
  @UseGuards(NexusAuthGuard)
  me(@CurrentUser() user: ZenithUser): ZenithUser {
    return user;
  }

  /**
   * GET /auth/jwt — payload completo do JWT (debug/admin).
   */
  @Get('jwt')
  @UseGuards(NexusAuthGuard)
  jwtInfo(@CurrentUser('jwt') payload: NexusJwtPayload): NexusJwtPayload {
    return payload;
  }

  /**
   * GET /auth/health — verifica se o NexusAuth está respondendo.
   * Rota pública — não exige JWT.
   */
  @Get('health')
  @Public()
  async health(): Promise<{ status: string; nexus: string; error?: string }> {
    try {
      const data = await this.nexus.client.health();
      return { status: 'ok', nexus: JSON.stringify(data) };
    } catch (err) {
      this.logger.warn(`NexusAuth indisponível: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        `NexusAuth indisponível: ${(err as Error).message}`,
      );
    }
  }
}
