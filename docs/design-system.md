# 🎨 Zenith Design System

> **Status:** ✅ Documentado — Fases 0-6 (núcleo) + Fase 7 (redesign) concluídas
> **Localização do código:** `apps/web/app/globals.css`
> **Última atualização:** 28/07/2026

---

## 📐 Filosofia

O Zenith usa um design system **HUD/futurista** com influências de painéis de ficção científica, inspirado em produtos como o Notion, Linear e Raycast. Os princípios:

1. **Praticidade acima de tudo** — interface óbvia, sem ambiguidade
2. **Identidade visual forte** — glow, bordas HUD, gradientes, tipografia geométrica
3. **Dark first** — projetado primariamente para modo escuro (uso noturno)
4. **Acessibilidade** — contraste mínimo AA em todos os textos
5. **Consistência entre plataformas** — tokens reutilizáveis em web, desktop e mobile

---

## 🎨 Temas

### Temas disponíveis

| Tema | Cor primária | Uso recomendado |
|------|--------------|-----------------|
| **red** (padrão) | `#FF2B51` | Energia, paixão, foco |
| **violet** | `#6C4CFF` | Criatividade, concentração |
| **green** | `#00CC44` | Crescimento, equilíbrio |
| **light** | (variante do red) | Uso diurno, claridade |

### Como trocar tema

```html
<html data-theme="violet">  <!-- substitui todo o esquema de cores -->
```

```ts
// Via JavaScript (usado no CommandPalette)
document.documentElement.setAttribute('data-theme', 'green');
```

### Variáveis por tema

```css
[data-theme="red"]    { --color-primary: #FF2B51; ... }
[data-theme="violet"] { --color-primary: #6C4CFF; ... }
[data-theme="green"]  { --color-primary: #00CC44; ... }
[data-theme="light"]  { /* inverte superfícies, mantém primary */ }
```

---

## 🎨 Paleta de Cores

### Superfícies (dark mode — padrão)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#030303` | Background raiz |
| `--color-surface-1` | `#0B0B0D` | Cards, modais |
| `--color-surface-2` | `#1A1D23` | Botões secundários, inputs |
| `--color-surface-3` | `#282C33` | Hovers, dividers |
| `--color-surface-4` | `#353A42` | Active states |

### Texto (dark mode)

| Token | Valor | Contraste vs `--color-bg` | Uso |
|-------|-------|---------------------------|-----|
| `--color-text` | `#FFFFFF` | 21:1 (AAA) | Texto principal |
| `--color-text-secondary` | `#E0E4E8` | 18:1 (AAA) | Subtítulos |
| `--color-text-dim` | `#8899AA` | 8.5:1 (AAA) | Labels |
| `--color-text-muted` | `#5A6672` | 5.5:1 (AA) | Placeholders, hints |

### Semânticas (iguais em todos os temas)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-success` | `#2FC63E` | Confirmações |
| `--color-danger` | `#D11D00` | Erros, exclusões |
| `--color-warning` | `#FF9500` | Avisos |
| `--color-info` | `#00B4D8` | Informações |

---

## ✍️ Tipografia

| Fonte | Token | Uso |
|-------|-------|-----|
| **Orbitron** | `--font-orbitron` | Títulos, logo, números |
| **Space Mono** | `--font-space-mono` (`.font-mono`) | Código, labels técnicos |
| **Rajdhani** | `--font-rajdhani` (default) | Corpo de texto, UI |

Exemplo:
```html
<h1 class="font-orbitron">Título futurista</h1>
<p class="font-mono">[STATUS]</p>
<p class="font-rajdhani">Texto normal do UI</p>
```

---

## 📏 Espaçamento e Raios

### Raios de borda

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | `6px` | Badges, tags |
| `--radius-md` | `8px` | Botões, inputs |
| `--radius-lg` | `12px` | Cards |
| `--radius-xl` | `16px` | Modais, painéis |

### Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.3)` | Elevação 1 |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.4)` | Elevação 2 |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.5)` | Elevação 3 (modais) |
| `--shadow-glow` | `0 0 20px var(--color-primary-glow)` | Elementos ativos |

