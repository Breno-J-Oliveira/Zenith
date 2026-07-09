# Fase 6 — Persistência (Prisma) + Sistema de Blocos (Notion-like)

## Status: ✅ Concluída

## Objetivo

Migrar todos os dados de arrays em memória para banco de dados real (Prisma + SQLite) e implementar um sistema de páginas e blocos estilo Notion, com editor baseado em Tiptap e drag-and-drop via dnd-kit.

---

## Etapa 1 — Migração para Prisma

### Schema Prisma

Arquivo: `apps/backend/prisma/schema.prisma`

Models criados:
- **User** — id, email, name, avatar, theme, createdAt (mock, sem auth real)
- **Goal** — userId, title, description, category, priority, status, deadline, milestones[], tasks[]
- **Milestone** — goalId, title, deadline, completed
- **Task** — userId, goalId?, milestoneId?, routineId?, title, description, status, date, completed, time?, duration?
- **Routine** — userId, title, frequency, time, duration, active, adaptable
- **Appointment** — userId, title, date, startTime, endTime
- **AILog** — userId?, input, result (JSON serializado)

### Migrations

- `20260709181125_init` — criação inicial (User, Goal, Milestone, Task, Routine, Appointment, AILog)
- `20260709182748_add_pages_blocks` — Page e Block (Etapa 2)

### MOCK_USER_ID

Constante `MOCK_USER_ID = "user-dev-1"` em `apps/backend/src/prisma.service.ts`. O usuário é auto-criado no `onModuleInit` do `PrismaService`. Isso é uma gambiarra intencional e temporária — quando a autenticação real entrar no roadmap, cada dado terá o `userId` do usuário autenticado.

### Services migrados

| Service | Antes | Depois |
|---------|-------|--------|
| `GoalsService` | `private goals: Goal[]` | `this.prisma.goal.*` |
| `TasksService` | delegava para `GoalsService` arrays | `this.prisma.task.*` + delega para `GoalsService` |
| `RoutinesService` | `private routines: Routine[]` + `private generatedTasks: Task[]` | `this.prisma.routine.*` + `this.prisma.task.*` |
| `SchedulerService` | `private appointments: Appointment[]` | `this.prisma.appointment.*` |
| `AIService` | `private log: AILogEntry[]` | `this.prisma.aILog.*` |
| `CalendarService` | chamava services síncronos | chamada async para os mesmos services |

Todos os controllers foram atualizados para `async/await` onde necessário. As interfaces públicas dos services não mudaram — apenas a implementação interna.

### Teste de restart (prova real de persistência)

```
=== DADOS ANTES DO RESTART ===
Goals: [{"id":"cmrdu3d3y...","title":"Aprender Rust",...}]
Routines: [{"id":"cmrdu3e6a...","title":"Meditar","frequency":"daily","time":"07:00",...}]
Tasks: [4 tasks — 1 goal task + 3 routine tasks]
Calendar: [{"id":"cal-rtask-cmrdu3f98...","title":"Meditar","start":"2026-07-09T07:00:00",...}]

[Backend reiniciado — Get-Process node | Stop-Process; npm run dev]

=== DADOS DEPOIS DO RESTART ===
Goals: [{"id":"cmrdu3d3y...","title":"Aprender Rust",...}]  ← mesmos IDs
Routines: [{"id":"cmrdu3e6a...","title":"Meditar",...}]     ← mesmos IDs
Tasks: [4 tasks — mesmos IDs, mesmos dados]                  ← persistido
Calendar: [{"id":"cal-rtask-cmrdu3f98...","title":"Meditar",...}]  ← persistido
```

**Conclusão**: Todos os dados sobreviveram ao restart. Persistência real confirmada.

### Rotas testadas (Etapa 1)

| Rota | Status |
|------|--------|
| `/` | 200 |
| `/dashboard` | 200 |
| `/metas` | 200 |
| `/rotinas` | 200 |
| `/calendario` | 200 |
| `/hoje` | 200 |
| `/relatorio` | 200 |

---

## Etapa 2 — Sistema de Blocos

### Schema — Models Page e Block

- **Page** — id, userId, title, parentId (auto-relacionamento para páginas aninhadas), icon?, createdAt, updatedAt
- **Block** — id, pageId, type (heading/text/todo/task_ref/goal_ref/image/divider), content (JSON flexível), order, createdAt

### Backend — `apps/backend/src/pages/`

**Endpoints:**
- `POST /pages` — criar página
- `GET /pages` — listar páginas (flat, com children IDs)
- `GET /pages/:id` — página com blocos ordenados
- `PATCH /pages/:id` — atualizar título/parentId/icon
- `DELETE /pages/:id` — deletar página + blocos em cascata
- `POST /pages/:id/blocks` — adicionar bloco
- `PATCH /pages/blocks/:blockId` — atualizar bloco
- `DELETE /pages/blocks/:blockId` — deletar bloco
- `PATCH /pages/blocks/reorder` — reordenar blocos em lote

### Frontend — `apps/web/app/paginas/`

- **`/paginas`** — lista de páginas raiz com árvore expansível (filhos via parentId)
- **`/paginas/[id]`** — editor da página com:
  - Título editável (input com blur-to-save)
  - Blocos renderizados por tipo via `BlockRenderer.tsx`
  - Drag-and-drop de blocos para reordenar (dnd-kit)
  - Menu "Adicionar bloco" com 7 tipos: heading, text, todo, task_ref, goal_ref, image, divider

