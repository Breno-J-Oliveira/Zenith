# Fase 4 — Rotinas & Reorganização Adaptativa

## Status: ✅ Concluída

## Objetivo

Implementar rotinas recorrentes, compromissos pontuais, e o núcleo adaptativo: quando um compromisso conflita com uma rotina já agendada, o sistema reorganiza automaticamente e notifica o usuário.

---

## O que foi implementado

### 1. Tipos compartilhados (`packages/shared/src/types/index.ts`)

- `AIIntent` estendido: `CREATE_ROUTINE`, `CREATE_APPOINTMENT` (além dos existentes)
- `RoutinePayload`: title, frequency, time, duration
- `AppointmentPayload`: title, date, startTime, endTime
- `Routine`: id, title, frequency (daily/weekly/monthly), time, duration, active, adaptable, createdAt
- `Appointment`: id, title, date, startTime, endTime, createdAt
- `ReorganizationResult`: appointment, moved[], message
- `MovedTask`: taskId, taskTitle, from {date, time}, to {date, time}
- DTOs: `CreateRoutineDTO`, `UpdateRoutineDTO`, `CreateAppointmentDTO`

### 2. Backend — Routines Module (`apps/backend/src/routines/`)

**`routines.service.ts`** — Armazenamento em memória:
- `create(dto)` — cria rotina com defaults (frequency: daily, duration: 60min, active: true, adaptable: true)
- `findAll(filter?)` — lista com filtro opcional por active
- `findOne(id)` — busca por ID
- `update(id, dto)` — atualiza campos parciais (inclui toggle active)
- `remove(id)` — deleta rotina + tasks geradas
- `generateTasks(routineId, days)` — gera Task[] para N dias conforme frequency:
  - **daily**: todo dia
  - **weekly**: 1x por semana no mesmo dia da semana do createdAt
  - **monthly**: 1x por mês no mesmo dia do mês do createdAt
- `getTasksForDate(date)` — retorna tasks geradas para uma data específica (usado pelo Scheduler)
- `updateGeneratedTask(id, updates)` — atualiza task gerada (usado para mover horário)

**`routines.controller.ts`** — Endpoints:
- `POST /routines` — criar rotina
- `GET /routines?active=true` — listar com filtro
- `GET /routines/:id` — buscar por ID
- `PATCH /routines/:id` — atualizar (toggle active, mudar horário, etc)
- `DELETE /routines/:id` — deletar
- `POST /routines/:id/generate-tasks?days=7` — gerar tarefas para N dias

### 3. Backend — Scheduler Module (`apps/backend/src/scheduler/`)

**`scheduler.service.ts`** — O núcleo desta fase:

#### Heurística de reorganização

Quando `createAppointment(dto)` é chamado:
1. Cria o Appointment
2. Busca todas as tasks de rotina geradas para a mesma data
3. Para cada task, verifica conflito de horário (sobreposição de intervalos)
4. Se houver conflito, tenta realocar:

**Regra de realocação (determinística):**
1. **Tenta depois**: `candidateStart = appointment.endTime`, `candidateEnd = candidateStart + duration`
   - Se `candidateEnd <= 23:59` e não sobrepõe com outras tasks/appointments → move
2. **Tenta antes**: `candidateEnd = appointment.startTime`, `candidateStart = candidateEnd - duration`
   - Se `candidateStart >= 00:00` e não sobrepõe → move
3. Se nenhuma opção couber, mantém a task (não move)

**Exemplo (do ANOTAÇÕES.md):**

```
Cenário:
  Rotina: Estudar React, diária, 14:00, 120min (14h-16h)
  Compromisso: Reunião, 2026-07-09, 14:00-16:00

Conflito detectado: 14h-16h vs 14h-16h (sobreposição total)

Tentativa 1 (depois): 16:00 + 120min = 18:00 → 16h-18h → livre ✓
→ Task "Estudar React" movida de 14:00 para 16:00

Resultado:
  appointment: { title: "Reuniao importante", date: "2026-07-09", startTime: "14:00", endTime: "16:00" }
  moved: [{ taskId: "...", taskTitle: "Estudar React", from: { date: "2026-07-09", time: "14:00" }, to: { date: "2026-07-09", time: "16:00" } }]
  message: "Reorganizei sua rotina do dia 09/07. Estudar React movida para 16:00. Ok?"
```

