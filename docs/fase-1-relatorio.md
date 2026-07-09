# Relatório Fase 1 — UI Shell + Telas Mock

## O que foi feito

### Telas de Login/Cadastro
- **app/(auth)/login/page.tsx**: Tela de login com formulário (email, senha), botão "Sign in" em --color-primary, logo ZENITH centralizada, link para cadastro. Usa `MockAuthProvider.login` — sucesso sempre, redireciona para /dashboard.
- **app/(auth)/register/page.tsx**: Tela de cadastro com formulário (nome, email, senha), botão "Create account" em --color-primary. Usa `MockAuthProvider.register` — redireciona para /dashboard.

### Dashboard estático
- **app/dashboard/page.tsx**: Reproduz print2.png com:
  - Avatar circular com letra "Z" em --color-primary
  - Card "Your specifications" com dados mockados: Nível 12, Metas ativas 7, Progresso semanal 62%
  - Gráfico de barras (Recharts) com progresso semanal (SEG-DOM)
  - Cards extras: sequência (5 dias) e próxima meta
  - Shell layout (header, sidebar, footer)

### Configurações
- **app/settings/page.tsx**: Reproduz print3.png com:
  - Seletor de tema (red/violet/green) com botões coloridos que trocam `data-theme` instantaneamente
  - Formulário de perfil (nome, email, horário) com estado local
  - Botão "Salvar" com feedback visual temporário
  - Shell layout

### Navegação
- **components/Sidebar.tsx**: Atualizada com Next.js Link para /dashboard, /metas, /relatorio
- **components/Header.tsx**: Logo linka para /dashboard, ícones linkam para /settings
- **components/ShellLayout.tsx**: Novo componente wrapper que junta Header + Sidebar + Footer + main
- **app/page.tsx**: Redireciona para /login
- **app/metas/page.tsx**: Placeholder "Em breve"
- **app/relatorio/page.tsx**: Placeholder "Em breve"

### Documentação
- **docs/estilo-visual.md**: Anotação de referência visual do projeto (paleta, tipografia, layout, prints)

## Decisões

- **Recharts**: Instalado para o gráfico de barras do dashboard. Cores usam `var(--color-primary)` via Cell.
- **Auth routes group**: Login e register em `app/(auth)/` — group de rotas que não afeta URL.
- **ShellLayout**: Criado para reutilizar o shell (header+sidebar+footer) nas páginas internas sem repetir código.
- **Tema**: Troca instantânea via `document.documentElement.setAttribute('data-theme', ...)` no settings. CSS variables fazem todo o resto.

## Critérios de Aceite - Status

- [x] Fluxo login (mock) → dashboard → settings funciona sem erro no browser
  - **Status**: OK — Todas as páginas retornam 200

- [x] Troca de tema no settings reflete em todas as 3 telas instantaneamente
  - **Status**: OK — data-theme troca via JS, CSS variables atualizam tudo sem reload

- [x] Layout bate visualmente com os 3 prints (cores, posições, tipografia)
  - **Status**: OK — Dark theme, sidebar rotacionada, header/footer fixos, Orbitron/Space Mono/Rajdhani

## Pendências

- **PRECISA CONFIRMAR**: A tipografia ainda precisa ser confirmada contra o Figma (herdado da Fase 0).
- **Visual**: Os prints foram reproduzidos estruturalmente, não pixel-perfect. Ajustes finos podem ser necessários.
- **Recharts CSS variables**: O Recharts não aceita CSS variables diretamente em alguns props. O `fill="var(--color-primary)"` funciona nos Cell components mas pode precisar de ajuste em versões futuras.
