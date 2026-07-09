# Zenith — Organização Pessoal com IA

Aplicação fullstack de produtividade pessoal inspirada no Notion, com a IA como **orquestradora central**. O usuário interage por linguagem natural (texto ou voz) e a IA entende, categoriza, agenda e reorganiza tudo automaticamente.

## Status

**Fase 0 — Fundação** ✅ Concluída
**Fase 1 — UI Shell + Telas Mock** ✅ Concluída
**Fase 2 — Quick Input + IA (núcleo)** ✅ Concluída

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
│   │   │   ├── metas/            # Placeholder
│   │   │   └── relatorio/        # Placeholder
│   │   ├── components/           # Header, Sidebar, Footer, ShellLayout, QuickInput
│   │   └── lib/utils.ts          # cn() helper
│   └── backend/      # NestJS (porta 3002)
│       └── src/
│           ├── main.ts           # Bootstrap
│           ├── app.module.ts
│           ├── app.controller.ts # GET / + GET /health
│           ├── app.service.ts
│           └── ai/               # Módulo AI
│               ├── ai.module.ts
│               ├── ai.controller.ts  # POST /ai/parse + GET /ai/log
│               └── ai.service.ts     # MockAIProvider + log em memória
├── packages/
│   └── shared/
│       └── src/
│           ├── types/index.ts        # User, Session, AuthProvider, AIIntent, ParsedAIResult, AILogEntry
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

Usa `MockAIProvider` com parsing determinístico por keywords/regex. Identifica intents: `LOG_EXPENSE`, `CREATE_EVENT`, `CREATE_GOAL`, `CREATE_TASK`, `UNKNOWN`. Backend expõe `POST /ai/parse` e `GET /ai/log`. Integração com OpenAI API (GPT-4o-mini) será feita quando houver API key disponível.

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
- [x] **Fase 2** — Quick Input + IA: MockAIProvider, POST /ai/parse, QuickInput no dashboard
- [ ] **Fase 3** — Metas, Marcos & Tarefas
- [ ] **Fase 4** — Rotinas & Reorganização Adaptativa
- [ ] **Fase 5** — Calendário & Planejamento
- [ ] **Fase 6** — Sistema de Blocos (Notion-like)
- [ ] **Fase 7** — Gastos & Integração Dashboard Financeiro
- [ ] **Fase 8** — Notificações & Lembretes
- [ ] **Fase 9** — Fotos & Temas
- [ ] **Fase 10** — Polimento & Deploy