/**
 * Tipos do JWT validado pelo NexusAuth.
 *
 * Estes tipos são baseados no `JwtUserPayload` que o NexusAuth coloca
 * no `request.user` após o JwtAuthGuard. O backend do Zenith usa-os
 * para tipar `@CurrentUser()` nos controllers.
 */

export interface NexusJwtPayload {
  /** User ID (subject) */
  sub: string;
  /** Email do usuário */
  email: string;
  /** Role do usuário (ADMIN, MANAGER, USER) */
  role: 'ADMIN' | 'MANAGER' | 'USER' | string;
  /** JWT ID — único por token */
  jti: string;
  /** Tipo do token: 'access' | 'impersonation' */
  type: 'access' | 'impersonation' | string;
  /** Tenant ID (multi-tenant do NexusAuth) */
  tenantId?: string;
  /** Permissões granulares */
  permissions?: string[];
  /** ID do admin que iniciou impersonation (se aplicável) */
  impersonatedBy?: string;
  /** ID da sessão atual */
  sessionId?: string;
  /** JWT expiration (epoch seconds) */
  exp: number;
  /** JWT issued at (epoch seconds) */
  iat: number;
  /** Emissor (sempre "nexusauth") */
  iss: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: NexusJwtPayload;
}
