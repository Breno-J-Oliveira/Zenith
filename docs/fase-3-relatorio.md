# Fase 3 — Metas, Marcos & Tarefas

## Status: ✅ Concluída

## Objetivo

Implementar CRUD completo de metas, marcos (milestones) e tarefas, com vinculação entre eles, progresso visual e filtros.

---

## O que foi implementado

### 1. Tipos compartilhados (`packages/shared/src/types/index.ts`)

Adicionados ao final do arquivo:

- `GoalStatus`: `ACTIVE | COMPLETED | PAUSED | CANCELLED`
- `GoalCategory`: `pessoal | trabalho | financeiro | saude | estudo`
- `TaskStatus`: `ACTIVE | COMPLETED | CANCELLED`
- `Milestone`: id, goalId, title, deadline, completed, createdAt
- `Task`: id, goalId?, milestoneId?, title, description?, status, date?, completed, createdAt
- `Goal`: id, title, description?, category, priority, status, deadline?, milestones[], tasks[], createdAt, updatedAt
- DTOs: `CreateGoalDTO`, `UpdateGoalDTO`, `CreateMilestoneDTO`, `CreateTaskDTO`, `UpdateTaskDTO`

### 2. Backend — Goals Module (`apps/backend/src/goals/`)

**`goals.service.ts`** — Armazenamento em memória (arrays):
- `create(dto)` — cria goal com defaults (categoria: pessoal, prioridade: média, status: ACTIVE)
- `findAll(filter?)` — lista com filtro opcional por status e categoria
- `findOne(id)` — busca por ID, lança 404 se não existir
- `update(id, dto)` — atualiza campos parciais
- `remove(id)` — deleta goal + remove tasks vinculadas
- `getProgress(goalId)` — calcula % baseado em milestones + tasks completados
- `addMilestone(goalId, dto)` — adiciona marco à meta
- `toggleMilestone(goalId, milestoneId)` — alterna completed
- `removeMilestone(goalId, milestoneId)` — remove marco
- `addTask(task)` / `removeTask(id)` — gerencia tasks vinculadas

**`goals.controller.ts`** — Endpoints:
- `POST /goals` — criar meta
- `GET /goals?status=X&category=Y` — listar com filtros
- `GET /goals/:id` — buscar por ID
- `PUT /goals/:id` — atualizar
- `DELETE /goals/:id` — deletar
- `GET /goals/:id/progress` — progresso %
- `POST /goals/:id/milestones` — adicionar marco
- `PATCH /goals/:id/milestones/:mid/toggle` — toggle marco
- `DELETE /goals/:id/milestones/:mid` — remover marco

### 3. Backend — Tasks Module (`apps/backend/src/tasks/`)

**`tasks.service.ts`** — Depende de `GoalsService`:
- `create(dto)` — cria task, vincula à goal se `goalId` informado
- `findAll(filter?)` — lista com filtro por goalId e status
- `findOne(id)` — busca por ID
- `update(id, dto)` — atualiza campos parciais
- `toggle(id)` — alterna completed + status
- `remove(id)` — remove task + desvincula da goal

**`tasks.controller.ts`** — Endpoints:
- `POST /tasks` — criar tarefa
- `GET /tasks?goalId=X&status=Y` — listar com filtros
- `GET /tasks/:id` — buscar por ID
- `PUT /tasks/:id` — atualizar
- `PATCH /tasks/:id/toggle` — toggle conclusão
- `DELETE /tasks/:id` — deletar

### 4. Web — Página de Metas (`apps/web/app/metas/page.tsx`)

Substituiu o placeholder "Em breve" por implementação completa:
- **Cards expansíveis** com click para expandir/recolher
- **Barra de progresso** por meta (calculada no frontend: milestones + tasks)
- **Badges** de categoria e status
- **Indicador de prioridade** (ponto colorido)
- **Filtros** por status e categoria (selects)
- **Form de criar meta** com título, descrição, categoria, prioridade, deadline
- **Controles de status** inline (ACTIVE, COMPLETED, PAUSED, CANCELLED)
- **Lista de marcos** com checkbox toggle + adicionar + remover
- **Lista de tarefas** com checkbox toggle + adicionar + remover
- **Excluir meta** com botão na seção expandida

### 5. Web — Dashboard (`apps/web/app/dashboard/page.tsx`)

- "METAS ATIVAS" agora busca contagem real de `GET /goals?status=ACTIVE`
- "TAREFAS" busca contagem real de `GET /tasks`
- Fallback para 0 se backend offline

---

## Endpoints testados

| Endpoint | Método | Resultado |
|---|---|---|
| `/goals` | POST | Goal criado com ID, defaults aplicados |
| `/goals` | GET | Lista de goals com milestones e tasks aninhados |
| `/goals?status=ACTIVE` | GET | Filtra apenas metas ativas |
| `/goals?category=financeiro` | GET | Filtra por categoria |
| `/goals/:id` | GET | Goal específico com relações |
| `/goals/:id` | PUT | Atualiza campos parciais |
| `/goals/:id` | DELETE | Remove goal + tasks vinculadas |
| `/goals/:id/progress` | GET | Retorna `{ progress: N }` |
| `/goals/:id/milestones` | POST | Adiciona marco |
| `/goals/:id/milestones/:mid/toggle` | PATCH | Alterna completed |
| `/goals/:id/milestones/:mid` | DELETE | Remove marco |
| `/tasks` | POST | Cria task, vincula à goal se goalId |
| `/tasks` | GET | Lista tasks |
| `/tasks/:id/toggle` | PATCH | Alterna completed + status |
| `/tasks/:id` | DELETE | Remove task + desvincula da goal |
| `/health` | GET | 200 — Fases 0/1/2 intactas |
| `/ai/parse` | POST | Funcionando — Gemini + fallback |

---

## Decisões

- **Armazenamento em memória**: Mesmo padrão da Fase 2 (AILog). Prisma + Postgres em fase futura.
- **Tasks vinculadas a Goals via GoalsService**: TasksService delega para GoalsService para manter consistência das relações. GoalsModule exporta GoalsService.
- **Progresso calculado no backend**: `getProgress()` soma milestones + tasks completados / total. Frontend replica o cálculo para atualização instantânea sem refetch.
- **Prioridade como string** (`baixa|media|alta`) em vez de número (1-5 do Prisma schema): Mais simples para UI, conversível depois.
- **Filtros via query params**: `?status=X&category=Y` para goals, `?goalId=X&status=Y` para tasks.

## Pendências

- **Persistência**: Dados em memória — perdem ao reiniciar backend. Prisma + Postgres em fase futura.
- **IA → CRUD**: Quando o Quick Input retornar CREATE_GOAL ou CREATE_TASK, ainda não cria automaticamente no backend. Conectar `/ai/parse` ao `GoalsService` e `TasksService` em refino futuro.
- **Editar título de marcos**: Atualmente só toggle e delete. Editar título fica para refino.
- **Drag-and-drop**: Reordenar marcos e tarefas dentro da meta — fase futura com sistema de blocos.
- **Dívida técnica — import direto**: Mesma da Fase 2 (backend importa de `shared/src/types` diretamente).
