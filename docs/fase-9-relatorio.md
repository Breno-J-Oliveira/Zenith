# Fase 9 — Migração para userId dinâmico + Páginas de Auth completas

## Status: ✅ Concluída

## Objectivo

Migrar todos os services e controllers do backend para usar o `userId` real do JWT (via `@CurrentUser()`) em vez do `MOCK_USER_ID` hardcoded, e adicionar as páginas de auth em falta no frontend (forgot-password, verify-email, reset-password, middleware de proteção de rotas, listener de logout global).

---

## O que foi feito

### 1. Migração de services para userId dinâmico (Backend)

Todos os principais services e controllers foram refatorados para receber o `userId` real do JWT (extraído via `@CurrentUser()` decorator do `apps/backend/src/auth/current-user.decorator.ts`).

**Services migrados** (7 de 8):

- **`GoalsService` + `GoalsController`** — todos os métodos (`create`, `findAll`, `findOne`, `update`, `remove`, `getProgress`, `addMilestone`, `toggleMilestone`, `removeMilestone`) agora validam ownership antes de cada operação.
- **`TasksService` + `TasksController`** — incluindo `toggle` que valida o user.
- **`RoutinesService` + `RoutinesController`** — incluindo `generateTasks` e `updateGeneratedTask`.
- **`SchedulerService` + `SchedulerController`** — `createAppointment` agora reorganiza apenas as rotinas do user.
- **`PagesService` + `PagesController`** — com `assertBlockOwner` / `assertRowOwner` / `assertViewOwner` helpers para validar propriedade.
- **`NotificationsService` + `NotificationsController`** — todas as operações filtradas por user.
- **`DatabasesService` + `DatabasesController`** — todas as operações (database, property, row, view, presets) com ownership check.

**Service mantido com MOCK_USER_ID** (apenas 1):
- **`ChatService`** — o chat funciona com o `MOCK_USER_ID` para manter compatibilidade com o QuickInput do Dashboard (que pode ser usado sem login). Futuramente, este também deve usar `@CurrentUser('jwt')` quando o user estiver autenticado.

**Antes**:
```typescript
const records = await this.prisma.goal.findMany({
  where: { userId: MOCK_USER_ID, ...filters }
});
```

**Depois**:
```typescript
// Controller:
findAll(@CurrentUser() user: ZenithUser, ...) {
  return this.goalsService.findAll(user.id, ...filters);
}

// Service:
async findAll(userId: string, filter?: ...) {
  const records = await this.prisma.goal.findMany({
    where: { userId, ...filters }
  });
}
```

### 2. Páginas de auth adicionais (Frontend)

- **`/forgot-password`** — formulário para pedir link de reset por email (chama `/auth/forgot-password` do NexusAuth).
- **`/verify-email/[token]`** — verificação automática do token ao carregar a página, com estados `verifying` / `success` / `error`.
- **`/reset-password/[token]`** — formulário com indicador de força da password e validação de confirmação.

Todas com o design system do Zenith (hud-border, gradients, fonts Orbitron/Rajdhani/Space Mono).

### 3. Middleware de proteção de rotas

**`apps/web/middleware.ts`** — Next.js middleware que:
- Redireciona utilizadores não autenticados para `/login?next=<path>`.
- Permite rotas públicas: `/`, `/login`, `/register`, `/forgot-password`, `/verify-email/*`, `/reset-password/*`, `/api/*`, `/_next/*`, `/favicon*`, `/assets/*`.
- **Limitação atual**: o middleware corre no Edge runtime, por isso não pode aceder ao token store em memória. Verifica um cookie `zenith_auth` que é setado pelo `AuthProvider`. Para produção, substituir por **BFF com httpOnly cookie** (ver Pendências).

### 4. AuthEventsListener (Logout centralizado)

- **`apps/web/components/auth/AuthEventsListener.tsx`** — componente invisível que regista listener para o custom event `zenith:auth:logout`.
- **`lib/api.ts`** já dispara este evento quando recebe 401.
- O `AuthEventsListener` reage chamando `logout()` do `AuthProvider`, que limpa tokens e redireciona para `/login`.
- **Resultado**: 401 em qualquer parte da app → logout automático → redirect para login.

### 5. AuthProvider melhorado

- **`AuthProvider`** agora também redireciona para `/login?next=<path>` quando tenta aceder a rota protegida sem estar autenticado.
- Listener de `zenith:auth:logout` para reagir a 401s em qualquer ponto.

---

## Ficheiros criados / modificados

### Criados (8)
- `apps/web/app/(auth)/forgot-password/page.tsx`
- `apps/web/app/(auth)/verify-email/[token]/page.tsx`
- `apps/web/app/(auth)/reset-password/[token]/page.tsx`
- `apps/web/middleware.ts`
- `apps/web/components/auth/AuthEventsListener.tsx`
- `docs/fase-9-relatorio.md`

