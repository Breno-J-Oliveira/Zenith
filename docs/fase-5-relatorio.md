# Fase 5 — Calendário & Planejamento

## Status: ✅ Concluída

## Objetivo

Implementar visualização de calendário com drag-and-drop, visão "Hoje" com lista do dia, e briefing diário gerado por IA. O calendário agrega eventos de 3 fontes (tasks de metas, tasks de rotina, compromissos) num único endpoint, e o reagendamento via drag-and-drop reaproveita a heurística de reorganização do SchedulerService.

---

## O que foi implementado

### 1. Instalação de dependências

`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction` instalados no `apps/web`.

### 2. Backend — Calendar Module (`apps/backend/src/calendar/`)

**`calendar.service.ts`** — Agregador de eventos:
- `getEvents(from, to)` — combina 3 fontes num formato único `CalendarEvent`:
  - Tasks de metas (GoalsService.getTasks) → `type: 'task'`
  - Tasks de rotina geradas (RoutinesService.getGeneratedTasks) → `type: 'routine'` (com horário e duração)
  - Appointments (SchedulerService.findAll) → `type: 'appointment'` (com startTime/endTime)
  - Retorna `{ id, title, start, end, type, sourceId, done? }` ordenados por start
- `reschedule(dto)` — recebe `{ eventId, type, newStart, newEnd? }`:
  - Extrai `sourceId` do `eventId` (formato: `cal-rtask-xxx`, `cal-task-xxx`, `cal-appt-xxx`)
  - Para tasks de rotina: atualiza data e horário via `RoutinesService.updateGeneratedTask`
  - Verifica conflitos com outras tasks no novo dia/horário
  - Se houver conflito, move a task conflitada usando `findFreeSlotForDate` (mesma heurística "primeiro slot livre" do SchedulerService)
  - Retorna `{ event, moved[], message }` — mesma estrutura do ReorganizationResult

**`calendar.controller.ts`** — Endpoints:
- `GET /calendar?from=DATE&to=DATE` — lista eventos do período
- `PATCH /calendar/reschedule` — reagenda evento via drag-and-drop

### 3. Backend — Briefing Diário (`GET /ai/briefing`)

**`ai.service.ts`** — Método `getBriefing()`:
- Coleta dados do dia: tasks de rotina geradas para hoje, tasks de metas com data de hoje, appointments de hoje, metas ativas com progresso, rotinas ativas
- **Tenta Gemini primeiro**: envia prompt com contexto estruturado, pede briefing curto (máx 3 frases) e amigável
- **Fallback determinístico**: se Gemini falhar ou não estiver disponível, gera template: `"Bom dia! Você tem N itens hoje, incluindo X às Y. Sua meta 'Z' está em P% — continue assim!"`
- Retorna `{ text, source: 'gemini' | 'template' }`

**Decisão**: Briefing exibido no topo da página `/hoje` (não no dashboard), porque `/hoje` é a página de visão diária — o briefing faz mais sentido ali como saudação inicial do dia.

### 4. Frontend — Página `/calendario`

**`components/calendar/CalendarView.tsx`**:
- FullCalendar com 3 views: `dayGridMonth`, `timeGridWeek`, `timeGridDay`
- Busca dados via `GET /calendar` ao trocar de view/período (`datesSet`)
- Drag-and-drop habilitado (`editable`, `droppable`, `eventResizableFromStart`)
- Ao soltar evento (`eventDrop`/`eventResize`): chama `PATCH /calendar/reschedule`
- Se resposta incluir `moved` com itens, dispara callback `onReorgMessage`
- Estilização via CSS variables do tema (sem hex fixo) — injetado via `<style>`
- Cores por tipo: task=primary, routine=text-dim, appointment=violet

**`components/calendar/EventBadge.tsx`**:
- Badge compacto com label e cor por tipo (Tarefa/Rotina/Compromisso)
- Estado `done` com opacidade reduzida

**`app/calendario/page.tsx`**:
- ShellLayout + título
- Toast de reorganização (mesmo padrão do QuickInput) — banner com borda primary, ícone, mensagem
- Legenda com EventBadge para cada tipo
- CalendarView em container com surface-1

### 5. Frontend — Página `/hoje`

**`app/hoje/page.tsx`**:
- Busca paralela: `GET /calendar?from=today&to=today` + `GET /ai/briefing`
- Briefing exibido no topo em card destacado com badge "BRIEFING · IA" ou "BRIEFING · template"
- Lista de itens do dia ordenados por horário
- Cada item: checkbox (toggle done via `PATCH /tasks/:id/toggle`), título, horário, EventBadge
- Checkbox desabilitado para appointments (não são tasks)
- Estado vazio: "Nada agendado para hoje"

### 6. Sidebar atualizada

Links adicionados: `Hoje` → `/hoje`, `Calendário` → `/calendario` (entre Dashboard e Metas)

---

## Testes

### Teste 1: Drag-and-drop com conflito

