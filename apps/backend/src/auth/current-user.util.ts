/**
 * Helper para extrair o user ID do request autenticado.
 *
 * Centraliza a lógica de obter o ID do user a partir do JWT, com
 * fallback para compatibilidade (modo dev com MOCK_USER_ID).
 *
 * Os services que antes importavam `MOCK_USER_ID` directamente devem
 * agora usar `getUserIdFromRequest(request)` ou receber o `id` por
 * parâmetro (vindo do `@CurrentUser()`).
 *
 * Migração futura: usar `@CurrentUser('jwt')` em todos os controllers
 * e passar o `id` para os services.
 */

import type { Request } from 'express';
import type { NexusJwtPayload } from './jwks.service';
import { MOCK_USER_ID } from '../prisma.service';

/**
 * Extrai o user ID do request autenticado.
 * - Se o request tem `zenithUser` (do NexusAuthGuard), usa o id dele
 * - Caso contrário, devolve o MOCK_USER_ID (modo dev/compatibilidade)
 */
export function getUserIdFromRequest(request: Request): string {
  const zenithUser = (request as any).zenithUser as { id: string } | undefined;
  if (zenithUser?.id) return zenithUser.id;

  const jwt = (request as any).user as NexusJwtPayload | undefined;
  if (jwt?.sub) return jwt.sub;

  // Fallback de compatibilidade — só em dev
  return MOCK_USER_ID;
}

/**
 * Helper para uso em services: extrai o userId do request Express.
 *
 * @example
 *   @Get()
 *   list(@Req() req: Request) {
 *     return this.goalsService.findAll(getUserIdFromRequest(req));
 *   }
 */
export function userId(req: Request): string {
  return getUserIdFromRequest(req);
}