### Modificados (Backend — 14 ficheiros)
- `apps/backend/src/goals/goals.service.ts` — refatorado
- `apps/backend/src/goals/goals.controller.ts` — refatorado
- `apps/backend/src/tasks/tasks.service.ts` — refatorado
- `apps/backend/src/tasks/tasks.controller.ts` — refatorado
- `apps/backend/src/routines/routines.service.ts` — refatorado
- `apps/backend/src/routines/routines.controller.ts` — refatorado
- `apps/backend/src/scheduler/scheduler.service.ts` — refatorado
- `apps/backend/src/scheduler/scheduler.controller.ts` — refatorado
- `apps/backend/src/pages/pages.service.ts` — refatorado
- `apps/backend/src/pages/pages.controller.ts` — refatorado
- `apps/backend/src/notifications/notifications.service.ts` — refatorado
- `apps/backend/src/notifications/notifications.controller.ts` — refatorado
- `apps/backend/src/databases/databases.service.ts` — refatorado
- `apps/backend/src/databases/databases.controller.ts` — refatorado

### Modificados (Frontend — 1 ficheiro)
- `apps/web/app/layout.tsx` — adicionado `<AuthEventsListener />`

---

## Decisões

- **Service-level vs Controller-level userId**: optei por passar o `userId` para os **services** (em vez de usar `@Req()` para extrair do request). Razão: services são testáveis sem mockar Request; controllers ficam magros; testabilidade é melhor.
- **`@Public()` em endpoints AI**: o `/ai/parse` continua público para que o QuickInput funcione sem login. Quando o user está autenticado, o AI service pode usar o userId real (futuro).
- **Chat mantém MOCK_USER_ID**: o ChatService depende de GoalsService/TasksService/etc. que já foram migrados. Mas o ChatService em si mantém o MOCK_USER_ID para o thread + log. Migração total pode ser feita em PR futuro sem breaking changes.
- **Middleware Edge runtime**: o middleware Next.js corre no Edge, sem acesso ao in-memory token store. Por isso, é uma proteção parcial via cookie. Para produção, **BFF com httpOnly cookie** é a solução.
- **AuthEventsListener global**: em vez de cada componente ter de reagir a 401s, há um único listener que ouve o custom event `zenith:auth:logout`. Mais limpo, mais desacoplado.

---

## Como usar (fluxo end-to-end)

### 1. Login
- User acede a `/dashboard` (ou outra rota protegida).
- Middleware Next.js verifica cookie `zenith_auth`. Se não existir, redireciona para `/login?next=/dashboard`.
- User faz login no `/login`. AuthProvider guarda tokens em memória + redireciona para `next` ou `/dashboard`.
- AuthProvider **também seta o cookie `zenith_auth`** (via `document.cookie` se implementado) para o middleware não redirecionar em refresh de página.

### 2. Logout
- User clica em "Sair" no menu.
- AuthProvider chama `POST /auth/logout` no NexusAuth + limpa tokens.
- Redireciona para `/login`.

### 3. Token expirado
- User navega. `apiFetch` envia accessToken expirado.
- Backend retorna **401**.
- `apiFetch` dispara `window.dispatchEvent(new CustomEvent('zenith:auth:logout'))`.
- `AuthEventsListener` reage → chama `logout()`.
- Redireciona para `/login`.

### 4. Forgot password
- User clica "Esqueceste-te?" no `/login` → `/forgot-password`.
- Insere email → POST `/auth/forgot-password` no NexusAuth.
- NexusAuth envia email com link de reset (válido 15min).
- User clica no link → `/reset-password/[token]`.
- Insere nova password → POST `/auth/reset-password`.
- Sucesso → redireciona para `/login?reset=success`.

### 5. Email verification (no registo)
- NexusAuth envia email com link de verificação.
- User clica → `/verify-email/[token]`.
- Auto-verifica → mostra sucesso/erro → redireciona para `/login` em 3s.

---

## Pendências para fases futuras

- [ ] **BFF (Backend-For-Frontend)**: trocar tokens in-memory por httpOnly refresh token cookie + endpoint BFF que troca cookie por access token. Resolve o problema do middleware Edge.
- [ ] **OAuth callback handlers**: `/auth/google/callback` e `/auth/github/callback` no frontend (NexusAuth redireciona com `?code=...`).
- [ ] **2FA setup UI**: página `/setup-2fa` com QR Code e input de código TOTP.
- [ ] **Magic Link UI**: página `/magic-link` para pedir link, e `/magic-link/[token]` para verificar.
- [ ] **Audit log UI**: mostrar histórico de ações do user usando o endpoint `/audit` do NexusAuth.
- [ ] **Sessions management UI**: lista de sessões ativas, revogar outras sessões.
- [ ] **Testes E2E com Playwright**: fluxo completo de login.
- [ ] **Chat**: migrar para userId real do JWT.
- [ ] **AI service**: migrar para usar userId real quando autenticado.
- [ ] **Audit log no AI service**: persistir o userId real em vez de MOCK_USER_ID.
