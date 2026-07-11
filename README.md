# ✨ Zenith — Organização Pessoal com IA · Site + App PC + App Mobile

<p align="center">
  <img src="assets/svg/logo 16x9.svg" alt="Zenith Banner" width="640">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-F59E0B?style=for-the-badge&logo=clock&logoColor=white" alt="Status Em Desenvolvimento">
  <img src="https://img.shields.io/badge/Versão-0.8.0-2563EB?style=for-the-badge" alt="Versão 0.8.0">
  <img src="https://img.shields.io/badge/Fases%20Concluídas-15/30-10B981?style=for-the-badge" alt="Fases 15/30">
  <img src="https://img.shields.io/badge/Projeto-Portfólio%20Pessoal-111827?style=for-the-badge" alt="Projeto Pessoal">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14%2B-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo">
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Tauri-24C8D8?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
</p>

---

## 📑 Índice

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Funcionalidades Principais](#-funcionalidades-principais)
3. [Tecnologias e Bibliotecas](#-tecnologias-e-bibliotecas)
4. [Arquitetura](#-arquitetura)
5. [Modelo de Dados (Prisma)](#-modelo-de-dados-prisma)
6. [Endpoints da API](#-endpoints-da-api)
7. [Design System](#-design-system)
8. [Funcionalidades Extras](#-funcionalidades-extras)
9. [Como Rodar Localmente](#-como-rodar-localmente)
10. [Fases de Desenvolvimento](#-fases-de-desenvolvimento)
11. [Próximas Atualizações](#-próximas-atualizações)
12. [Autor](#-autor)
13. [Contatos e Redes Sociais](#-contatos-e-redes-sociais)

---

## 🎯 Sobre o Projeto

O **Zenith** é uma aplicação fullstack de produtividade pessoal, disponível em **três plataformas** (web, desktop e mobile), rodando sobre um backend único compartilhado. Inspirado no Notion, com um diferencial que nenhum Notion tem de verdade: a **IA como orquestradora central**, capaz de raciocinar, criar, editar e reorganizar qualquer parte do sistema por conta própria, como se fosse um assistente conversando com você.

A ideia original vem da **praticidade** — pegar o celular, anotar na hora e pronto. A IA organiza a maior parte de tudo. O usuário consegue **construir o próprio sistema de organização** dentro do Zenith — tabelas com colunas customizadas, galerias com capa de imagem, listas simples, páginas aninhadas — exatamente como no Notion pessoal.

O foco em **UX/UI precisa ser surpreendente** — qualquer pessoa, independente do quanto entende de tecnologia, precisa conseguir abrir o Zenith e entender o que fazer em segundos.

O projeto foi desenvolvido como **projeto de portfólio pessoal** (solo), demonstrando conhecimento profundo de fullstack em 3 plataformas, sistema de dados flexível, IA como agente real e product thinking documentado.

### Três Pilares do Produto

1. **Motor de Organização Flexível** — um sistema de páginas e bancos de dados genéricos (propriedades tipadas, múltiplas visualizações) que permite ao usuário montar qualquer estrutura de organização que quiser, sem estar preso a modelos fixos.
2. **IA Orquestradora Real** — um agente conversacional com acesso a ferramentas (function calling), capaz de ler o estado atual do sistema, raciocinar sobre múltiplas informações numa única mensagem, e executar várias ações encadeadas.
3. **Experiência acessível e sem fricção** — em qualquer uma das três plataformas, o usuário deve conseguir organizar sua vida com o mínimo de esforço e o máximo de clareza visual.

### Princípios de Design
1. **Praticidade acima de tudo** — mínimo esforço do usuário, máximo trabalho da IA
2. **Flexibilidade real, não decoração** — o usuário molda o Zenith do jeito dele, sem telas fixas
3. **IA como agente, não como formulário disfarçado** — raciocínio multi-entidade, autonomia supervisionada
4. **Adaptativo** — a IA reorganiza rotina e agenda automaticamente quando imprevistos surgem
5. **Multiplataforma de verdade** — web, desktop e mobile, um único backend, uma única fonte de dados
6. **Acessibilidade e clareza acima de estética** — qualquer pessoa entende a interface em segundos

---

## ⚡ Funcionalidades Principais

### 🏠 Dashboard & Visão Geral
- **Resumo visual** de progresso de metas ativas, tarefas pendentes, próxima rotina e próximo compromisso
- **Gráfico de progresso semanal** com barras coloridas (verde ≥70%, vermelho 40-69%, cinza <40%)
- **Gráfico de distribuição por categoria** (PieChart interativo)
- **Citações motivacionais rotativas** (20 citações, aleatória a cada refresh)
- **Streak real** calculado do backend (dias consecutivos com tarefas concluídas)
- **Ações rápidas** para criar meta, rotina, página, database ou agendar compromisso
- **Saudação dinâmica** (Bom dia/Boa tarde/Boa noite)

### 📅 Painel "Hoje" & Timeline
- Visão do dia: tarefas, rotinas, compromissos e briefing da IA numa lista única ordenada por horário
- **Filtros por tipo** (Todos, Tarefas, Rotinas, Compromissos) com contadores
- **Indicador visual de atraso** (item que já passou do horário e não foi concluído)
- **Indicador "AGORA"** para o item atual com animação pulse
- **Briefing da IA** gerado por Gemini (com fallback em template)
- **Barra de progresso do dia** com percentual de conclusão
- **Marcar item como concluído** com um toque/clique

### 🎯 Metas, Marcos & Tarefas
- **CRUD completo** de Metas, Marcos e Tarefas
- **Barra de progresso automática** (calculada a partir de marcos/tarefas concluídas)
- **Filtros** por categoria, status e prazo
- **Cards expansíveis** com criação de milestones e tarefas inline
- **Stats overview** (Total, Em Progresso, Progresso Médio)

### 🔄 Rotinas & Reorganização Adaptativa
- Rotinas recorrentes (diária, semanal, mensal)
- **Geração automática de tarefas** a partir da rotina (7/14/30 dias)
- Ativar/desativar rotina sem excluí-la
- **ConflictResolver**: heurística de reorganização de conflitos de horário ("adjacente ao conflito": tenta depois, senão tenta antes)

### 📆 Calendário
- FullCalendar com **visões mensal, semanal e diária**
- **Drag-and-drop** para reagendar eventos (web/desktop)
- Cores por tipo de evento (tarefa, rotina, compromisso)
- **Reorganização adaptativa** ao arrastar eventos (resolve conflitos automaticamente)

### 🗄️ Motor de Database Flexível (Notion-like)
- Criar **bancos de dados** dentro de páginas: coleções de itens com **propriedades customizáveis**
- **Tipos de propriedade**: texto, número, moeda, data, checkbox, seleção única, seleção múltipla
- **Múltiplas visualizações** da mesma base de dados: **Tabela** (edição inline) e **Galeria** (cards com capa)
- **Páginas aninhadas** (hierarquia livre)
- **Presets prontos**: Finanças, Lista de Compras, Estudos, Hábitos
- Renomear, duplicar e excluir páginas/bases

### 💬 Chat com IA (Orquestradora)
- **Painel de chat persistente**, acessível de qualquer tela (botão flutuante)
- **Histórico de conversa** mantido (ChatThread + ChatMessage no banco)
- A IA pode **ler o estado atual** (metas, tarefas, rotinas, databases)
- A IA pode **executar múltiplas ações em uma única mensagem**
- **Sugestões de comandos** na tela inicial (ajuda, listar metas, criar tarefa, resumo do dia)
- **Ferramentas disponíveis**: list_goals, list_tasks, list_routines, create_goal, create_task, create_routine, get_today_summary, search
- **Timestamps** em cada mensagem com formatação relativa

### 🔍 Busca Global
- **Busca em tempo real** em metas, tarefas, rotinas, páginas e databases
- **Atalho Ctrl/Cmd+K** integrado no Header
- **Histórico de buscas recentes** (salvo no localStorage, até 5 itens)
- **Navegação por teclado** (↑↓ para navegar, Enter para abrir, Escape para fechar)
- **Resultados agrupados por tipo** com ícones e subtítulos

### ⚡ Command Palette
- **Atalho Ctrl/Cmd+Shift+P**
- Comandos de **navegação** (Dashboard, Hoje, Metas, Rotinas, Calendário, Páginas, Databases, Configurações)
- Comandos de **ações rápidas** (criar meta, tarefa, rotina, página, database)
- **Troca de tema** (Red, Violet, Green)
- **Tela cheia** e **recarregar página**
- **Atalhos de teclado visíveis** (⌘1-7)

### 🔔 Notificações
- **Painel de notificações** com filtros (Todas/Não lidas)
- **Marcar como lida** individualmente ou todas
- **Excluir notificações**
- **Badge de não lidas** no Header com indicador pulse
- **Formatação de tempo relativo** (Agora mesmo, 5min atrás, 2h atrás, 3d atrás)

### 📁 Upload de Arquivos
- **Drag-and-drop** com preview de imagens
- **Múltiplos arquivos** com grid de previews
- **Validação de tamanho e tipo**
- **Ícones por tipo de arquivo** (imagem, vídeo, áudio, PDF, Word, Excel)
- **Formatação de tamanho** (B, KB, MB)

### 🎨 Temas & Personalização
- **3 temas** (Red, Violet, Green) com troca instantânea via CSS variables
- **Design system futurista**: tokens de glow, bordas HUD, cantos marcados, microanimações
- **Fontes**: Orbitron (títulos), Space Mono (labels), Rajdhani (corpo)
- **Componentes base padronizados**: botões, inputs, cards, badges, modais

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| **Web (site)** | Next.js 14+ (App Router) | SSR, rotas, SEO, React 18 |
| **Desktop (PC)** | Tauri 2 (Rust + WebView) | Muito mais leve que Electron, builds nativos pequenos |
| **Mobile (app)** | React Native + Expo | Compartilha lógica com web via `packages/shared` |
| **UI Web/Desktop** | React 18 + TypeScript + Tailwind | Type safety, design system consistente |
| **Animações** | Framer Motion (web) + Reanimated 3 (mobile) | Animações fluidas em todas as plataformas |
| **Motor de Database** | Implementação própria sobre Prisma | Sistema tipo Notion: Property + Row + View |
| **Editor de texto rico** | Tiptap | Blocos de texto dentro de páginas/linhas |
| **Calendário** | @fullcalendar (web) + react-native-calendars (mobile) | Visões mensal/semanal/diária |
| **Gráficos** | Recharts | Stats pessoais, progresso de metas, relatórios |
| **Backend** | Node.js + NestJS | Modular, serve as 3 plataformas |
| **ORM** | Prisma | Type-safe, migrations, excelente DX |
| **Banco** | SQLite (dev) / PostgreSQL (produção) | Migração documentada na Fase 6 |
| **Cache/Filas** | Redis | Fila de notificações, cache de IA, rate limiting |
| **IA** | Google Gemini (`gemini-2.5-flash`) | Function calling nativo |
| **Busca** | Meilisearch ou busca full-text PostgreSQL | Busca global entre todas as entidades |
| **Auth** | Mock (dev) / NexusAuth (produção) | JWT + sessão compartilhada |
| **Notificações** | Web Push API + Expo Push + @nestjs/schedule | Lembretes multi-canal |
| **Upload** | UploadThing ou Cloudinary | Fotos, anexos, capas de databases |
| **State** | TanStack Query + Zustand | Server state + UI state |
| **Command Palette** | Implementação própria | Atalhos de teclado para navegação e ações |
| **Monorepo** | Turborepo | apps/web + apps/backend + apps/mobile + packages/shared |
| **Testes** | Vitest + Playwright + Detox | Unit + E2E nas 3 plataformas |
| **Container** | Docker + Docker Compose | Ambiente reproduzível |
| **CI/CD** | GitHub Actions + EAS (Expo) + Tauri Action | Automatização das 3 plataformas |
| **Deploy Web** | Vercel | Já compatível com setup atual |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zenith Backend (porta 3002)                 │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │  Goals   │ │  Tasks   │ │ Routines │ │   Appointments      │ │
│  │  Module  │ │  Module  │ │  Module  │ │   (Scheduler)       │ │
│  │ CRUD     │ │ CRUD     │ │ CRUD     │ │ ConflictResolver    │ │
│  │ Milestone│ │ Toggle   │ │ Generate │ │ Reorganization      │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────┬───────────┘ │
│       │            │            │                 │             │
│  ┌────┴────────────┴────────────┴─────────────────┴───────────┐ │
│  │                      Database Module                       │ │
│  │  CRUD Databases · CRUD Properties · CRUD Rows · CRUD Views │ │
│  │  Presets: Finance · Shopping · Study · Habits              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │    Chat Module     │   AI Module    │   Pages Module       │ │
│  │  ChatThread CRUD   │  /ai/parse     │   CRUD Pages/Blocks  │ │
│  │  ChatMessage CRUD  │  /ai/briefing  │                      │ │
│  │  Tool Detection    │  /ai/log       │                      │ │
│  └────────────────────┴────────────────┴──────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Calendar Module (Aggregator)                  │ │
│  │  GET /calendar?from=DATE&to=DATE                           │ │
│  │  PATCH /calendar/reschedule                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Prisma ORM (SQLite/PostgreSQL)          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          ▲              ▲              ▲              ▲
          │              │              │              │
    ┌─────┴────┐  ┌──────┴──────┐ ┌─────┴─────┐ ┌──────┴─────┐
    │   Web    │  │   Desktop   │ │  Mobile   │ │  NexusAuth │
    │ Next.js  │  │   Tauri 2   │ │ Expo/RN   │ │  (futuro)  │
    │ :3000    │  │  (futuro)   │ │ (futuro)  │ │            │
    └──────────┘  └─────────────┘ └───────────┘ └────────────┘
```

### Estrutura de Pastas

```
zenith/
├── apps/
│   ├── web/                  # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/login/        # Tela de login (mock)
│   │   │   ├── (auth)/register/     # Tela de cadastro (mock)
│   │   │   ├── dashboard/           # Dashboard com QuickInput + gráficos
│   │   │   ├── hoje/                # Timeline do dia + briefing IA
│   │   │   ├── metas/               # CRUD de metas + marcos + tarefas
│   │   │   ├── rotinas/             # CRUD de rotinas + gerar tarefas
│   │   │   ├── calendario/          # FullCalendar com drag-and-drop
│   │   │   ├── paginas/             # Páginas/Blocos (Notion-like)
│   │   │   ├── databases/           # Motor de Database Flexível
│   │   │   ├── settings/            # Configurações + temas
│   │   │   ├── relatorio/           # Placeholder para relatórios
│   │   │   ├── globals.css          # Design system completo
│   │   │   └── layout.tsx           # Root layout + fontes
│   │   └── components/
│   │       ├── layout/              # Header, Sidebar, ShellLayout, Footer
│   │       ├── ai/                  # QuickInput
│   │       ├── goals/               # GoalCard
│   │       ├── calendar/            # CalendarView, EventBadge
│   │       ├── databases/           # DatabaseTable, Gallery, CreateModal
│   │       ├── chat/                # ChatPanel (IA)
│   │       ├── search/              # GlobalSearch (Ctrl+K)
│   │       ├── command/             # CommandPalette (Ctrl+Shift+P)
│   │       ├── notifications/       # NotificationPanel
│   │       ├── upload/              # FileUpload (drag-and-drop)
│   │       ├── auth/                # AuthProvider (mock)
│   │       ├── blocks/              # Block renderers
│   │       └── ui/                  # Base components (shadcn)
│   ├── backend/              # NestJS (porta 3002)
│   │   └── src/
│   │       ├── main.ts              # Bootstrap
│   │       ├── app.module.ts        # Módulo raiz
│   │       ├── app.controller.ts    # GET / + GET /health
│   │       ├── app.service.ts       # App service
│   │       ├── prisma.module.ts     # PrismaService global
│   │       ├── prisma.service.ts    # Prisma client
│   │       ├── ai/                  # Módulo AI (Gemini + Mock)
│   │       ├── goals/               # Módulo Metas + Marcos
│   │       ├── tasks/               # Módulo Tarefas
│   │       ├── routines/            # Módulo Rotinas
│   │       ├── scheduler/           # Módulo Compromissos + ConflictResolver
│   │       ├── calendar/            # Módulo Calendário (agregador)
│   │       ├── pages/               # Módulo Páginas + Blocos
│   │       ├── databases/           # Módulo Database Flexível
│   │       ├── chat/                # Módulo Chat IA (threads + messages + tools)
│   │       └── shared/              # ConflictResolver compartilhado
│   └── mobile/               # React Native + Expo (futuro)
├── packages/
│   └── shared/               # Tipos, auth mock, AI mock, tema, Logo
├── assets/
│   └── svg/                  # Logos, efeitos, ilustrações
├── docs/                     # Relatórios de fase, protótipos
├── package.json              # Turborepo root
└── turbo.json                # Pipeline Turborepo
```

---

## 📊 Modelo de Dados (Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String
  name         String
  avatar       String?
  theme        String        @default("red")
  goals        Goal[]
  routines     Routine[]
  appointments Appointment[]
  tasks        Task[]
  pages        Page[]
  databases    Database[]
  aiLogs       AILog[]
}

model Goal {
  id          String       @id @default(cuid())
  userId      String
  title       String
  description String?
  category    String       @default("pessoal")
  priority    String       @default("media")
  status      String       @default("ACTIVE")
  deadline    String?
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  milestones  Milestone[]
  tasks       Task[]
}

model Milestone {
  id        String   @id @default(cuid())
  goalId    String
  title     String
  deadline  String?
  completed Boolean  @default(false)
  goal      Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
}

model Task {
  id          String   @id @default(cuid())
  userId      String
  goalId      String?
  routineId   String?
  title       String
  status      String   @default("ACTIVE")
  date        String?
  completed   Boolean  @default(false)
  time        String?
  duration    Int?
  goal        Goal?    @relation(fields: [goalId], references: [id], onDelete: Cascade)
}

model Routine {
  id        String   @id @default(cuid())
  userId    String
  title     String
  frequency String   @default("daily")
  time      String
  duration  Int      @default(60)
  active    Boolean  @default(true)
  adaptable Boolean  @default(true)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Appointment {
  id        String   @id @default(cuid())
  userId    String
  title     String
  date      String
  startTime String
  endTime   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Page {
  id        String   @id @default(cuid())
  userId    String
  title     String   @default("Sem título")
  parentId  String?
  icon      String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Page?    @relation("PageTree", fields: [parentId], references: [id])
  children  Page[]   @relation("PageTree")
  blocks    Block[]
  databases Database[]
}

model Block {
  id        String   @id @default(cuid())
  pageId    String
  type      String   // heading, text, todo, task_ref, goal_ref, image, divider
  content   String   // JSON flexível por tipo
  order     Int      @default(0)
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
}

model Database {
  id          String     @id @default(cuid())
  userId      String
  pageId      String?
  title       String
  icon        String?
  isPreset    Boolean    @default(false)
  presetType  String?    // "finance" | "shopping" | "study" | "habits"
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  page        Page?      @relation(fields: [pageId], references: [id])
  properties  Property[]
  rows        Row[]
  views       View[]
}

model Property {
  id          String   @id @default(cuid())
  databaseId  String
  name        String
  type        String   // text | number | currency | date | checkbox | select | multi_select
  options     String?  // JSON
  order       Int      @default(0)
  database    Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)
}

model Row {
  id          String   @id @default(cuid())
  databaseId  String
  values      String   // JSON — { propertyId: valor }
  coverImage  String?
  order       Int      @default(0)
  database    Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)
}

model View {
  id          String   @id @default(cuid())
  databaseId  String
  name        String
  type        String   // table | gallery | list | board
  config      String   // JSON — filtros, ordenação
  database    Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)
}

model ChatThread {
  id          String        @id @default(cuid())
  userId      String
  title       String?
  messages    ChatMessage[]
}

model ChatMessage {
  id          String      @id @default(cuid())
  threadId    String
  role        String      // user | assistant | tool
  content     String
  toolCalls   String?     // JSON
  thread      ChatThread  @relation(fields: [threadId], references: [id], onDelete: Cascade)
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  body        String
  type        String   @default("info")
  read        Boolean  @default(false)
  relatedType String?  // task | goal | appointment | routine
  relatedId   String?
}
```

---

## 🔌 Endpoints da API

### Health & App
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Info do servidor |
| GET | `/health` | Health check |

### AI
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/ai/parse` | Processa input do usuário via IA |
| GET | `/ai/log` | Histórico de interações IA |
| GET | `/ai/briefing` | Brief
