# Zenith — Organização Pessoal com IA

Aplicação fullstack de produtividade pessoal inspirada no Notion, com a IA como **orquestradora central**. O usuário interage por linguagem natural (texto ou voz) e a IA entende, categoriza, agenda e reorganiza tudo automaticamente.

## Status

**Fase 0 — Fundação** ✅ Concluída
**Fase 1 — UI Shell + Telas Mock** ✅ Concluída
**Fase 2 — Quick Input + IA (núcleo)** ✅ Concluída
**Fase 3 — Metas, Marcos & Tarefas** ✅ Concluída
**Fase 4 — Rotinas & Reorganização Adaptativa** ✅ Concluída
**Fase 5 — Calendário & Planejamento** ✅ Concluída

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Web | Next.js 14+ (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Backend | NestJS, Node.js |
| Gráficos | Recharts |
| Monorepo | Turborepo |
| Pacote compartilhado | @zenith/shared (tipos, auth mock, AI mock, tema, logo) |

## Estrutura

```
zenith/
├── apps/
│   ├── web/          # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/login/     # Tela de login (mock)
│   │   │   ├── (auth)/register/  # Tela de cadastro (mock)
│   │   │   ├── dashboard/        # Dashboard com QuickInput + gráficos
│   │   │   ├── settings/         # Configurações + seletor de tema
│   │   │   ├── metas/            # CRUD de metas + marcos + tarefas
│   │   │   ├── rotinas/          # CRUD de rotinas + gerar tarefas
│   │   │   ├── calendario/       # FullCalendar com drag-and-drop
│   │   │   ├── hoje/             # Visão do dia + briefing IA
│   │   │   └── relatorio/        # Placeholder
│   │   ├── components/           # Header, Sidebar, Footer, ShellLayout, QuickInput
│   │   └── lib/utils.ts          # cn() helper
│   └── backend/      # NestJS (porta 3002)
│       └── src/
│           ├── main.ts           # Bootstrap
│           ├── app.module.ts
│           ├── app.controller.ts # GET / + GET /health
│           ├── app.service.ts
│           ├── ai/               # Módulo AI (Gemini + Mock fallback)
│           │   ├── ai.module.ts
│           │   ├── ai.controller.ts  # POST /ai/parse + GET /ai/log
│           │   ├── ai.service.ts     # GeminiProvider + fallback MockAIProvider
│           │   └── gemini.provider.ts # Google Gemini SDK (gemini-2.5-flash)
│           ├── goals/            # Módulo Metas + Marcos
│           │   ├── goals.module.ts
│           │   ├── goals.controller.ts  # CRUD /goals + /goals/:id/milestones
│           │   └── goals.service.ts     # Lógica + progress + milestones
│           └── tasks/            # Módulo Tarefas
│               ├── tasks.module.ts
│               ├── tasks.controller.ts  # CRUD /tasks + /tasks/:id/toggle
│               └── tasks.service.ts
│           ├── routines/         # Módulo Rotinas
│           │   ├── routines.module.ts
│           │   ├── routines.controller.ts  # CRUD /routines + /routines/:id/generate-tasks
│           │   └── routines.service.ts     # Geração de tasks por frequência
│           └── scheduler/        # Módulo Reorganização Adaptativa
│               ├── scheduler.module.ts
│               ├── scheduler.controller.ts  # POST /appointments (cria + reorganiza)
│               └── scheduler.service.ts     # Heurística de realocação de conflitos
│           └── calendar/         # Módulo Calendário (agregador)
│               ├── calendar.module.ts
│               ├── calendar.controller.ts   # GET /calendar + PATCH /calendar/reschedule
│               └── calendar.service.ts      # Agrega tasks+rotinas+compromissos, reschedule com reorganização
├── packages/
│   └── shared/
│       └── src/
│           ├── types/index.ts        # User, Session, AIIntent, ParsedAIResult, AILogEntry, Goal, Milestone, Task, Routine, Appointment, ReorganizationResult, DTOs
│           ├── auth/index.ts         # MockAuthProvider
│           ├── ai/index.ts           # MockAIProvider (parsing determinístico)
│           ├── theme/tokens.css      # CSS variables (paletas red/violet/green)
│           ├── components/Logo.tsx   # Logo SVG temável
│           └── index.ts              # Export público
├── assets/svg/       # SVGs originais (logo, ilustrações)
├── docs/             # Relatórios e documentação
├── package.json      # Turborepo root
└── turbo.json
```

## Tema

O sistema de temas usa CSS variables com `data-theme` no `<html>`:

- **red** (padrão): `#FF2B51`
- **violet**: `#6C4CFF`
- **green**: `#00CC44`

A troca é instantânea via JavaScript — sem reload. Todas as cores (logo, botões, acentos, gráficos) usam `var(--color-primary)`.

## Tipografia

- **Orbitron** — títulos e headings
- **Space Mono** — labels e números
- **Rajdhani** — corpo de texto

## Auth

Usa `MockAuthProvider` — sempre sucesso, sem chamadas de rede. Sessão persistida em `localStorage`. Auth real (NexusAuth) será integrada em fase futura.

## IA (Quick Input)

Usa `Google Gemini` (gemini-2.5-flash) como IA real, com `MockAIProvider` como fallback automático. Identifica intents: `LOG_EXPENSE`, `CREATE_EVENT`, `CREATE_GOAL`, `CREATE_TASK`, `CREATE_ROUTINE`, `CREATE_APPOINTMENT`, `UNKNOWN`. Backend despacha CREATE_GOAL → /goals, CREATE_TASK → /tasks, CREATE_ROUTINE → /routines, CREATE_APPOINTMENT → /appointments (com reorganização) automaticamente. Response inclui `sideEffect` com resultado da persistência.

## Metas, Marcos & Tarefas

Backend expõe CRUD completo:
- `POST/GET/PUT/DELETE /goals` — metas com categoria, prioridade, status e deadline
- `POST/GET /goals/:id/milestones` — marcos vinculados a metas
- `PATCH /goals/:id/milestones/:mid/toggle` — alternar conclusão de marco
- `GET /goals/:id/progress` — progresso percentual (marcos + tarefas)
- `POST/GET/PUT/DELETE /tasks` — tarefas independentes ou vinculadas a metas
- `PATCH /tasks/:id/toggle` — alternar conclusão de tarefa

Página `/metas` com cards expansíveis, barra de progresso, filtros por status e categoria, criação de metas/marcos/tarefas inline.

## Rotinas & Reorganização Adaptativa

Backend expõe:
- `POST/GET/PATCH/DELETE /routines` — rotinas recorrentes (daily/weekly/monthly)
- `POST /routines/:id/generate-tasks?days=7` — gera tarefas para N dias conforme frequência
- `POST /appointments` — cria compromisso pontual + dispara reorganização automática
- `GET /appointments` — lista compromissos

**Heurística de reorganização**: quando um compromisso conflita com uma tarefa de rotina (sobreposição de horário), a tarefa é movida para o próximo horário livre no mesmo dia (tenta depois do compromisso, depois antes). Retorna `ReorganizationResult` com a lista de tarefas movidas e mensagem amigável.

Página `/rotinas` com lista de rotinas, toggle ativa/pausada, botão de gerar tarefas. QuickInput mostra toast de reorganização quando um compromisso conflita com rotina existente.

## Calendário & Planejamento

Backend expõe:
- `GET /calendar?from=DATE&to=DATE` — agrega eventos de 3 fontes (tasks de metas, tasks de rotina, appointments) num formato único
- `PATCH /calendar/reschedule` — reagenda evento via drag-and-drop, com reorganização automática de conflitos
- `GET /ai/briefing` — briefing diário gerado por Gemini (fallback determinístico se IA falhar)

Página `/calendario` com FullCalendar (mensal/semanal/diário), drag-and-drop de tarefas, cores por tipo de evento, toast de reorganização em cascata. Página `/hoje` com lista do dia ordenada por horário, checkboxes para marcar done, e briefing da IA no topo.

## Como rodar

```bash
# Instalar dependências (raiz)
npm install

# Rodar web app (porta 3000)
cd apps/web && npm run dev

# Rodar backend (porta 3002)
cd apps/backend && npm run dev
```

## Fases

- [x] **Fase 0** — Fundação: monorepo, tema, MockAuthProvider, Logo, backend skeleton
- [x] **Fase 1** — UI Shell + telas mock: login, dashboard, settings, navegação
- [x] **Fase 2** — Quick Input + IA: MockAIProvider, POST /ai/parse, QuickInput no dashboard, Gemini real com fallback
- [x] **Fase 3** — Metas, Marcos & Tarefas: CRUD completo backend + frontend, progresso visual, filtros
- [x] **Fase 4** — Rotinas & Reorganização Adaptativa: rotinas recorrentes, compromissos, heurística de reorganização de conflitos, toast no QuickInput
- [x] **Fase 5** — Calendário & Planejamento: FullCalendar com drag-and-drop, visão Hoje com briefing da IA, reagendamento com reorganização em cascata
- [ ] **Fase 6** — Sistema de Blocos (Notion-like)
- [ ] **Fase 7** — Gastos & Integração Dashboard Financeiro
- [ ] **Fase 8** — Notificações & Lembretes
- [ ] **Fase 9** — Fotos & Temas
- [ ] **Fase 10** — Polimento & Deploy