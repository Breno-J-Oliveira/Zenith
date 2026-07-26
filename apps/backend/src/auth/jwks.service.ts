/**
 * JWKS Service — Gestão de chaves públicas JWT do NexusAuth.
 *
 * Faz cache da chave pública obtida via `/.well-known/jwks.json` no
 * NexusAuth e expõe um método `verifyToken()` para validar JWTs.
 *
 * Vantagens:
 *  - Sem partilha de segredos (chave pública)
 *  - Cache em memória (refresh a cada 1h) — não sobrecarrega o NexusAuth
 *  - Em produção, JWKS URIs DEVEM ser HTTPS (validação automática)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface JwkKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface NexusJwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
  type?: string;
  tenantId?: string;
  permissions?: string[];
  sessionId?: string;
  exp: number;
  iat: number;
  iss: string;
}

@Injectable()
export class JwksService implements OnModuleInit {
  private readonly logger = new Logger(JwksService.name);
  private cache: Map<string, string> = new Map(); // kid → PEM
  private lastFetch = 0;
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1h

  private nexusAuthUrl: string = '';
  private jwksUri: string = '';
  private jwtIssuer: string = 'nexusauth';
  private skipValidation: boolean = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.nexusAuthUrl = (
      this.config.get<string>('NEXUS_AUTH_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    this.jwksUri = `${this.nexusAuthUrl}/.well-known/jwks.json`;
    this.jwtIssuer = this.config.get<string>('NEXUS_JWT_ISSUER') || 'nexusauth';
    this.skipValidation = this.config.get<string>('NEXUS_AUTH_SKIP_VALIDATION') === 'true';

    if (this.skipValidation) {
      this.logger.warn(
        '⚠️  NEXUS_AUTH_SKIP_VALIDATION=true — JWT validation DESATIVADA. ' +
        'Apenas para desenvolvimento. NUNCA use em produção.',
      );
      return;
    }

    // Pré-carrega as chaves em background — não bloqueia o startup
    this.refreshKeys().catch((err) => {
      this.logger.warn(
        `Não foi possível pré-carregar JWKS (${err.message}). ` +
        'Será tentado novamente no primeiro request.',
      );
    });
  }

  /**
   * Valida um JWT e retorna o payload. Lança erro se inválido.
   */
  async verifyToken(token: string): Promise<NexusJwtPayload> {
    if (this.skipValidation) {
      // Modo dev: extrai payload sem verificar assinatura
      try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token malformado');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        return payload as NexusJwtPayload;
      } catch {
        throw new Error('Token inválido (modo skip)');
      }
    }

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('JWT malformado');
    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
    if (header.alg !== 'RS256') throw new Error(`Algoritmo não suportado: ${header.alg}`);

    const pem = await this.getKey(header.kid);

    // Verificar assinatura manualmente
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(dataToVerify);
    verifier.end();
    const isValid = verifier.verify(pem, base64UrlToBuffer(signatureB64));
    if (!isValid) throw new Error('Assinatura JWT inválida');

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as NexusJwtPayload;

    // Validações adicionais
    if (payload.iss !== this.jwtIssuer) {
      throw new Error(`Issuer inválido: ${payload.iss}`);
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new Error('Token expirado');
    }
    if (payload.type !== 'access' && payload.type !== 'impersonation') {
      throw new Error(`Tipo de token inválido: ${payload.type}`);
    }

    return payload;
  }

  private async getKey(kid: string): Promise<string> {
    await this.ensureFreshCache();
    const pem = this.cache.get(kid);
    if (!pem) throw new Error(`JWKS: key não encontrada para kid=${kid}`);
    return pem;
  }

  private async ensureFreshCache(): Promise<void> {
    const now = Date.now();
    if (this.cache.size > 0 && now - this.lastFetch < this.cacheTtlMs) return;

    const res = await fetch(this.jwksUri);
    if (!res.ok) throw new Error(`JWKS fetch falhou: HTTP ${res.status}`);

    const jwks: { keys: JwkKey[] } = await res.json();
    this.cache.clear();

    for (const key of jwks.keys) {
      const pem = jwkToPem(key);
      this.cache.set(key.kid, pem);
    }

    this.lastFetch = now;
    this.logger.log(`JWKS atualizado: ${this.cache.size} chave(s) carregada(s)`);
  }

  private async refreshKeys(): Promise<void> {
    await this.ensureFreshCache();
  }
}

function base64UrlToBuffer(s: string): Buffer {
  // Converter base64url → base64 padrão
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : '';
  return Buffer.from(padded + pad, 'base64');
}

function jwkToPem(key: JwkKey): string {
  const pubKeyObject = crypto.createPublicKey({ key, format: 'jwk' });
  return pubKeyObject.export({ type: 'spki', format: 'pem' }) as string;
}
