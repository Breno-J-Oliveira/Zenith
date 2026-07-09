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
- **Confidence fixo por intent**: Os valores de confidence são hardcoded por intent (LOG_EXPENSE=0.9, CREATE_EVENT=0.85, CREATE_GOAL=0.8, CREATE_TASK=0.75, UNKNOWN=0.3). Não são calculados dinamicamente — é uma simplificação do mock. Quando a OpenAI for integrada, o confidence virá do próprio modelo.
- **Import no backend via rootDir expandido**: O backend precisa importar tipos e lógica de `packages/shared/src/`. Em vez de configurar `paths` no tsconfig (que o NestJS CLI não resolve nativamente sem `tsconfig-paths`), expandimos `rootDir` para `../../` e incluímos os arquivos relevantes do shared no `include`. Isso faz o `dist/` preservar a estrutura de pastas (`dist/apps/backend/src/main.js`), exigindo `entryFile: "apps/backend/src/main"` no `nest-cli.json`. Alternativa mais limpa: configurar `paths` + instalar `tsconfig-paths` como devDependency, ou separar `packages/shared` em `shared/core` (sem JSX) e `shared/ui` (com Logo.tsx), evitando que o backend precise ignorar o `index.ts`.
- **Import direto em ai/ e types/ (ignorando index.ts)**: O `index.ts` do shared exporta `Logo.tsx` que usa JSX. O backend (commonjs, sem `--jsx`) quebra ao compilar o `index.ts`. Solução temporária: importar diretamente de `packages/shared/src/ai` e `packages/shared/src/types`, ignorando o barrel export. Isso é dívida técnica — ver Pendências.
- **Log em memória**: AILog mantido como array no AIService. Sem Prisma/Postgres — vem em fase futura.
- **QuickInput no dashboard**: Posicionado no topo do conteúdo, acima do avatar. Não é FAB flutuante ainda — pode ser ajustado quando o design mobile for definido.
- **Sem TanStack Query**: Fetch simples com try/catch. TanStack Query vem quando houver mais endpoints e necessidade de cache.

## Critérios de Aceite - Status

- [x] Quick Input envia texto para o backend e recebe resultado estruturado
  - **Status**: OK — POST /ai/parse retorna ParsedAIResult com intent, confidence, payload

- [x] Backend Fase 0/1 continua funcionando
  - **Status**: OK — GET /health retorna 200 com {"status":"ok","timestamp":"...","service":"zenith-backend"}

- [x] Parsing mock identifica corretamente gastos, eventos, metas e tarefas
  - **Status**: OK — Testado todos os intents:
    - `"gastei 25 no pastel"` → LOG_EXPENSE, confidence 0.9, amount 25, category "alimentação"
    - `"reuniao dia 23 as 14h"` → CREATE_EVENT, confidence 0.85, date "2026-07-23", time "14:00"
    - `"tenho que entregar o TCC"` → CREATE_GOAL, confidence 0.8, category "pessoal"
    - `"lembrar de pagar a conta"` → CREATE_TASK, confidence 0.75
    - `"oi"` → UNKNOWN, confidence 0.3, payload null

- [x] Feedback visual no dashboard mostra o que a IA entendeu
  - **Status**: OK — Lista de ações com intent badge + summary legível

- [x] AILog mantém histórico das ações (em memória)
  - **Status**: OK — GET /ai/log retorna array de 3 AILogEntry após 3 chamadas POST /ai/parse, com id, timestamp, input e result corretos

## Pendências

- **OpenAI integration**: Substituir parsing determinístico por chamada real à OpenAI API (GPT-4o-mini). Necessário API key.
- **Persistência**: AILog em memória — perde dados ao reiniciar backend. Prisma + Postgres vem em fase futura.
- **Quick Input visual**: Posicionado como card no dashboard. Pode evoluir para FAB flutuante quando o design mobile for definido.
- **Tratamento de erros**: Fetch simples sem retry. Considerar TanStack Query quando houver mais endpoints.
- **Dívida técnica — import direto ignorando index.ts**: O backend importa de `packages/shared/src/ai` e `packages/shared/src/types` diretamente, ignorando o `index.ts` que exporta `Logo.tsx` (JSX incompatível com commonjs). Solução definitiva: separar `packages/shared` em dois sub-packages — `shared/core` (tipos, auth, ai — sem JSX, importável pelo backend) e `shared/ui` (Logo.tsx, componentes React — importável apenas pelo web). Isso elimina a necessidade de rootDir expandido e entryFile customizado no nest-cli.json.
- **rootDir expandido no backend**: `rootDir: "../../"` + `entryFile` customizado são workaround para o import do shared. Se o shared for separado em core/ui, o backend volta a `rootDir: "src"` e `entryFile` default.