**`scheduler.controller.ts`** — Endpoints:
- `POST /appointments` — cria compromisso + dispara reorganizeDay, retorna `ReorganizationResult`
- `GET /appointments` — lista compromissos

### 4. AI Parser — Gemini + dispatch

**`gemini.provider.ts`** — Prompt atualizado:
- Novos intents: `CREATE_ROUTINE`, `CREATE_APPOINTMENT`
- Exemplos adicionados: "estudar React das 19h às 21h todo dia" → CREATE_ROUTINE; "reunião dia 23 das 14h às 16h" → CREATE_APPOINTMENT
- Diferenciação explícita no prompt: TASK vs GOAL, ROUTINE vs APPOINTMENT
- `validatePayload` estendido para CREATE_ROUTINE e CREATE_APPOINTMENT

**`ai.service.ts`** — Dispatch automático:
- `CREATE_ROUTINE` → chama `routinesService.create()` internamente
- `CREATE_APPOINTMENT` → chama `schedulerService.createAppointment()` internamente (já dispara reorganização)
- Retorna `sideEffect` no response: `{ type: 'routine_created', routine }` ou `{ type: 'appointment_created', reorganization: ReorganizationResult }`
- CREATE_GOAL e CREATE_TASK continuam funcionando (não foram alterados)

**`ai.module.ts`** — Importa `RoutinesModule` e `SchedulerModule` para injeção de dependência.

### 5. Frontend

**`app/rotinas/page.tsx`** (nova página):
- Lista de rotinas com cards (título, frequência, horário, duração)
- Toggle ATIVA/PAUSADA
- Botão "Gerar 7 dias" (chama `POST /routines/:id/generate-tasks?days=7`)
- Form de criar rotina (título, frequência, horário, duração)
- Excluir rotina
- Mesmo padrão visual de `/metas`

**`components/layout/Sidebar.tsx`** — Adicionado link "Rotinas" → `/rotinas`

**`components/ai/QuickInput.tsx`** — Atualizado:
- Não faz mais POST manual para /goals e /tasks (backend já despacha via sideEffect)
- Processa `sideEffect` do response do `/ai/parse`
- Quando `sideEffect.type === 'appointment_created'` e há `reorganization.message`, mostra **toast de reorganização** com a mensagem no estilo do ANOTAÇÕES.md
- Toast: banner com borda primary, ícone de reorganização, mensagem "Reorganizei sua rotina do dia X. [Tarefa] movida para [novo horário]. Ok?"
- Auto-fecha em 8 segundos, ou manualmente via botão ✕
- Histórico de ações também mostra a mensagem de reorganização inline

---

## Teste do cenário completo

### Cenário 1: Reorganização com conflito real

```
1. POST /routines → { title: "Estudar React", frequency: "daily", time: "14:00", duration: 120 }
   → Rotina criada: routine-xxx

2. POST /routines/xxx/generate-tasks?days=7
   → 7 tasks geradas (uma por dia, 14h-16h)

3. POST /appointments → { title: "Reuniao importante", date: "2026-07-09", startTime: "14:00", endTime: "16:00" }
   → Conflito detectado: task "Estudar React" 14h-16h vs compromisso 14h-16h
   → Task movida para 16:00 (depois do compromisso)
   → message: "Reorganizei sua rotina do dia 09/07. Estudar React movida para 16:00. Ok?"
```

### Cenário 2: Via IA (Quick Input)