```
1. Rotina "Estudar React" criada — diária, 10:00, 60min
2. Rotina "Academia" criada — diária, 11:00, 60min
3. Tasks geradas para hoje
4. PATCH /calendar/reschedule: mover "Estudar React" para 11:00
   → Conflito com "Academia" (11:00-12:00)
   → "Academia" movida para 12:00 (depois do conflito: 11h + 60min = 12h)
   → message: "Reorganizei sua rotina do dia 09/07/2026. Academia movida para 12:00."
```

**Consistência verificada**: O SchedulerService (Fase 4) também usa o mesmo ConflictResolver. Ao criar um appointment "Dentista" 14h-15h que conflita com rotina "Leitura" 14h-15h, a tarefa é movida para 15:00 (depois do conflito) — mesma heurística adjacente, não 00:00.

### Teste 2: Briefing com Gemini

```
GET /ai/briefing
→ {"text":"Bom dia! Hoje é dia de focar nas suas rotinas importantes: Academia e Estudar React. Aproveite para manter o ritmo e tenha um dia muito produtivo!","source":"gemini"}
```

### Teste 3: Briefing fallback (template)

Se Gemini não estiver disponível (sem API key ou erro), o código cai no template determinístico:
```
"Bom dia! Você tem N itens hoje, incluindo X às Y. Sua meta 'Z' está em P% — continue assim!"
```
Source: `"template"`. Não quebra — apenas gera texto simples.

### Teste 4: 10 rotas web

| Rota | Status |
|---|---|
| `/` | 307 (redirect → /login) |
| `/login` | 200 |
| `/register` | 200 |
| `/dashboard` | 200 |
| `/settings` | 200 |
| `/metas` | 200 |
| `/rotinas` | 200 |
| `/calendario` | 200 (nova) |
| `/hoje` | 200 (nova) |
| `/relatorio` | 200 |

---

## Arquivos criados/modificados

### Criados (8 arquivos)
- `apps/backend/src/shared/conflict-resolver.service.ts` — heurística única de resolução de conflito (depois→antes)
- `apps/backend/src/calendar/calendar.module.ts`
- `apps/backend/src/calendar/calendar.service.ts` — agregador + reschedule com reorganização
- `apps/backend/src/calendar/calendar.controller.ts` — GET /calendar + PATCH /calendar/reschedule
- `apps/web/components/calendar/CalendarView.tsx` — FullCalendar com drag-and-drop
- `apps/web/components/calendar/EventBadge.tsx` — badge por tipo de evento
- `apps/web/app/calendario/page.tsx` — página de calendário
- `apps/web/app/hoje/page.tsx` — página de visão diária + briefing

### Modificados (7 arquivos)
- `apps/backend/src/app.module.ts` — +CalendarModule
- `apps/backend/src/scheduler/scheduler.service.ts` — usa ConflictResolver (remove findFreeSlot/overlapsAny/toMinutes/fromMinutes privados)
- `apps/backend/src/scheduler/scheduler.module.ts` — +ConflictResolver provider/export
- `apps/backend/src/calendar/calendar.module.ts` — +ConflictResolver provider
- `apps/backend/src/ai/ai.module.ts` — +GoalsModule (para briefing)
- `apps/backend/src/ai/ai.service.ts` — +GoalsService injection + getBriefing()
- `apps/backend/src/ai/ai.controller.ts` — +GET /ai/briefing
- `apps/web/components/layout/Sidebar.tsx` — +2 links (Hoje, Calendário)

---

## Decisões

- **Briefing no `/hoje` em vez do dashboard**: `/hoje` é a página de visão diária — o briefing como saudação inicial faz mais sentido ali. O dashboard mantém o QuickInput e gráficos.
- **ConflictResolver compartilhado**: A lógica de "achar slot livre" foi extraída para `apps/backend/src/shared/conflict-resolver.service.ts` — um serviço NestJS injetável que ambos `SchedulerService` e `CalendarService` usam. A heurística é única: "depois do conflito → antes do conflito" (adjacente ao conflito, não varredura de 00:00). Isso garante consistência: não importa se o conflito vem de um appointment criado via IA ou de um drag-and-drop no calendário, a tarefa movida vai para o horário mais próximo, não para meia-noite.
- **Appointments não são editáveis via drag-and-drop**: `editable: false` no FullCalendar para eventos do tipo appointment. Reagendar compromissos é uma operação mais complexa (deve disparar reorganização de rotinas) e fica para refino futuro.
- **EventId com prefixo de tipo**: `cal-task-xxx`, `cal-rtask-xxx`, `cal-appt-xxx` — permite extrair o tipo e sourceId no backend sem campo extra no DTO.

## Pendências

- **Reagendar appointments via drag-and-drop**: atualmente retorna mensagem "não pode ser reagendado ainda". Fica para fase futura.
- **Visualização de conflito no calendário**: não há indicador visual de conflito antes de soltar o evento (após soltar, a reorganização acontece). Fica para refino.
- **Briefing no dashboard**: decidido colocar no `/hoje`, mas pode ser adicionado ao dashboard também se o usuário preferir.
- **Persistência**: dados em memória, consistente com fases anteriores.
