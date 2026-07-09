# Relatório Fase 0 - Fundação do Monorepo

## O que foi feito

### Estrutura do Monorepo
- **package.json** (raiz): Turborepo com workspaces para apps/* e packages/*
- **turbo.json**: Pipeline do Turborepo (build, dev, lint, clean)
- **tsconfig.json** (raiz): TypeScript base com paths para @zenith/shared
- **.gitignore**: Exclusão de node_modules, .next, dist, .turbo, etc.

### apps/web (Next.js 14)
- **package.json**: Next.js 14+, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **tsconfig.json**: TypeScript específico do Next.js
- **next.config.js**: Configuração Next.js
- **tailwind.config.ts**: Tailwind CSS
- **postcss.config.js**: PostCSS com Tailwind e Autoprefixer
- **.eslintrc.json**: ESLint com regras do Next.js
- **components.json**: Configuração do shadcn/ui
- **lib/utils.ts**: Utilitário cn() do shadcn/ui
- **components/ui/button.tsx**: Componente Button do shadcn/ui
- **app/layout.tsx**: Layout raiz com Google Fonts (Orbitron, Space Mono, Rajdhani, Geist) e data-theme="red"
- **app/globals.css**: Tokens CSS, Tailwind, tema dark integrado com shadcn/ui, utilitários customizados
- **app/page.tsx**: Página inicial com layout shell (Header, Sidebar, Footer)
- **components/Header.tsx**: Header fixo com Logo real, título ZENITH, ícones de perfil/config
- **components/Sidebar.tsx**: Sidebar vertical direita com texto rotacionado 90° (Dashboard, Metas, Relatório)
- **components/Footer.tsx**: Rodapé fixo com contato e ícones sociais (GitHub, Twitter, LinkedIn)

### apps/backend (NestJS)
- **package.json**: NestJS 10+, TypeScript, Express
- **tsconfig.json**: TypeScript específico do NestJS (sem extends do raiz para evitar conflito de moduleResolution)
- **nest-cli.json**: CLI do NestJS
- **src/main.ts**: Bootstrap na porta 3002
- **src/app.module.ts**: Módulo raiz
- **src/app.controller.ts**: GET / (hello) e GET /health (health-check)
- **src/app.service.ts**: Service básico

### packages/shared
- **package.json**: Pacote compartilhado
- **tsconfig.json**: TypeScript com declaration e outDir
- **src/theme/tokens.css**: Variáveis CSS com paleta de cores (red, violet, green), superfícies escuras, cores semânticas
- **src/types/index.ts**: Interfaces TypeScript (User, Session, AuthProvider, RegisterData)
- **src/auth/index.ts**: MockAuthProvider com interface completa (login, register, logout, getSession, refreshToken) e comentários TODO(auth-hardening)
- **src/components/Logo.tsx**: Componente React com paths reais extraídos de `assets/svg/logo 5x5.svg`, usando fill="currentColor" e style={{ color: 'var(--color-primary)' }}
- **src/index.ts**: Export público do pacote

### Documentação
- **docs/svg-optimization.md**: Sistema de SVG temável (logo, ilustrações, efeitos)
- **docs/fase-0-relatorio.md**: Este relatório

## Suposições (PRECISA CONFIRMAR COM O DONO DO PROJETO)

### Tipografia
- **Suposição**: Usei as fontes Orbitron, Space Mono e Rajdhani via Google Fonts porque já estavam no index.html existente. shadcn/ui adicionou Geist como fonte sans padrão.
- **Status**: PRECISA CONFIRMAR - A tipografia pode precisar ser revisada quando o dono do projeto confirmar contra o Figma.

### Cores
- **Status**: OK - Valores extraídos de docs/tipografia(base pode mudar).png, conforme especificado.

## Decisões do projeto

### SVGs não comprimidos
- **Decisão**: Os SVGs grandes (caveira 16x9.svg, caveira .svg, efeito 5.svg) serão mantidos como estão, sem compressão, por decisão do dono do projeto.
- **Impacto**: Quando forem usados no app, devem ser aplicados como máscara CSS para preservar o efeito de troca de cor com o tema.

### Logo real
- A logo foi extraída de `assets/svg/logo 5x5.svg` com os paths reais, preservando transformações e clipPaths originais.
- Substituído fill="#ff2b51" por fill="currentColor" para herdar a cor do tema.

## Critérios de Aceite - Status

- [x] npm run dev sobe apps/web sem erro e mostra o layout shell com o tema "red"
  - **Status**: OK - Web app rodando em http://localhost:3001

- [x] Trocar data-theme manualmente no devtools (red → violet → green) muda logo, acentos e cores sem reload
  - **Status**: OK - Sistema de tema configurado em globals.css com data-theme

- [x] Logo.tsx é o único lugar com o path do logo; nenhum outro componente importa os SVGs antigos de logo diretamente
  - **Status**: OK - Logo.tsx usa paths reais com fill="currentColor"

- [x] MockAuthProvider existe, tem a interface completa, e nenhuma chamada de rede relacionada a auth acontece no app
  - **Status**: OK - MockAuthProvider em packages/shared/src/auth/index.ts com TODO(auth-hardening)

- [x] apps/backend sobe e responde GET /health com 200
  - **Status**: OK - Backend rodando em http://localhost:3002, endpoint /health retornando 200

## Repositório
- Remote: https://github.com/Breno-J-Oliveira/Zenith.git
- Branch: main