### Tipos de bloco

| Tipo | Conteúdo | Componente |
|------|----------|------------|
| heading | `{ text, level }` | `HeadingBlock` |
| text | `{ text }` | `TextBlock` |
| todo | `{ text, checked }` | `TodoBlock` |
| task_ref | `{ taskId }` | `TaskRefBlock` |
| goal_ref | `{ goalId }` | `GoalRefBlock` |
| image | `{ url }` | `ImageBlock` |
| divider | `{}` | `DividerBlock` |

### Teste de reorder

```
PATCH /pages/blocks/reorder
Body: { "blocks": [{ "id": "block-todo", "order": 0 }, { "id": "block-heading", "order": 1 }] }
→ { "success": true }

GET /pages/:id → blocks ordenados: [todo(0), heading(1)]  ← ordem invertida com sucesso
```

### Rotas testadas (Etapa 2)

| Rota | Status |
|------|--------|
| `/paginas` | 200 (nova) |
| `/paginas/:id` | 200 (nova) |

---

## Como trocar de SQLite para Postgres

1. Instalar Postgres e criar um banco:
   ```bash
   createdb zenith
   ```

2. Trocar o datasource no `apps/backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Atualizar `apps/backend/.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/zenith?schema=public"
   ```

4. Apagar a pasta `apps/backend/prisma/migrations` e o `apps/backend/dev.db`

5. Rodar migration nova:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   ```

6. Reiniciar o backend. O `PrismaService` auto-cria o `MOCK_USER_ID` no `onModuleInit`.

---

## Pendências de auth real (MOCK_USER_ID)

Quando a autenticação real entrar no roadmap:

- [ ] Remover `MOCK_USER_ID` do `PrismaService` e de todos os services
- [ ] Implementar NextAuth ou JWT real no frontend
- [ ] Criar middleware NestJS que extrai `userId` do token JWT
- [ ] Substituir `MOCK_USER_ID` hardcoded pelo `userId` do request autenticado
- [ ] Adicionar guard NestJS (`AuthGuard`) que valida o token em todas as rotas
- [ ] Remover o auto-create do usuário mock no `onModuleInit`
- [ ] Adicionar campo `password` (hash) no model User quando necessário

---

## Arquivos criados/modificados

### Criados (7 arquivos)
- `apps/backend/prisma/schema.prisma` — schema Prisma completo (8 models)
- `apps/backend/src/prisma.service.ts` — PrismaClient + auto-create MOCK_USER_ID
- `apps/backend/src/prisma.module.ts` — módulo global do Prisma
- `apps/backend/src/pages/pages.service.ts` — CRUD de páginas e blocos
- `apps/backend/src/pages/pages.controller.ts` — endpoints REST
- `apps/backend/src/pages/pages.module.ts` — módulo Pages
- `apps/web/app/paginas/page.tsx` — listagem de páginas com árvore
- `apps/web/app/paginas/[id]/page.tsx` — editor de página com dnd-kit
- `apps/web/components/blocks/BlockRenderer.tsx` — renderer por tipo de bloco

### Modificados (10 arquivos)
- `apps/backend/src/app.module.ts` — +PrismaModule, +PagesModule
- `apps/backend/src/goals/goals.service.ts` — migrado para Prisma
- `apps/backend/src/goals/goals.controller.ts` — async/await
- `apps/backend/src/tasks/tasks.service.ts` — migrado para Prisma
- `apps/backend/src/tasks/tasks.controller.ts` — async/await
- `apps/backend/src/routines/routines.service.ts` — migrado para Prisma
- `apps/backend/src/routines/routines.controller.ts` — async/await
- `apps/backend/src/scheduler/scheduler.service.ts` — migrado para Prisma
- `apps/backend/src/scheduler/scheduler.controller.ts` — async/await
- `apps/backend/src/ai/ai.service.ts` — migrado para Prisma (log)
- `apps/backend/src/ai/ai.controller.ts` — async/await
- `apps/backend/src/calendar/calendar.service.ts` — async (delegação)
- `apps/web/components/layout/Sidebar.tsx` — +link Páginas

### Migrações Prisma
- `apps/backend/prisma/migrations/20260709181125_init/migration.sql`
- `apps/backend/prisma/migrations/20260709182748_add_pages_blocks/migration.sql`

---

## Decisões

- **SQLite para dev**: Mais simples de rodar sem infra extra. Schema pronto para trocar para Postgres com 1 linha.
- **MOCK_USER_ID**: Gambiarra intencional e documentada. Todos os models têm `userId` — quando auth real entrar, é só trocar a constante pelo ID do usuário autenticado.
- **Content como JSON string**: SQLite não suporta `Json` nativamente, então `content` é armazenado como `String` (JSON serializado). O service faz `JSON.parse`/`JSON.stringify` na entrada/saída. Com Postgres, pode-se trocar para `Json` nativo.
- **Páginas aninhadas via parentId**: Auto-relacionamento no Prisma. A listagem mostra árvore expansível. Deletar um pai não deleta os filhos (`onDelete: SetNull` — filhos viram raiz).
- **dnd-kit em vez de Tiptap para drag-and-drop**: Tiptap é usado para edição de texto dentro dos blocos. dnd-kit cuida da reordenação entre blocos. São responsabilidades separadas.
- **task_ref e goal_ref linkam por ID**: Não duplicam dados — apenas referenciam. O frontend mostra o ID/título referenciado.
