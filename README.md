# ✨ Zenith — Organização Pessoal com IA

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI">
  <br>
  <img src="https://img.shields.io/badge/fases-0--9_concluídas-brightgreen?style=flat-square" alt="Fases">
  <img src="https://img.shields.io/badge/licença-MIT-blue?style=flat-square" alt="License">
</p>

---

## O que é o Zenith?

O **Zenith** é uma aplicação fullstack de **organização pessoal com IA**, disponível em três plataformas (web, desktop e mobile). Inspirado no Notion, o Zenith permite ao usuário montar qualquer estrutura de organização — tabelas, galerias, listas, páginas — com um diferencial: a **IA como orquestradora central**, capaz de raciocinar, criar, editar e reorganizar qualquer parte do sistema por conta própria.

**Praticidade acima de tudo:** pegar o celular, anotar na hora e pronto. A IA organiza a maior parte.

Projeto desenvolvido como **portfolio pessoal** (solo), demonstrando domínio de fullstack, IA, segurança e arquitetura de microsserviços.

---

## O que ele entrega?

### Para o usuário final
- Painel **"Hoje"** com briefing diário gerado por IA
- CRUD completo de **Metas, Tarefas, Rotinas e Compromissos**
- **Calendário** com views mensal/semanal/diária e drag-and-drop
- **Páginas e Blocos** estilo Notion (heading, texto, todo, imagem, divider)
- **Chat com IA** (classificador de intent com fallback mock)
- **Bancos de dados flexíveis** (tabela e galeria)
- **Notificações** com painel integrado
- **Command Palette** (Ctrl+K) para navegação rápida
- **Busca global** em todas as entidades
- **3 temas visuais** (red, violet, green)

### Para o desenvolvedor
- **Monorepo Turborepo** com 3 apps + 1 package compartilhado
- **Autenticação real** com NexusAuth (JWT RS256 + JWKS)
- **Prisma ORM** com SQLite (dev) e PostgreSQL (produção)
- **IA via Google Gemini** com fallback para mock determinístico
- **SchedulerService + ConflictResolver** para reorganização automática de agenda
- **Middleware de proteção de rotas** com Next.js Edge

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)           │
│           http://localhost:3001                  │
│  React 18 + Tailwind + shadcn/ui + Framer Motion│
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│              Backend (NestJS)                    │
│           http://localhost:3002                  │
│  Goals │ Tasks │ Routines │ Calendar │ AI │ Chat │
│  Databases │ Pages │ Notifications │ Auth       │
└────────┬─────────────────┬──────────────────────┘
         │                 │
    ┌────▼────┐     ┌──────▼──────┐
    │ SQLite  │     │ NexusAuth   │
    │ (Prisma)│     │ (Docker)    │
    └─────────┘     │ :3000       │
                    │ Postgres    │
                    │ Redis       │
                    └─────────────┘
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| Backend | NestJS 10, TypeScript 5 |
| ORM | Prisma 6 (SQLite dev / PostgreSQL prod) |
| Autenticação | NexusAuth (JWT RS256, JWKS, OAuth2, 2FA) |
| IA | Google Gemini 2.5 Flash + Mock Provider |
| Calendário | FullCalendar |
| Monorepo | Turborepo |
| Container | Docker + Docker Compose |

---

## Como Rodar

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- npm 10+

### 1. Clone

```bash
git clone https://github.com/Breno-J-Oliveira/Zenith.git
cd Zenith
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Gere as chaves RSA (para o NexusAuth)

```bash
mkdir -p apps/auth-service/keys
openssl genrsa -out apps/auth-service/keys/private.pem 2048
openssl rsa -in apps/auth-service/keys/private.pem -pubout -out apps/auth-service/keys/public.pem
```

### 4. Configure as variáveis de ambiente

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/web/.env.local.example apps/web/.env.local

# NexusAuth
cp apps/auth-service/.env.example apps/auth-service/.env
```

Edite os `.env` com suas chaves (GEMINI_API_KEY, ENCRYPTION_KEY, etc).

### 5. Suba o NexusAuth (Docker)

```bash
cd apps/auth-service
docker compose up -d
cd ../..
docker exec nexus-api npx prisma migrate deploy
```

### 6. Gere o Prisma Client do backend

```bash
cd apps/backend
npx prisma generate
cd ../..
```

### 7. Rode o projeto

```bash
# Terminal 1 — Backend
cd apps/backend
npx nest start --watch

# Terminal 2 — Frontend
cd apps/web
npx next dev --port 3001
```

### 8. Acesse

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3002
- **NexusAuth:** http://localhost:3000

---

## Estrutura do Projeto

```
zenith/
├── apps/
│   ├── web/                  # Frontend Next.js 14
│   │   ├── app/              # App Router (páginas)
│   │   ├── components/       # Componentes React
│   │   └── lib/              # Utilitários (api.ts)
│   ├── backend/              # API NestJS
│   │   ├── src/
│   │   │   ├── ai/           # Serviço de IA (Gemini + Mock)
│   │   │   ├── auth/         # Autenticação (NexusAuth integration)
│   │   │   ├── calendar/     # Calendário + ConflictResolver
│   │   │   ├── chat/         # Chat persistente com IA
│   │   │   ├── databases/    # Motor de database flexível
│   │   │   ├── goals/        # Metas + Marcos
│   │   │   ├── notifications/# Notificações
│   │   │   ├── pages/        # Páginas + Blocos
│   │   │   ├── routines/     # Rotinas recorrentes
│   │   │   ├── scheduler/    # Compromissos + Reorganização
│   │   │   ├── shared/       # ConflictResolver
│   │   │   └── tasks/        # Tarefas
│   │   └── prisma/           # Schema + Migrations
│   └── auth-service/         # NexusAuth (microsserviço)
├── packages/
│   └── shared/               # Tipos, IA, NexusAuthClient
├── docs/                     # Relatórios de fase (0-9)
├── keys/                     # Chaves RSA (NUNCA commitar)
└── ANOTAÇÕES.md              # Planejamento completo (privado)
```

---

## Roadmap

| Bloco | Fases | Status |
|-------|-------|--------|
| **A — Fundação** | 7: Redesign, 8: Database Flexível, 9: IA Agente Real | 🔲 Próximo |
| **B — Essenciais** | 11-16: Busca, Command Palette, Auth, Notificações, Anexos, Config | 🔲 Pendente |
| **C — Multiplataforma** | 17-21: Desktop (Tauri), Mobile (Expo), Offline, Push | 🔲 Pendente |
| **D — Engajamento** | 22-26: IA Proativa, Gamificação, Modo Foco, Automação, Analytics | 🔲 Pendente |
| **E — Lançamento** | 27-30: Testes, Performance, Deploy, Publicação | 🔲 Pendente |

---

## Contatos

<p align="center">
  <a href="https://github.com/Breno-J-Oliveira" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://www.linkedin.com/in/breno-j-oliveira-672619352/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  <a href="https://www.instagram.com/brenoov" target="_blank">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://x.com/BrenoJOliveira_" target="_blank">
    <img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="X (Twitter)">
  </a>
</p>

---

<p align="center">
  <strong>✨ Zenith — Organize sua vida com IA.</strong><br>
  Fases 0-9 concluídas • Fullstack completo • 3 plataformas planejadas
</p>