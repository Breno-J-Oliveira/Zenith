import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NexusAuthClient, NexusAuthError, type NexusUser } from '../../../../packages/shared/src/auth';

@Injectable()
export class ZenithAuthClient {
  readonly client: NexusAuthClient;
  private readonly pendingProfiles = new Map<string, Promise<NexusUser>>();

  constructor(config: ConfigService) {
    const baseUrl = (config.get<string>('NEXUS_AUTH_URL') || 'http://localhost:3000').replace(/\/$/, '');
    this.client = new NexusAuthClient({ baseUrl });
  }

  async assertActiveSession(token: string, userId: string): Promise<void> {
    let pending = this.pendingProfiles.get(token);
    if (!pending) {
      // Compartilha somente consultas em andamento. Cada nova chamada precisa
      // observar revogações feitas no NexusAuth desde a consulta anterior.
      pending = this.client.me(token).finally(() => this.pendingProfiles.delete(token));
      this.pendingProfiles.set(token, pending);
    }

    let user: NexusUser;
    try {
      user = await pending;
    } catch (error) {
      if (error instanceof NexusAuthError && (
        error.status === 401 || error.status === 403 ||
        (error.status === 404 && error.code === 'USER_NOT_FOUND')
      )) {
        throw new UnauthorizedException('Sessão inválida ou revogada');
      }
      throw new ServiceUnavailableException('Serviço de autenticação indisponível');
    }

    if (typeof user?.id !== 'string') {
      throw new ServiceUnavailableException('Serviço de autenticação indisponível');
    }
    if (user.id !== userId) {
      throw new UnauthorizedException('Identidade da sessão inválida');
    }
  }
}
