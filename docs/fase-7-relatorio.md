# Fase 7 — Refinamento, Estabilização & UX Polish

## Status: ✅ Concluída

## Objectivo

Refatorar e estabilizar a base de código existente, eliminar bugs críticos, melhorar a UX, centralizar o cliente HTTP do frontend e preparar a base para integração com **NexusAuth** (autenticação real).

---

## O que foi feito

### 1. Centralização do cliente HTTP (`lib/api.ts`)

**Problema anterior**: `http://localhost:3002` estava hardcoded em **15+ ficheiros** do frontend, sem tipagem, sem tratamento de erro consistente.

**Solução**:

- Criado `apps/web/lib/api.ts` com:
  - Constante `API` (configurável via `NEXT_PUBLIC_API_URL`)
  - `apiFetch<T>()` wrapper genérico com JSON automático e `ApiRequestError`
  - Atalhos `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`
- Substituídos **todos** os usos de `fetch` por chamadas tipadas.

**Benefícios**:
- Uma única fonte de verdade para a URL do backend
- Type safety em todas as respostas
- Erros tipados em vez de `any`
- Configurável por variável de ambiente

### 2. Unificação do `MOCK_USER_ID`

**Problema anterior**: três valores diferentes para o user mock:
- `prisma.service.ts` → `'user-dev-1'` (criado no `onModuleInit`)
- `chat.service.ts` → `'mock-user-id'` (não correspondia ao user real)
- `databases.service.ts` → `'mock-user-id'` (idêntico problema)

Resultado: queries do chat e databases retornavam sempre arrays vazios, mesmo com dados existentes.

**Solução**: 
- Todos os serviços agora importam `MOCK_USER_ID` de `prisma.service.ts`
- Removido o método `ensureMockUser()` duplicado em `DatabasesService`
- Garantia de um único ID de user mock em todo o backend.

### 3. Bug crítico: `apps/web/app/settings/page.tsx`

**Problema**: o ficheiro começava com `ecisar melho'use client';` — texto residual antes da directiva `'use client'`. Quebrava a compilação do Next.js.

**Solução**: linha corrigida para `'use client';` corretamente.

### 4. Módulo de Notificações (Backend)

Embora o `model Notification` já existisse na BD e o componente `NotificationPanel` já estivesse implementado, **não existia o endpoint backend** correspondente.

Criado `apps/backend/src/notifications/`:
- `notifications.module.ts`
- `notifications.controller.ts` — GET, POST, PATCH (`/read`, `/read-all`), DELETE (`/`, `/:id`, `/clear`)
- `notifications.service.ts` — CRUD completo com `MOCK_USER_ID` consistente

**Resultado**: o `NotificationPanel` no frontend agora usa dados reais da BD, com optimistic updates e rollback em caso de erro.

### 5. Query params no Command Palette

Os comandos do Command Palette que diziam "Criar Nova Meta", "Criar Nova Database" etc. apontavam para URLs com `?new=true`, mas as páginas não liam esse query param.

**Solução**:
- Adicionado `useSearchParams` em `dashboard`, `hoje`, `metas`, `rotinas`, `paginas`, `databases`
- O query param `?new=true` agora abre automaticamente o formulário de criação
- Adicionados novos comandos: **Abrir Notificações** e **Marcar Compromisso**

### 6. Melhorias de UI/UX

- **Botão de tema "Settings" duplicado** no Header — removido
- **Favicon SVG** criado (`apps/web/app/favicon.ico.svg`) com a logo do Zenith
- **Metadata OpenGraph** adicionada para partilha em redes sociais
- **Falta de description** no `layout.tsx` — adicionada descrição completa

### 7. Documentação

- `.env.example` atualizado com `DATABASE_URL`, `GEMINI_API_KEY` e `PORT` documentados
- Este relatório criado
- README atualizado para refletir o estado real

---

## Ficheiros criados / modificados

### Criados (4)
- `apps/web/lib/api.ts` — cliente HTTP centralizado
- `apps/backend/src/notifications/notifications.module.ts`
- `apps/backend/src/notifications/notifications.service.ts`
- `apps/backend/src/notifications/notifications.controller.ts`
- `apps/web/app/favicon.ico.svg`

### Modificados (~15)
- `apps/web/app/settings/page.tsx` — bug crítico corrigido
- `apps/web/app/layout.tsx` — metadata + favicon
- `apps/web/app/dashboard/page.tsx` — usa `lib/api`
- `apps/web/app/hoje/page.tsx` — `lib/api` + `useSearchParams`
- `apps/web/app/metas/page.tsx` — `lib/api` + `useSearchParams`
- `apps/web/app/rotinas/page.tsx` — `lib/api` + `useSearchParams`
- `apps/web/app/paginas/page.tsx` — `lib/api` + `useSearchParams`
- `apps/web/app/paginas/[id]/page.tsx` — `lib/api`
- `apps/web/app/databases/page.tsx` — `lib/api` + `useSearchParams`
- `apps/web/components/ai/QuickInput.tsx` — `lib/api`
- `apps/web/components/chat/ChatPanel.tsx` — `lib/api`
- `apps/web/components/calendar/CalendarView.tsx` — `lib/api`
- `apps/web/components/command/CommandPalette.tsx` — 2 novos comandos
- `apps/web/components/databases/DatabaseTable.tsx` — `lib/api`
- `apps/web/components/databases/DatabaseGallery.tsx` — `lib/api`
- `apps/web/components/notifications/NotificationPanel.tsx` — API real + optimistic updates
- `apps/web/components/search/GlobalSearch.tsx` — `lib/api`
- `apps/backend/src/chat/chat.service.ts` — MOCK_USER_ID unificado
- `apps/backend/src/databases/databases.service.ts` — MOCK_USER_ID unificado
- `apps/backend/src/app.module.ts` — registo do NotificationsModule
- `apps/backend/.env.example` — documentado
- `README.md` — atualizado

---

## Decisões

- **Cliente HTTP centralizado** (em vez de melhorias incrementais): o problema de hardcoded estava espalhado por toda a base; centralizar uma vez evita bugs futuros.
- **Notifications com optimistic update**: UX mais rápida, com rollback automático em caso de erro.
- **MOCK_USER_ID único**: seguir a fonte de verdade (`prisma.service.ts`) em vez de copiar a constante.
- **NÃO mexer no NexusAuth**: o utilizador indicou que está a ser adicionado mas ainda não quer que se toque nele. As pendências de auth estão documentadas para uma fase futura.

---

## Pendências (próximas fases)

- [ ] **NexusAuth**: integrar autenticação real. Substituir `MOCK_USER_ID` por JWT do utilizador autenticado, criar `AuthGuard` no NestJS, remover auto-create do user mock.
- [ ] **Mobile (Expo)**: criar `apps/mobile` com as mesmas APIs
- [ ] **Desktop (Tauri)**: empacotar a versão web com Tauri 2
- [ ] **Sistema de Blocos (Tiptap)**: substituir contentEditable por editor rico
- [ ] **Testes**: adicionar Vitest + Playwright + Detox
- [ ] **CI/CD**: GitHub Actions + EAS + Tauri Action
- [ ] **Push notifications** (Web Push API + Expo Push)
- [ ] **Upload real** (UploadThing ou Cloudinary)
- [ ] **Drag-and-drop de appointments** no calendário
