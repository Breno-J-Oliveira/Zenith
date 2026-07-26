# NexusAuth — Documentação Técnica Completa

> **Versão:** 1.0 | **Autor:** Breno José de Oliveira | **Data:** Julho 2025

---

## 📑 Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Modelo de Dados](#3-modelo-de-dados)
4. [Referência de API](#4-referência-de-api)
5. [Fluxos de Autenticação](#5-fluxos-de-autenticação)
6. [Segurança](#6-segurança)
7. [Guia de Produção](#7-guia-de-produção)
8. [Changelog das Fases](#8-changelog-das-fases)

---

## 1. Visão Geral

O **NexusAuth** é um microsserviço de autenticação centralizada construído com NestJS, TypeScript, PostgreSQL e Redis. Projetado como API REST independente, serve como ponto único de identidade (SSO) para múltiplas aplicações.

### Características principais

- **JWT RS256** com JWKS endpoint para validação descentralizada
- **Access Token (15min) + Refresh Token (7 dias)** com rotation
- **2FA (TOTP)** com rate limiting e códigos de backup
- **OAuth2** (Google + GitHub) com verificação de email antes de vincular
- **Magic Link** (passwordless)
- **Multi-tenant** com RBAC granular e permissões
- **Impersonation** auditado (admin age como outro usuário)
- **Webhooks** com SSRF guard e assinatura HMAC
- **API Keys** para serviço-a-serviço
- **Audit Log** completo com metadados (IP, User-Agent, localização)
- **Observabilidade** com Prometheus, health checks e logs estruturados
- **Docker** com multi-stage build e CI/CD no GitHub Actions

### Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS |
| Linguagem | TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL |
| Cache | Redis 7+ |
| JWT | jsonwebtoken (RS256) |
| 2FA | otplib (TOTP) |
| OAuth2 | Passport (Google + GitHub) |
| Validação | Zod |
| Documentação | Swagger/OpenAPI |
| Métricas | prom-client (Prometheus) |
| Testes | Jest + Supertest |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 2. Arquitetura

### Diagrama

```
┌──────────────────────────────────────────────────────────────┐
│                     NexusAuth API (porta 3000)                 │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   Auth   │ │  2FA     │ │ Sessions │ │   Audit Log      │ │
│  │  Module  │ │  Module  │ │  Module  │ │    Module        │ │
│  │ login    │ │ TOTP     │ │ devices  │ │  events, IP,     │ │
│  │ register │ │ QR code  │ │ revoke   │ │  user agent      │ │
│  │ refresh  │ │ challenge│ │ logout   │ │                  │ │
│  │ logout   │ │ backup   │ │ global   │ │                  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │            │            │                │           │
│  ┌────▼────────────▼────────────▼────────────────▼─────────┐ │
│  │   OAuth2    │  Rate Limiter  │  Webhooks   │  Metrics   │ │
│  │  Google     │  (Redis)       │  Dispatcher │  Prometheus│ │
│  │  GitHub     │  Lockout       │  SSRF Guard │            │ │
│  │  Magic Link │  2FA Limit     │  HMAC Sign  │            │ │
│  └─────────────┴────────────────┴─────────────┴────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Tenant Module + Admin Module                 │ │
│  │  RBAC · PermissionGuard · Impersonation · API Keys       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Prisma ORM                             │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                    │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │              PostgreSQL + Redis + SMTP                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  /.well-known/jwks.json  ·  /health  ·  /metrics  ·  /docs│ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Estrutura de pastas

```
src/
  modules/
    auth/           → login, refresh, logout, register, magic-link, change-password
    two-factor/     → 2FA (TOTP), setup, verify, disable, challenge
    sessions/       → sessões ativas, revogar, logout global
    audit/          → audit log, consulta de eventos (admin)
    tenant/         → Multi-tenant, convites, membros
    admin/          → Impersonation (admin only)
    webhooks/       → Dispatch de eventos, SSRF guard, HMAC
    api-keys/       → API keys para serviço-a-serviço
    oauth/          → OAuth2 (Google, GitHub), strategies
    health/         → Health check (live, ready, full)
    metrics/        → Métricas Prometheus
  common/
    guards/         → JWT, RBAC, PermissionGuard, ApiKey, 2FA
    interceptors/   → Logging, metrics
    filters/        → Global exception filter
    decorators/     → @CurrentUser, @Public, @Roles, @RequirePermission
    pipes/          → ZodValidationPipe
    utils/          → ssrf-guard.ts
  config/           → Env vars, JWT keys, Redis, OAuth2, SMTP
  prisma/           → PrismaService, schema.prisma
  redis/            → RedisService
  main.ts           → Bootstrap, CORS, Helmet, Swagger, Graceful shutdown
```

---

## 3. Modelo de Dados

### User

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `email` | String (unique) | Email do usuário |
| `password` | String? | Hash bcrypt (null se OAuth-only) |
| `name` | String | Nome do usuário |
| `emailVerified` | Boolean | Email confirmado |
| `role` | Enum | `ADMIN`, `MANAGER`, `USER` |
| `tenantId` | String? | Tenant associado (null = global) |
| `permissions` | String[] | Permissões granulares |
| `twoFactorEnabled` | Boolean | 2FA ativo |
| `twoFactorSecret` | String? | Secret TOTP (criptografado) |
| `googleId` | String? | ID Google OAuth |
| `githubId` | String? | ID GitHub OAuth |
| `passwordHistory` | String[] | Últimos 5 hashes |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

### Tenant

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | String | Nome da empresa |
| `slug` | String (unique) | URL-friendly identifier |
| `plan` | Enum | `FREE`, `PRO`, `ENTERPRISE` |
| `createdAt` | DateTime | Data de criação |

### Session

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `userId` | UUID | Usuário dono |
| `device` | String | "Chrome on Windows", "Safari on iPhone" |
| `ipAddress` | String | IP do login |
| `location` | String? | Geolocalização por IP |
| `userAgent` | String | User-Agent header |
| `active` | Boolean | Sessão ativa |
| `lastActiveAt` | DateTime | Última atividade |

### RefreshToken

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `token` | String (unique) | Token UUID |
| `userId` | UUID | Usuário dono |
| `sessionId` | UUID | Sessão vinculada |
| `expiresAt` | DateTime | Expiração (7 dias) |
| `revoked` | Boolean | Token revogado (rotation) |

### AuditLog

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `userId` | UUID? | Usuário (null = anônimo) |
| `action` | Enum | Tipo do evento |
| `ipAddress` | String? | IP |
| `userAgent` | String? | User-Agent |
| `location` | String? | Geolocalização |
| `metadata` | Json? | Dados extras |
| `success` | Boolean | Sucesso ou falha |
| `createdAt` | DateTime | Timestamp |

### Outros modelos

- **ApiKey** — chaves serviço-a-serviço com permissões
- **Webhook** — URLs registradas com eventos e secret HMAC
- **PasswordReset** — tokens de reset (15min, single-use)
- **EmailVerification** — tokens de verificação (24h, single-use)
- **MagicLink** — tokens de login passwordless (15min, single-use)
- **WebhookDelivery** — log de tentativas de entrega

---

## 4. Referência de API

### 4.1 Autenticação

#### POST /auth/register

Registra novo usuário e envia email de verificação.

```json
// Request
{
  "email": "user@example.com",
  "password": "Secure@1234",
  "name": "John Doe"
}

// Response 201
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### POST /auth/login

Autentica usuário e retorna tokens. Se 2FA habilitado, retorna challenge token.

```json
// Request
{
  "email": "user@example.com",
  "password": "Secure@1234"
}

// Response 200 (sem 2FA)
{
  "accessToken": "eyJhbG...",
  "refreshToken": "uuid-here",
  "sessionId": "uuid-here"
}

// Response 200 (com 2FA)
{
  "requiresTwoFactor": true,
  "challengeToken": "eyJhbG..."
}
```

#### POST /auth/refresh

Renova access token com rotation (refresh token anterior é revogado).

```json
// Request
{
  "refreshToken": "uuid-here"
}

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "new-uuid-here"
}
```

#### POST /auth/logout

Revoga access token (blacklist Redis) e refresh token.

```json
// Headers
Authorization: Bearer <accessToken>

// Request
{
  "refreshToken": "uuid-here"
}

// Response 200
{
  "message": "Logged out successfully"
}
```

#### POST /auth/forgot-password

Envia email com link de reset (15min expiry).

```json
// Request
{
  "email": "user@example.com"
}

// Response 200
{
  "message": "If the email exists, a reset link has been sent"
}
```

#### POST /auth/reset-password

Reset de senha com token de uso único.

```json
// Request
{
  "token": "uuid-here",
  "newPassword": "NewSecure@1234"
}

// Response 200
{
  "message": "Password reset successfully"
}
```

#### POST /auth/magic-link

Envia magic link por email (passwordless, 15min expiry).

```json
// Request
{
  "email": "user@example.com"
}

// Response 200
{
  "message": "If the email exists, a magic link has been sent"
}
```

#### GET /auth/magic-link/verify?token=...

Valida magic link e retorna tokens.

```json
// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "uuid-here"
}
```

#### POST /auth/change-password

Altera senha (exige senha atual, verifica histórico de 5).

```json
// Headers
Authorization: Bearer <accessToken>

// Request
{
  "currentPassword": "OldSecure@1234",
  "newPassword": "NewSecure@1234"
}

// Response 200
{
  "message": "Password changed successfully"
}
```

#### GET /auth/me

Retorna dados do usuário autenticado.

```json
// Headers
Authorization: Bearer <accessToken>

// Response 200
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

#### GET /auth/verify-email?token=...

Confirma email com token de verificação.

### 4.2 OAuth2

| Método | Rota | Descrição |
|---|---|---|
| GET | `/auth/google` | Inicia OAuth2 com Google |
| GET | `/auth/google/callback` | Callback do Google |
| GET | `/auth/github` | Inicia OAuth2 com GitHub |
| GET | `/auth/github/callback` | Callback do GitHub |

OAuth flow: redirect → provider auth → callback → cria/vincula usuário → retorna tokens.

**Segurança:** Contas OAuth só são vinculadas a usuários existentes se `emailVerified = true` do provedor.

### 4.3 2FA

#### POST /2fa/setup

Inicia configuração 2FA. Retorna secret e QR code.

```json
// Headers
Authorization: Bearer <accessToken>

// Response 200
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/...",
  "backupCodes": ["12345678", "87654321", ...]
}
```

#### POST /2fa/verify

Verifica código TOTP e ativa 2FA.

```json
// Request
{
  "code": "123456"
}

// Response 200
{
  "message": "2FA enabled successfully"
}
```

#### POST /2fa/disable

Desativa 2FA (exige senha).

```json
// Request
{
  "password": "Secure@1234"
}

// Response 200
{
  "message": "2FA disabled successfully"
}
```

#### POST /2fa/challenge

Resolve challenge 2FA no login. **Rate limited: 5 tentativas/60s.**

```json
// Request
{
  "challengeToken": "eyJhbG...",
  "code": "123456"
}

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "uuid-here"
}
```

### 4.4 Sessões

| Método | Rota | Descrição |
|---|---|---|
| GET | `/sessions` | Lista sessões ativas (device, IP, localização) |
| DELETE | `/sessions/:id` | Revoga sessão específica |
| POST | `/sessions/logout-all?keepCurrent=true` | Encerra todas as sessões |

### 4.5 Audit Log

| Método | Rota | Descrição |
|---|---|---|
| GET | `/audit-log` | Histórico de eventos (ADMIN only) |

Query params: `page`, `limit`, `userId`, `action`, `startDate`, `endDate`.

### 4.6 Tenant

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| POST | `/tenant` | Criar novo tenant | Autenticado |
| POST | `/tenant/invite` | Convidar usuário | `tenant:manage` |
| POST | `/tenant/invite/accept` | Aceitar convite | Autenticado |
| GET | `/tenant/members` | Listar membros | `users:read` |

### 4.7 Admin

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/admin/impersonate/:userId` | Iniciar impersonation | ADMIN |
| POST | `/admin/stop-impersonation` | Parar impersonation | Autenticado |

**Proteção:** Impersonation chaining bloqueado (não pode impersonar enquanto já impersona).

### 4.8 Webhooks

| Método | Rota | Descrição |
|---|---|---|
| POST | `/webhooks` | Registrar webhook (retorna secret uma vez) |
| GET | `/webhooks` | Listar webhooks (sem secret) |
| PATCH | `/webhooks/:id` | Atualizar webhook |
| DELETE | `/webhooks/:id` | Remover webhook |
| GET | `/webhooks/:id/deliveries` | Listar tentativas de entrega |

**SSRF Guard:** URLs que resolvem para IPs privados/loopback/link-local são bloqueadas na criação, update e dispatch.

**Headers enviados:**
- `Content-Type: application/json`
- `X-Webhook-Signature: <HMAC-SHA256>`
- `X-Webhook-Event: <event-name>`

### 4.9 API Keys

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api-keys` | Criar API key (retorna chave completa apenas uma vez) |
| GET | `/api-keys` | Listar API keys (prefixo mascarado) |
| DELETE | `/api-keys/:id` | Revogar API key |
| GET | `/api-keys/test` | Testar autenticação via API key |

### 4.10 Infra

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health/live` | Liveness probe (200 sempre) |
| GET | `/health/ready` | Readiness probe (200 se DB+Redis OK) |
| GET | `/health` | Health completo |
| GET | `/metrics` | Métricas Prometheus |
| GET | `/.well-known/jwks.json` | Chave pública JWT |
| GET | `/docs` | Swagger UI (desabilitado em produção) |

---

## 5. Fluxos de Autenticação

### 5.1 Login padrão (sem 2FA)

```
Cliente → POST /auth/login {email, password}
    ↓
NexusAuth:
  1. Rate limit check (5/min/IP)
  2. Lockout check (5 falhas → 15min block)
  3. bcrypt.compare(password, user.password)
  4. Detectar novo dispositivo
  5. Criar Session (device, IP, location, userAgent)
  6. Criar RefreshToken (UUID, 7 dias)
  7. Assinar AccessToken (RS256, 15min, {sub, email, role, tenantId, permissions})
  8. Audit log: LOGIN
  9. Webhook: user.login
    ↓
Cliente ← {accessToken, refreshToken, sessionId}
```

### 5.2 Login com 2FA

```
Cliente → POST /auth/login {email, password}
    ↓
NexusAuth:
  1-3. Validar credenciais (igual ao fluxo padrão)
  4. user.twoFactorEnabled = true
  5. Assinar ChallengeToken (RS256, 5min, {sub, email, role})
  6. Audit log: TWO_FACTOR_CHALLENGE
    ↓
Cliente ← {requiresTwoFactor: true, challengeToken}
    ↓
Cliente → POST /2fa/challenge {challengeToken, code}
    ↓
NexusAuth:
  1. Rate limit check (5 tentativas/60s)
  2. verifyChallenge(challengeToken) — algorithms: ['RS256']
  3. otplib.authenticator.verify({token: code, secret})
  4. Criar Session + RefreshToken
  5. Assinar AccessToken (com tenantId + permissions)
  6. Audit log: LOGIN
  7. Webhook: user.login
    ↓
Cliente ← {accessToken, refreshToken}
```

### 5.3 OAuth2 (Google)

```
Cliente → GET /auth/google
    ↓
Redirect → Google OAuth consent screen
    ↓
Google → GET /auth/google/callback?code=...
    ↓
NexusAuth:
  1. passport-google-oauth20 troca code por profile
  2. Buscar user por googleId
  3. Se não encontrado: buscar por email
     - Se email existe E profile.emailVerified = true: vincular googleId
     - Se email existe E emailVerified = false: REJEITAR (segurança)
     - Se não existe: criar novo user com googleId
  4. Criar Session + RefreshToken
  5. Assinar AccessToken
  6. Audit log: LOGIN (method: oauth_google)
  7. Webhook: user.login
    ↓
Cliente ← {accessToken, refreshToken}
```

### 5.4 Magic Link

```
Cliente → POST /auth/magic-link {email}
    ↓
NexusAuth:
  1. Buscar user por email
  2. Se existe: gerar token UUID, salvar MagicLink (15min)
  3. Enviar email com link
    ↓
Cliente ← {message: "If the email exists, a magic link has been sent"}
    ↓
Email → cliente clica no link
    ↓
Cliente → GET /auth/magic-link/verify?token=...
    ↓
NexusAuth:
  1. Validar token (existe, não usado, não expirado)
  2. Marcar token como usado
  3. Se 2FA habilitado: retornar challengeToken
  4. Senão: criar Session + tokens
  5. Audit log: LOGIN (method: magic_link)
    ↓
Cliente ← {accessToken, refreshToken}
```

### 5.5 Refresh Token Rotation

```
Cliente → POST /auth/refresh {refreshToken}
    ↓
NexusAuth:
  1. Buscar RefreshToken no Postgres
  2. Validar: existe, não revogado, não expirado
  3. Revogar token anterior (revoked = true)
  4. Criar novo RefreshToken (mesma sessionId)
  5. Assinar novo AccessToken
    ↓
Cliente ← {accessToken, refreshToken: novo}
```

### 5.6 Logout

```
Cliente → POST /auth/logout {refreshToken}
Headers: Authorization: Bearer <accessToken>
    ↓
NexusAuth:
  1. verify(accessToken) — algorithms: ['RS256']
  2. Blacklist no Redis: blacklist:<jti> com TTL = exp - now
  3. Revogar RefreshToken no Postgres
  4. Desativar Session
  5. Audit log: LOGOUT
  6. Webhook: user.logout
    ↓
Cliente ← {message: "Logged out successfully"}
```

---

## 6. Segurança

### 6.1 JWT RS256

- Assinatura com chave privada RSA (4096 bits)
- Verificação com `algorithms: ['RS256']` (previne algorithm confusion)
- Issuer validado em todos os `verify()` calls
- JWKS endpoint expõe apenas a chave pública
- Access token: 15min, com `jti` (UUID) para blacklist
- Refresh token: UUID, single-use com rotation

### 6.2 Rate Limiting

| Endpoint | Limite | Janela | Storage |
|---|---|---|---|
| POST /auth/login | 5 tentativas | 60s por IP | Redis |
| POST /2fa/setup | 5 tentativas | 60s por user | Redis |
| POST /2fa/verify | 5 tentativas | 60s por user | Redis |
| POST /2fa/disable | 5 tentativas | 60s por user | Redis |
| POST /2fa/challenge | 5 tentativas | 60s por user | Redis |

### 6.3 Account Lockout

- Após 5 tentativas falhas de login: conta bloqueada por 15 minutos
- Chave Redis: `lockout:<email>` com TTL 15min
- Reset do contador em login bem-sucedido

### 6.4 Políticas de Senha

- Mínimo 8 caracteres
- Complexidade: maiúscula, minúscula, número, símbolo
- Histórico: não pode repetir últimas 5 senhas
- Troca exige senha atual

### 6.5 SSRF Guard (Webhooks)

Bloqueia URLs que resolvem para:
- `127.0.0.0/8` (loopback)
- `10.0.0.0/8` (private)
- `172.16.0.0/12` (private)
- `192.168.0.0/16` (private)
- `169.254.0.0/16` (link-local)
- `::1` (IPv6 loopback)
- `fc00::/7` (IPv6 ULA)
- `fe80::/10` (IPv6 link-local)
- `localhost` hostname

Validação na criação, update e antes de cada dispatch (DNS rebinding protection).

### 6.6 CORS

- Desenvolvimento: `origin: true` (permite qualquer origem)
- Produção: fail-closed — se `CORS_ORIGINS` vazio, `origin: false`
- Produção com origins: apenas domínios listados são permitidos

### 6.7 Swagger

- Desenvolvimento: `/docs` disponível
- Produção: `/docs` desabilitado quando `NODE_ENV=production`

### 6.8 OAuth Account Linking

- Contas OAuth só são vinculadas a usuários existentes se `emailVerified = true`
- Previne account hijacking via email não verificado

### 6.9 PermissionGuard

- Rotas sensíveis protegidas com `@RequirePermission('permission:name')`
- Permissões verificadas no JWT payload
- Exemplos: `tenant:manage`, `users:read`

---

## 7. Guia de Produção

### 7.1 Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Sim |
| `REDIS_URL` | Redis connection string | Sim |
| `JWT_PRIVATE_KEY_PATH` | Caminho da chave privada RS256 | Sim |
| `JWT_PUBLIC_KEY_PATH` | Caminho da chave pública RS256 | Sim |
| `CORS_ORIGINS` | Origens permitidas (vírgula) | Sim (prod) |
| `NODE_ENV` | `production` | Sim (prod) |
| `GOOGLE_CLIENT_ID` | OAuth2 Google | Opcional |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Google | Opcional |
| `GOOGLE_CALLBACK_URL` | Callback Google | Opcional |
| `GITHUB_CLIENT_ID` | OAuth2 GitHub | Opcional |
| `GITHUB_CLIENT_SECRET` | OAuth2 GitHub | Opcional |
| `GITHUB_CALLBACK_URL` | Callback GitHub | Opcional |
| `SMTP_HOST` | Servidor SMTP | Sim |
| `SMTP_PORT` | Porta SMTP | Sim |
| `SMTP_USER` | Usuário SMTP | Sim |
| `SMTP_PASS` | Senha SMTP | Sim |
| `SMTP_FROM` | Email remetente | Sim |

### 7.2 Chaves RS256

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 4096
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

> **Importante:** Em produção multi-replica, as chaves devem ser montadas via persistent volume ou Docker secret. Não gerar ad-hoc no container — cada réplica teria chaves diferentes.

### 7.3 Checklist de segurança

- [ ] Rotacionar todos os secrets (JWT, OAuth, SMTP)
- [ ] CORS restritivo (`CORS_ORIGINS` com domínios reais)
- [ ] HTTPS obrigatório (reverse proxy com TLS 1.2+)
- [ ] `NODE_ENV=production`
- [ ] Redis acessível e com AUTH
- [ ] Chaves RS256 protegidas (secrets management)
- [ ] Database com senha forte
- [ ] Helmet ativo (headers de segurança)
- [ ] Backup automatizado do banco
- [ ] Prometheus scraping `/metrics`

### 7.4 Health checks para orquestradores

| Endpoint | Tipo | Comportamento |
|---|---|---|
| `/health/live` | Liveness | 200 sempre que processo responde |
| `/health/ready` | Readiness | 200 se DB+Redis OK, 503 se falha |
| `/health` | Full | 200 se tudo OK, 503 se degradado |

### 7.5 Plataformas recomendadas

- **Railway** — deploy direto do repo, Postgres + Redis gerenciados
- **Render** — alternativa similar, free tier disponível
- **Docker** — imagem pronta para k8s, ECS, etc.

---

## 8. Changelog das Fases

### Fase 1 — Fundação
- Projeto NestJS + TypeScript + Prisma configurado
- Docker Compose (Postgres + Redis + API + app teste)
- Schema Prisma completo com 10+ modelos
- Config de ambiente (.env, JWT RS256, Redis, SMTP, OAuth2)
- Helmet + CORS configurável

### Fase 2 — Auth Core
- Registro com bcrypt + verificação de email
- Login com access token (15min, RS256)
- Refresh token com rotation (7 dias, Postgres)
- Logout com blacklist no Redis
- JWKS endpoint (`/.well-known/jwks.json`)
- Guards: JWT, RBAC

### Fase 3 — Segurança
- Rate limiting no Redis (5 tentativas/min/IP)
- Account lockout (5 falhas → 15min)
- Políticas de senha (complexidade + histórico de 5)
- Recuperação de senha (token de uso único, 15min)
- Graceful shutdown (SIGTERM/SIGINT)
- Logs estruturados com correlation ID
- Erros padronizados com códigos

### Fase 4 — 2FA
- QR code para TOTP (otplib)
- Verificação e ativação de 2FA
- Desativação (exige senha)
- Challenge no login com 2FA
- Códigos de backup (10 códigos de uso único)

### Fase 5 — OAuth2 & Magic Link
- Login com Google (passport-google-oauth20)
- Login com GitHub (passport-github2)
- Magic link (login sem senha via email)
- Vincular conta OAuth2 a usuário existente

### Fase 6 — Sessões & Audit
- Gestão de sessões (device, IP, localização, user agent)
- Revogar sessão específica
- Logout global (revoga todas)
- Notificação de novo dispositivo
- Audit log completo com metadados
- Endpoint de consulta de audit log (admin)

### Fase 7 — Multi-tenant & Impersonation
- Suporte a `tenant_id` no JWT
- Guard de tenant (isola dados por empresa)
- Middleware que injeta tenant no request
- Impersonation auditado (admin age como outro usuário)
- Permissões granulares (`users:read`, `tenant:manage`, etc.)

### Fase 8 — Webhooks & API Keys
- Sistema de webhooks (registrar URL + eventos)
- Dispatch com assinatura HMAC-SHA256
- Retry de webhooks falhados (3 tentativas)
- API keys para serviço-a-serviço
- Guard de API Key
- Dashboard de entregas por webhook

### Fase 9 — SDK & Documentação
- SDK `@nexus/auth-sdk` (middleware Express/NestJS/Next.js)
- React hooks (useAuth, useSession, useUser)
- Swagger/OpenAPI automático
- Testes E2E (Jest + Supertest)
- App de teste na porta 4000

### Fase 10 — Observabilidade & Deploy
- Métricas Prometheus (`/metrics`)
- Health check detalhado (live, ready, full)
- CI/CD no GitHub Actions (lint, test, build)
- Docker multi-stage build otimizado
- Documentação técnica completa

### Pós-Fase 10 — Auditoria de Segurança
- **CRÍTICO:** JWT algorithm confusion corrigido (RS256 only)
- **CRÍTICO:** PermissionGuard em `/tenant/invite`
- **ALTO:** Rate limiting em todos os endpoints 2FA
- **ALTO:** SSRF guard em webhooks (criação + dispatch)
- **ALTO:** OAuth emailVerified check antes de vincular
- **MÉDIO:** CORS fail-closed em produção
- **MÉDIO:** Swagger desabilitado em produção
- **MÉDIO:** Padronização de payload JWT (tenantId + permissions)
- **MÉDIO:** Documentação de chaves RS256 no Dockerfile
- **MÉDIO:** Correção do header X-Webhook-Event
- **Testes:** 28 testes E2E passando + 4 testes manuais de segurança

---

## 📄 Licença

Este projeto é de uso pessoal/portfólio. Todos os direitos reservados a Breno José de Oliveira.
