/**
 * NexusAuthGuard — Valida JWT do NexusAuth em todas as rotas protegidas.
 *
 * Fluxo:
 *  1. Extrai o JWT do header `Authorization: Bearer <token>`
 *  2. Chama `JwksService.verifyToken()` para validar a assinatura RS256
 *  3. Anexa o payload do JWT em `request.user`
 *  4. Auto-cria o User no Zenith caso ainda não exista (idempotente)
 *
 * Para tornar uma rota pública, usar o decorator `@Public()`.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwksService, NexusJwtPayload } from './jwks.service';
import { UserSyncService } from './user-sync.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class NexusAuthGuard implements CanActivate {
  private readonly logger = new Logger(NexusAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwksService: JwksService,
    private readonly userSyncService: UserSyncService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: NexusJwtPayload }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    let payload: NexusJwtPayload;
    try {
      payload = await this.jwksService.verifyToken(token);
    } catch (err) {
      this.logger.warn(`JWT inválido: ${(err as Error).message}`);
      throw new UnauthorizedException(`Token inválido: ${(err as Error).message}`);
    }

    // Sincroniza o User no Zenith com base no JWT (idempotente)
    const user = await this.userSyncService.syncFromJwt(payload);

    // Anexa o user à request para uso nos controllers
    request.user = payload;
    (request as any).zenithUser = user;

    return true;
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token.trim();
  }
}
