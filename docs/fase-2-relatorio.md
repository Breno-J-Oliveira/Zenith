# Relatório Fase 2 — Quick Input + IA (núcleo)

## O que foi feito

### Tipos AI (packages/shared)
- **src/types/index.ts**: Adicionados `AIIntent` (union: CREATE_GOAL | CREATE_TASK | LOG_EXPENSE | CREATE_EVENT | UNKNOWN), payloads tipados (`ExpensePayload`, `GoalPayload`, `TaskPayload`, `EventPayload`), `AIPayload` (union | null), `ParsedAIResult` (intent, confidence, payload, rawText), `AILogEntry` (id, timestamp, input, result)

### MockAIProvider (packages/shared)
- **src/ai/index.ts**: Novo arquivo, mesmo padrão do `auth/index.ts`
  - Método `parse(text: string): Promise<ParsedAIResult>`
  - Parsing determinístico por keywords/regex — sem chamada a API externa
  - `LOG_EXPENSE`: detecta "gastei/gastou/comi/paguei" + extrai valor numérico + categoria por palavras-chave (alimentação, transporte, lazer, outros)
  - `CREATE_EVENT`: detecta "reunião/compromisso/evento" + extrai data ("dia 23") e hora ("14h")
  - `CREATE_GOAL`: detecta "tenho que/preciso/meta/objetivo/quero" + extrai deadline
  - `CREATE_TASK`: detecta "tarefa/fazer/lembrar/estudar/ler" + extrai data
  - `UNKNOWN`: fallback com confidence 0.3
  - Comentário `TODO(ai-openai-integration)` marcando onde entra a chamada real à OpenAI
  - Exporta instância singleton `aiProvider`

### Backend — Módulo AI (apps/backend)
- **src/ai/ai.module.ts**: NestModule com controller e service
- **src/ai/ai.controller.ts**: `POST /ai/parse` (recebe `{ text }`, retorna `ParsedAIResult`) + `GET /ai/log` (retorna histórico em memória)
- **src/ai/ai.service.ts**: Usa `aiProvider` de `@zenith/shared`, mantém array em memória como AILog (sem banco)
- **src/app.module.ts**: Importado `AIModule`

### Web — QuickInput (apps/web)
- **components/QuickInput.tsx**: Componente client com input de texto + botão "Enviar"
  - Chama `POST /ai/parse` no backend (fetch simples)
  - Mostra feedback inline com intent + summary (ex: "Gasto registrado: R$ 25 · alimentação")
  - Lista últimas 5 ações na sessão (useState, sem persistência)
  - Estilo: card surface-1, input bg dark, botão em --color-primary, fontes do projeto
- **app/dashboard/page.tsx**: QuickInput integrado no topo do dashboard

## Decisões

- **Parsing determinístico**: Sem OpenAI key disponível ainda. O parser usa regex e keywords para identificar intent e extrair dados. Comentário TODO marca onde a integração real entra no futuro.
- **Import no backend**: Backend usa `commonjs` sem path mapping para `@zenith/shared`. Import via caminho relativo `../../../../packages/shared/src` para evitar configurar tsconfig paths no NestJS.
- **Log em memória**: AILog mantido como array no AIService. Sem Prisma/Postgres — vem em fase futura.
- **QuickInput no dashboard**: Posicionado no topo do conteúdo, acima do avatar. Não é FAB flutuante ainda — pode ser ajustado quando o design mobile for definido.
- **Sem TanStack Query**: Fetch simples com try/catch. TanStack Query vem quando houver mais endpoints e necessidade de cache.

## Critérios de Aceite - Status

- [x] Quick Input envia texto para o backend e recebe resultado estruturado
  - **Status**: OK — POST /ai/parse retorna ParsedAIResult com intent, confidence, payload

- [x] Parsing mock identifica corretamente gastos, eventos, metas e tarefas
  - **Status**: OK — Testado com "gastei 25 no pastel" (LOG_EXPENSE), "reunião dia 23 às 14h" (CREATE_EVENT), "tenho que entregar o TCC" (CREATE_GOAL), "lembrar de pagar a conta" (CREATE_TASK)

- [x] Feedback visual no dashboard mostra o que a IA entendeu
  - **Status**: OK — Lista de ações com intent badge + summary legível

- [x] AILog mantém histórico das ações (em memória)
  - **Status**: OK — GET /ai/log retorna array de AILogEntry

## Pendências

- **OpenAI integration**: Substituir parsing determinístico por chamada real à OpenAI API (GPT-4o-mini). Necessário API key.
- **Persistência**: AILog em memória — perde dados ao reiniciar backend. Prisma + Postgres vem em fase futura.
- **Quick Input visual**: Posicionado como card no dashboard. Pode evoluir para FAB flutuante quando o design mobile for definido.
- **Tratamento de erros**: Fetch simples sem retry. Considerar TanStack Query quando houver mais endpoints.
- **Backend path mapping**: Import relativo funciona mas é frágil. Considerar configurar tsconfig paths ou publicar @zenith/shared como package compilado no futuro.