```
1. POST /ai/parse → "estudar portugues das 10h as 11h todo dia"
   → intent: CREATE_ROUTINE (confidence: 0.95, source: gemini)
   → sideEffect: { type: 'routine_created', routine: { title: "Estudar português", frequency: "daily", time: "10:00", duration: 60 } }

2. POST /ai/parse → "consulta medica dia 10 das 10h as 11h"
   → intent: CREATE_APPOINTMENT (confidence: 0.95, source: gemini)
   → sideEffect: { type: 'appointment_created', reorganization: { moved: [], message: "Compromisso criado para 10/07. Nenhuma rotina conflitante encontrada." } }
   (sem conflito porque a rotina de português ainda não tinha tasks geradas para o dia 10)
```

### Cenário 3: Rotas web

| Rota | Status |
|---|---|
| `/` | 307 (redirect → /login) |
| `/login` | 200 |
| `/register` | 200 |
| `/dashboard` | 200 |
| `/settings` | 200 |
| `/metas` | 200 |
| `/rotinas` | 200 (nova) |
| `/relatorio` | 200 |

---

## Arquivos criados/modificados

### Criados (7 arquivos)
- `apps/backend/src/routines/routines.module.ts`
- `apps/backend/src/routines/routines.service.ts`
- `apps/backend/src/routines/routines.controller.ts`
- `apps/backend/src/scheduler/scheduler.module.ts`
- `apps/backend/src/scheduler/scheduler.service.ts`
- `apps/backend/src/scheduler/scheduler.controller.ts`
- `apps/web/app/rotinas/page.tsx`

### Modificados (7 arquivos)
- `packages/shared/src/types/index.ts` — +7 interfaces, +2 intents, +2 payloads
- `apps/backend/src/app.module.ts` — +2 imports (RoutinesModule, SchedulerModule)
- `apps/backend/src/ai/ai.module.ts` — +2 imports (RoutinesModule, SchedulerModule)
- `apps/backend/src/ai/ai.service.ts` — injeção + dispatch CREATE_ROUTINE/CREATE_APPOINTMENT
- `apps/backend/src/ai/gemini.provider.ts` — prompt + validateResult + validatePayload
- `apps/backend/src/ai/ai.controller.ts` — return type ajustado
- `apps/web/components/ai/QuickInput.tsx` — sideEffect + toast de reorganização
- `apps/web/components/layout/Sidebar.tsx` — +1 link (Rotinas)

---

## Decisões

- **Heurística simples e determinística**: depois do compromisso → antes do compromisso → mantém. Não usa IA para decidir horário, apenas código normal. A IA só identifica o intent.
- **SideEffect no ai.service**: O dispatch de CREATE_ROUTINE e CREATE_APPOINTMENT acontece dentro do ai.service, não no frontend. O response inclui o `sideEffect` para o frontend exibir feedback (toast, ✓).
- **QuickInput simplificado**: Não faz mais POST manual para /goals e /tasks. O backend despacha tudo. O frontend apenas exibe o resultado.
- **Tasks de rotina vs tasks de goals**: Tasks de rotina são armazenadas no RoutinesService (separado do GoalsService). Não há vínculo entre elas. Em fase futura, pode-se unificar.
- **generateTasks como endpoint separado**: O usuário decide quando gerar tasks (botão "Gerar 7 dias"). Não é automático na criação da rotina.

## Pendências

- **Persistência**: Dados em memória — perdem ao reiniciar backend.
- **Aceitar/recusar reorganização**: O toast mostra a mensagem mas não tem botão de aceitar/recusar. Fica para fase futura.
- **SET_REMINDER e DAILY_BRIEFING**: Fora de escopo desta fase, conforme especificado.
- **Visualização de horários no dia**: Não há tela de agenda/calendário mostrando os horários das tasks de rotina e compromissos lado a lado. Fica para Fase 5 (Calendário & Planejamento).
- **Tasks de rotina no dashboard**: O dashboard conta tasks do GoalsService, não do RoutinesService. Integrar contagem em refino futuro.
