/**
 * Valida localmente a assinatura do JWT e consulta a sessão autoritativa
 * no NexusAuth antes de sincronizar o usuário.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { ZenithUser } from './current-user.decorator';
import { JwksService, NexusJwtPayload } from './jwks.service';
import { UserSyncService } from './user-sync.service';
import { ZenithAuthClient } from './zenith-auth-client';

const validated = Symbol('validated NexusAuth request');
type AuthenticatedRequest = Request & { user?: NexusJwtPayload; zenithUser?: ZenithUser; [validated]?: true };

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class NexusAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwksService: JwksService,
    private readonly userSyncService: UserSyncService,
    private readonly nexus: ZenithAuthClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // O mesmo request pode passar pela guarda global e pela guarda do controller.
    if (request[validated]) return true;
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    let payload: NexusJwtPayload;
    try {
      payload = await this.jwksService.verifyToken(token);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new UnauthorizedException('Token de autenticação inválido');
    }

    await this.nexus.assertActiveSession(token, payload.sub);
    const user = await this.userSyncService.syncFromJwt(payload);
    request.user = payload;
    request.zenithUser = user;
    request[validated] = true;
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
