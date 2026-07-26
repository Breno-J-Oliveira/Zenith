# Fase 8 — Integração com NexusAuth (autenticação real)

## Status: ✅ Concluída

## Objectivo

Integrar o microsserviço **NexusAuth** (anteriormente em `NEXUSAUTH/`, agora em `apps/auth-service/`) no Zenith, substituindo o `MockAuthProvider` mock por autenticação real baseada em JWT RS256 com JWKS, e permitindo login, registo e gestão de sessão completos.

---

## O que foi feito

### 1. Reorganização do monorepo

- **`NEXUSAUTH/` → `apps/auth-service/`** (pasta correta do monorepo).
- Atualizado `.gitignore` para proteger chaves RSA, BD local e logs do NexusAuth.
- `package.json` (raiz) com novos scripts:
  - `npm run dev:auth` — só o NexusAuth
  - `npm run dev:backend` — só o Zenith backend
  - `npm run dev:web` — só o frontend
  - `npm run dev` — todos em paralelo (Turborepo)

### 2. Cliente NexusAuth (`packages/shared`)

- **`NexusAuthClient`** em `packages/shared/src/auth/nexus-client.ts`:
  - `login`, `register`, `refresh`, `logout`, `me`
  - `forgotPassword`, `resetPassword`, `verifyEmail`
  - `requestMagicLink`, `verifyMagicLink`, `changePassword`
  - `getSessions`, `revokeSession`
  - `getJwks`, `health`
  - Classe `NexusAuthError` tipada (com `status` e `code`)
- **Token store in-memory** (`token-store.ts`) — seguro contra XSS, com opção de `localStorage` para dev.
- **Sem dependências externas** — usa apenas `fetch` nativo.

### 3. Backend — Módulo de Auth (`apps/backend/src/auth/`)

- **`JwksService`** — obtém e cacheia chaves públicas via `/.well-known/jwks.json`. Valida JWT RS256 com crypto nativo do Node.
- **`NexusAuthGuard`** — guard global (via `APP_GUARD`) que valida o JWT em todas as rotas. Suporta `@Public()` para rotas públicas.
- **`UserSyncService`** — auto-cria o `User` no Zenith a partir do `sub` do JWT (idempotente via `prisma.user.upsert`).
- **`@CurrentUser()` decorator** — extrai o user Zenith ou o payload JWT do request.
- **`AuthController`** — endpoints auxiliares:
  - `GET /auth/me` — user Zenith atual
  - `GET /auth/jwt` — payload completo do JWT
  - `GET /auth/health` (público) — verifica se NexusAuth está acessível
- **Modo dev** — `NEXUS_AUTH_SKIP_VALIDATION=true` desabilita verificação de assinatura (apenas para demo sem DB/Redis).

### 4. Compatibilidade com `MOCK_USER_ID`

- `MOCK_USER_ID` em `prisma.service.ts` agora é só fallback de dev.
- Services existentes (`goals`, `tasks`, etc.) continuam a funcionar com `MOCK_USER_ID`.
- **`getUserIdFromRequest(request)`** em `current-user.util.ts` — helper para extrair o userId do JWT quando o controller migrar.
- **`PrismaService.onModuleInit`** — continua a criar o user mock automaticamente.

### 5. Frontend

- **`AuthProvider` reescrito** (`apps/web/components/auth/AuthProvider.tsx`):
  - `login`, `register`, `logout`, `refreshUser`
  - Refresh automático do access token 30s antes de expirar
  - Health check do NexusAuth no mount
  - Redireciona para `/login` em rotas protegidas
  - Listener de `zenith:auth:logout` para reagir a 401s
- **Páginas completas**:
  - `/login` — login com email/password + OAuth (Google, GitHub) + indicador de saúde do NexusAuth
  - `/register` — registo com validação + indicador de força da password
- **`lib/api.ts` melhorado** — adiciona automaticamente `Authorization: Bearer <token>` em todos os requests, dispara logout em 401.
- **Header atualizado** — mostra avatar + nome do user, menu com Settings/Logout, botão "Entrar" para utilizadores não autenticados.
- **Movido `(auth)/login` e `(auth)/register` para a route group `(auth)`** (já existia, agora com integração real).

### 6. Variáveis de ambiente

- **`apps/backend/.env.example`**: adicionadas `NEXUS_AUTH_URL`, `NEXUS_JWT_ISSUER`, `NEXUS_AUTH_SKIP_VALIDATION`.
- **`apps/web/.env.local.example`**: adicionadas `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_NEXUS_AUTH_URL`.

---

## Ficheiros criados / modificados