### Transições

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition-fast` | `150ms` | Hovers, focus |
| `--transition-base` | `200ms` | Padrão |
| `--transition-slow` | `300ms` | Modais, drawers |

---

## 🧩 Componentes

### Botões

```html
<button class="btn btn-primary">Primário</button>
<button class="btn btn-secondary">Secundário</button>
<button class="btn btn-ghost">Fantasma</button>
<button class="btn btn-danger">Excluir</button>
<button class="btn btn-success">Confirmar</button>
```

### Inputs

```html
<input class="input" type="text" placeholder="..." />
```

Estado de foco: borda primary + glow sutil (2px).

### Cards

```html
<div class="card">Card estático</div>
<div class="card card-interactive">Card com hover (borda primary)</div>
```

### Badges

```html
<span class="badge badge-primary">Tag</span>
<span class="badge badge-success">Ativo</span>
<span class="badge badge-danger">Erro</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-info">Info</span>
```

---

## ✨ Efeitos Especiais

### Glow (classes utilitárias)

```html
<div class="glow">Glow pequeno (8px)</div>
<div class="glow-md">Glow médio (16px)</div>
<div class="glow-lg">Glow grande (32px)</div>
<div class="glow-subtle">Glow muito sutil (12px)</div>
```

Cor do glow segue o tema ativo automaticamente.

### Bordas HUD (cantos marcados)

```html
<div class="hud-border">Card com cantos HUD</div>
```

Adiciona marcação em "L" nos cantos superior-esquerdo e inferior-direito, na cor primária do tema.

### Background grade

```html
<div class="grid-bg">Grid 40x40</div>
<div class="grid-bg-fine">Grid 20x20 (mais denso)</div>
```

Linhas sutis (1px, cor `--border-subtle`) formando grade de fundo.

### Gradientes primários

```html
<div style="background: var(--gradient-primary)">...</div>
```

Cada tema define seu próprio `--gradient-primary` (red→rosa, violet→lilás, green→verde claro).

---

## 🎬 Animações

| Classe | Animação | Uso |
|--------|----------|-----|
| `.animate-pulse-glow` | Pulse de opacidade 2s infinite | Notificações, status online |
| `.animate-fade-in` | Fade 200ms | Entrada padrão |
| `.animate-slide-in-up` | Slide up 300ms | Modais, dropdowns |
| `.animate-slide-in-right` | Slide right 300ms | Painéis laterais |

---

## 📱 Responsividade

O design system é **mobile-first** com breakpoints Tailwind padrão:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Componentes principais (Sidebar, ChatPanel, CommandPalette) já adaptam-se automaticamente via classes Tailwind.

---

## 🧪 Como usar

### Em componentes React

```tsx
// Sempre prefira tokens em vez de valores hardcoded
<div className="bg-[var(--color-surface-1)] text-[var(--color-text)]">
  <button className="btn btn-primary">Ação</button>
  <span className="badge badge-success">OK</span>
</div>
```

### Em Tailwind (via classes utilitárias)

```tsx
// Funciona para texto e backgrounds simples
<p className="text-dim">Texto secundário</p>
<div className="bg-surface-2">Fundo</div>
```

### Em CSS puro (fallback)

```css
.my-element {
  background: var(--color-surface-1);
  color: var(--color-text);
  border: 1px solid var(--border-default);
  box-shadow: var(--glow-subtle);
}
```

---

## 📋 Componentes JÁ migrados (Fase 7)

- ✅ **Sidebar** (`apps/web/components/layout/Sidebar.tsx`)
- ✅ **GoalCard** (`apps/web/components/goals/GoalCard.tsx`)
- ✅ **ProgressBar** (em GoalCard)
- ✅ **MilestoneItem** (em GoalCard)
- ✅ **CalendarView** (`apps/web/components/calendar/CalendarView.tsx`)
- ✅ **ChatPanel** (`apps/web/components/chat/ChatPanel.tsx`) — tokens, glow, animações
- ✅ **CommandPalette** (`apps/web/components/command/CommandPalette.tsx`) — categorias, kbd, kbd-shortcuts
- ✅ **globals.css** expandido (`.btn-danger`, `.btn-success`, `.badge-info`, `.text-danger/success/warning`, `--gradient-primary`, light mode)

---

## 🔄 Pendente (futuro)

- [ ] **Storybook** — documentação interativa de componentes
- [ ] **Light mode** totalmente funcional (tokens já preparados)
- [ ] **Animações de transição entre temas**
- [ ] **Tokens semânticos adicionais** (ex: `--color-bg-overlay` para modais)

---

## 🛠️ Manutenção

Ao adicionar novos tokens ou componentes:

1. Adicione a variável em `:root` no `globals.css` (com fallback)
2. Documente aqui (tabela de tokens)
3. Use **apenas** os tokens em componentes — nunca hardcode cores
4. Mantenha contraste mínimo AA (4.5:1 para texto)
