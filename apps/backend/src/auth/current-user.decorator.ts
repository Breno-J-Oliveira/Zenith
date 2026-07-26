/**
 * @CurrentUser() — Extrai o user Zenith (sincronizado) do request.
 *
 * @example
 *   @Get('profile')
 *   @UseGuards(NexusAuthGuard)
 *   getProfile(@CurrentUser() user: ZenithUser) {
 *     return user; // { id, email, name, theme }
 *   }
 *
 *   // Ou o payload completo do JWT:
 *   getProfile(@CurrentUser('jwt') payload: NexusJwtPayload) {
 *     return payload;
 *   }
 */

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { NexusJwtPayload } from './jwks.service';

export interface ZenithUser {
  id: string;
  email: string;
  name: string;
  theme: string;
}

export const CurrentUser = createParamDecorator(
  (data: 'jwt' | 'zenith' | undefined, ctx: ExecutionContext): ZenithUser | NexusJwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (data === 'jwt') {
      return (request as any).user as NexusJwtPayload;
    }

    // Default: retornar o user Zenith (sincronizado a partir do JWT)
    return (request as any).zenithUser as ZenithUser;
  },
);