### Criados (11)
- `apps/backend/src/auth/jwt.types.ts`
- `apps/backend/src/auth/jwks.service.ts`
- `apps/backend/src/auth/auth.guard.ts`
- `apps/backend/src/auth/user-sync.service.ts`
- `apps/backend/src/auth/current-user.decorator.ts`
- `apps/backend/src/auth/current-user.util.ts`
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.module.ts`
- `packages/shared/src/auth/nexus-client.ts`
- `packages/shared/src/auth/token-store.ts`
- `apps/web/app/(auth)/login/page.tsx` (reescrito)
- `apps/web/app/(auth)/register/page.tsx` (reescrito)
- `apps/web/.env.local.example`
- `docs/fase-8-relatorio.md`

### Modificados
- `package.json` (raiz) — workspaces + scripts
- `turbo.json` — pipeline global
- `.gitignore` — chaves RSA, BD local, logs
- `apps/backend/src/app.module.ts` — registo do AuthModule + APP_GUARD
- `apps/backend/src/app.controller.ts` — `@Public()` em `/` e `/health`
- `apps/backend/src/ai/ai.controller.ts` — `@Public()` em todas as rotas
- `apps/backend/src/prisma.service.ts` — MOCK_USER_ID documentado como fallback
- `packages/shared/src/auth/index.ts` — reescrito com NexusAuth
- `apps/web/components/auth/AuthProvider.tsx` — reescrito
- `apps/web/lib/api.ts` — Bearer token automático
- `apps/web/components/layout/Header.tsx` — user menu + logout

---

## Como usar a integração

### 1. Subir o NexusAuth (apps/auth-service/)

```bash
cd apps/auth-service
# 1. Gerar chaves RS256
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# 2. Configurar .env
cp .env.example .env
# Editar DATABASE_URL, REDIS_URL, SMTP, GOOGLE_CLIENT_ID, etc.

# 3. Subir dependências (Postgres + Redis) — recomendado via Docker:
docker compose up -d postgres redis

# 4. Migrations
npx prisma migrate deploy

# 5. Iniciar
npm run start:dev
# API em http://localhost:3000
# Swagger em http://localhost:3000/docs
```

### 2. Modo dev sem Docker (skip validation)

Se quiseres testar o frontend sem subir Postgres+Redis+Postgres:
- Backend: `NEXUS_AUTH_SKIP_VALIDATION=true` (valida o formato do JWT mas não a assinatura)
- **Apenas para demo** — nunca em produção.

### 3. Fluxo end-to-end

1. **User abre o site** → `AuthProvider` verifica se há tokens em memória → se não, redireciona para `/login`.
2. **User faz login** em `/login` → `POST /auth/login` no NexusAuth → recebe `accessToken` + `refreshToken`.
3. **Frontend guarda tokens em memória** e faz `GET /auth/me` no Zenith com `Authorization: Bearer <accessToken>`.
4. **Zenith valida o JWT** via `NexusAuthGuard` → valida assinatura com chave pública do JWKS → extrai `sub` → sincroniza o User no Prisma.
5. **User navega** — todas as requests carregam o token automaticamente via `lib/api.ts`.
6. **Token expira (15min)** → `AuthProvider` faz refresh automático 30s antes, com o `refreshToken`.
7. **User clica "Sair"** → `POST /auth/logout` no NexusAuth → tokens são apagados → redirect para `/login`.

---

## Decisões

- **Cliente sem dependências externas**: `NexusAuthClient` foi reescrito sem usar `jsonwebtoken`, `@nestjs/passport`, etc. Apenas `fetch` + `crypto` nativo. Mais leve, mais seguro (menos código de terceiros), mais portável.
- **Tokens em memória por defeito**: contra XSS. Trade-off: perdidos em refresh de página. Para sessões persistentes, configurar BFF com httpOnly cookie (futuro).
- **APP_GUARD global**: protege todas as rotas por defeito; opt-out com `@Public()`. Mais seguro que decorar cada controller.
- **MOCK_USER_ID mantido como fallback**: evita ter que refatorar 10+ services. Migração para `getUserIdFromRequest()` é gradual.
- **NEXUSAUTH/ → apps/auth-service/**: pasta consistente com o monorepo. Services partilham o `node_modules` raiz.
- **Modo dev (skip validation)**: variável de ambiente para demo sem infra completa. Log de aviso sempre que ligado.

---

## Pendências (próximas fases)

- [ ] **BFF (Backend-For-Frontend)**: trocar tokens in-memory por httpOnly refresh token cookie + endpoint BFF que troca cookie por access token.
- [ ] **Migrar controllers** para usar `@CurrentUser()` em vez de `MOCK_USER_ID` (gradual).
- [ ] **Email verification flow**: criar página `/verify-email/[token]` e `/reset-password/[token]`.
- [ ] **2FA setup UI**: página para configurar TOTP no frontend.
- [ ] **Magic Link UI**: página para pedir magic link.
- [ ] **OAuth callback handlers**: `/auth/google/callback` e `/auth/github/callback` no frontend.
- [ ] **Testes E2E**: fluxo completo de login no Playwright.
- [ ] **Audit log UI**: usar o `/audit` do NexusAuth para mostrar histórico de ações do user.
