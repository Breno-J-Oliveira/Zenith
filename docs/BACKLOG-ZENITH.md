# Backlog do Zenith

**Data de referência** 20/11/2026
**Base** Checkout local de `83d6fcf` com alterações preexistentes. Consulte o [plano de produto e suas evidências](PLANO-DE-PRODUTO-ZENITH.md).

**M1** estabilizar · **M2** uso pessoal · **M3** teste externo · **M4** lançamento · **Depois** reavaliar após evidência.
**Melhoria** altera capacidade presente no código ou no processo atual. **Nova** introduz uma capacidade adicional. Problemas formulados como hipótese ou risco precisam ser verificados na fase indicada.
**Impacto** Alto = viabiliza jornada ou protege usuário/dados. Médio = reduz esforço ou falhas frequentes. Baixo = ganho incremental condicionado ao uso.
**Esforço** P = mudança localizada. M = mais de uma camada ou integração/testes relevantes. G = trabalho em várias camadas ou dependência externa relevante. São estimativas iniciais, a revisar antes da implementação.

## Evidências para as primeiras decisões

- Z-001, Z-022 e Z-023. A jornada começa em [middleware](../apps/web/middleware.ts) e passa pelo [Compose do NexusAuth](../apps/auth-service/docker-compose.yml). A API principal responder em `/health` comprova a disponibilidade do processo. Use `/auth/health` e login com conta fictícia para validar a dependência.
- Z-002, Z-038 e Z-039. O [ChatService](../apps/backend/src/chat/chat.service.ts) recebe identidade de conta. O [AIService](../apps/backend/src/ai/ai.service.ts) contém fluxos com `MOCK_USER_ID`. O [AgentService](../apps/backend/src/chat/agent.service.ts) é o ponto de execução e retentativa das ferramentas. O teste deverá cobrir frontend, API e escrita indireta.
- Z-003 a Z-006. Use [Task e seu schema](../apps/backend/prisma/schema.prisma), o [serviço de tarefas](../apps/backend/src/tasks/tasks.service.ts) e o [painel Hoje](../apps/web/app/hoje/page.tsx) como pontos de entrada. O painel deriva a data do ISO em UTC. Caixa de Entrada e triagem são propostas para o piloto.
- Z-010 e Z-011. A [geração de rotinas](../apps/backend/src/routines/routines.service.ts) e o [reagendamento](../apps/backend/src/scheduler/scheduler.service.ts) concentram as regras do domínio. Duplicação e falhas parciais devem ser testadas com fixtures concorrentes antes de alterar a agenda de uso real.

## As 15 prioridades em ordem

A ordem considera bloqueios da jornada, risco para dados pessoais e valor esperado para o piloto. Os marcos determinam quando cada entrega pode entrar. Z-006 é pré-requisito técnico de Z-005 e pode avançar em paralelo às primeiras histórias. Z-014 e Z-015 antecedem convites externos com dados reais.

| Ordem | ID | Decisão |
|---|---|---|
| 1 | Z-001 | Recuperar o login real é pré-requisito para testar a jornada inteira no checkout. |
| 2 | Z-002 | Isolar dados por conta antes de registrar uma rotina pessoal ou convidar alguém. |
| 3 | Z-003 | Captura confiável é a primeira prova de valor e a origem dos itens da jornada. |
| 4 | Z-004 | Triagem dá destino à captura e elimina a recópia ao planejar. |
| 5 | Z-005 | Concluir e desfazer em Hoje fecha o primeiro ciclo e permite medir uso real. |
| 6 | Z-006 | Unificar o dia local para que Hoje e a agenda representem o mesmo dia. |
| 7 | Z-007 | Proteger o ciclo com um teste reproduzível antes de ampliar a superfície. |
| 8 | Z-008 | Captura no celular ocorre no momento da necessidade, hipótese central do piloto. |
| 9 | Z-009 | Ações essenciais precisam funcionar com teclado e tecnologia assistiva desde o piloto. |
| 10 | Z-010 | Uma rotina recorrente duplicada compromete a confiança no plano do dia. |
| 11 | Z-011 | Reagendamentos previsíveis reduzem retrabalho quando o dia muda. |
| 12 | Z-012 | Uma revisão semanal revela acúmulo e ajuda a escolher o que levar adiante. |
| 13 | Z-013 | Medir uso espontâneo e esforço antes de investir em expansão. A coleta começa no dia 1 do piloto. |
| 14 | Z-014 | Um candidato repetível em staging permite aprender com usuários externos. |
| 15 | Z-015 | Dados pessoais exigem recuperação comprovada antes da primeira coorte externa. |

## Critérios de aceite das cinco primeiras

### Z-001 · Ambiente local reproduzível

- **Dado** um checkout limpo de teste com os pré-requisitos documentados e configuração fictícia, **quando** executar o roteiro de inicialização, **então** web, API e NexusAuth atendem nas portas documentadas, o diagnóstico aponta a dependência que falhou e as migrações funcionam em base descartável.
- **Dada** uma conta de teste provisionada pelo roteiro, **quando** entrar pelo navegador, **então** o fluxo termina em Hoje e a sessão é reconhecida pela API. A checagem usa configuração e base de teste.
- **Dada** uma sessão ausente, **quando** abrir `/hoje/`, **então** o navegador chega a `/login/` em até dois redirecionamentos e recebe o formulário.

### Z-002 · Identidade e isolamento

- **Dadas** duas contas fictícias com tarefas e conversas distintas, **quando** cada uma pesquisar, consultar ou reagendar pelo calendário, abrir seu briefing, consultar o chat ou pedir uma ação ao agente, **então** a leitura e a escrita ficam restritas aos recursos da sessão, inclusive identificadores enviados a operações sobre entidades relacionadas.
- **Dada** uma sessão ausente ou expirada, **quando** chamar um endpoint pessoal, **então** a API recusa o acesso. Ao tentar acessar um recurso de outra conta, ela responde conforme o contrato de autorização, sem expor conteúdo nem gravar mudanças.
- **Dada** uma cópia de dados legados de teste, **quando** aplicar a política de propriedade definida, **então** registros sem vínculo verificado permanecem isolados e a operação emite contagens para reconciliação.

### Z-003 · Captura rápida na Caixa de Entrada

- **Dado** que estou autenticado na web, **quando** abrir a captura de Hoje e salvar apenas um título válido, **então** recebo confirmação, o item aparece na Caixa de Entrada sem data e permanece após recarregar.
- **Dado** que a gravação foi concluída e a resposta se perdeu, **quando** reenviar a mesma captura, **então** a interface confirma o mesmo ID e existe exatamente um item. Em falha anterior à gravação, o rascunho fica disponível para tentar novamente.
- **Dado** um título vazio ou acima do limite documentado, **quando** enviar, **então** o sistema apresenta erro associado ao campo, preserva o conteúdo digitado e deixa a base sem alterações.

### Z-004 · Triagem para Hoje ou outra data

- **Dado** um item sem data na Caixa de Entrada, **quando** escolher Hoje ou uma data pelo seletor, **então** o mesmo ID recebe a data escolhida e aparece uma vez na visualização correspondente.
- **Dado** que a alteração falhou, **quando** o sistema receber a falha da API, **então** o item permanece no estado anterior e a tela oferece nova tentativa sem alterar seu título.
- **Dado** um item planejado para outro dia, **quando** abrir Hoje, **então** ele aparece somente na data escolhida. O usuário consegue consultá-lo em Próximos dias na visualização mínima do planejador.

### Z-005 · Concluir e desfazer em Hoje

- **Dada** uma tarefa do dia, **quando** marcar como concluída, **então** o estado persiste após recarregar, a ação tem retorno visível e a seção de concluídos reflete a tarefa.
- **Dada** uma conclusão registrada, **quando** desfazer, **então** o mesmo item volta aos pendentes e permanece assim após recarregar. Se uma gravação falhar, a interface restaura o estado confirmado e informa o erro.
- **Dada** uma hora em que o calendário de `America/Sao_Paulo` e UTC indicam datas distintas, **quando** carregar Hoje, **então** o dia e as tarefas exibidas correspondem à data local da conta.

## Inventário

As dependências apontam para a principal condição de entrega. Segurança, dados e operação têm critérios de verificação adicionais no [roadmap](PLANO-DE-PRODUTO-ZENITH.md).

| ID | Tipo | Problema | Proposta | Impacto | Esforço | Dependência principal | Fase |
|---|---|---|---|---|---|---|---|
| Z-001 | Melhoria | Sete passos de setup e NexusAuth local indisponível | Documentar inicialização e diagnóstico por serviço com fixture de conta local | Alto | M | Docker/NexusAuth | M1 |
| Z-002 | Melhoria | Guard global e caminho de IA com identidade de demo coexistem | Propagar a conta autenticada a leitura e escrita, com teste de propriedade entre duas contas | Alto | G | Z-001 | M1 |
| Z-003 | Nova | Registrar uma ideia exige decidir onde ela entra | Capturar título em uma Caixa de Entrada persistente com chave de idempotência e rascunho em falha | Alto | M | Z-002 | M2 |
| Z-004 | Nova | Captura sem destino exige lembrar ou copiar à mão | Agendar o registro existente para Hoje ou outra data e mostrá-lo no planejador | Alto | M | Z-003 | M2 |
| Z-005 | Melhoria | Confirmação e reversão de tarefa precisam ser confiáveis em Hoje | Persistir conclusão e desfazer, com estados confirmados após recarga | Alto | M | Z-004 e Z-006 | M2 |
| Z-006 | Melhoria | Hoje, rotinas e briefing derivam datas UTC | Definir data civil e fuso de conta para API, agenda, recorrência e notificações | Alto | M | Contrato de datas | M1 |
| Z-007 | Nova | Regressão pode interromper a jornada sem sinal | Automatizar login, captura, triagem, conclusão e recarga em banco e contas fictícias | Alto | M | Z-001 a Z-006 | M2 |
| Z-008 | Melhoria | Formulários e agenda podem ser lentos de operar no celular | Tornar a jornada funcional com polegar, teclado virtual e viewport estreita | Alto | M | Z-003 a Z-005 | M2 |
| Z-009 | Melhoria | Ações essenciais precisam de foco, nomes e anúncios verificáveis | Cobrir jornada por teclado, leitor de tela e alternativas ao arraste | Alto | M | Z-003 a Z-005 | M2 |
| Z-010 | Melhoria | Geração repetida pode criar instâncias iguais | Usar identidade única por ocorrência, idempotência e testes de concorrência | Alto | M | Z-006 | M2 |
| Z-011 | Melhoria | Scheduler pode mover rotinas ao criar compromisso | Mostrar prévia dos deslocamentos, confirmar em transação e devolver conflitos sem vaga | Alto | G | Z-006 e Z-010 | M2 |
| Z-012 | Nova | Sem retrospectiva o acúmulo fica invisível | Exibir revisão semanal com concluídos, carregados e escolha de próximos passos | Alto | M | Z-005 | M2 |
| Z-013 | Nova | Uso espontâneo e economia de esforço são hipóteses sem medida | Registrar diário e eventos mínimos sem texto das tarefas, com cobertura para falhas | Alto | M | Jornada definida | M2 |
| Z-014 | Nova | Candidato externo sem ambiente repetível dificulta diagnóstico | Pipeline com revisão identificada, build, testes e staging isolado | Alto | G | Z-007 | M3 |
| Z-015 | Nova | Perda ou regressão de versão impede recuperar dados | Backup automatizado, ensaio de restauração e rollback com histórico de versões | Alto | G | Z-014 | M3 |
| Z-016 | Melhoria | README marca módulos existentes como pendentes e plataformas como prontas | Atualizar matriz por plataforma e separar instruções de execução do roadmap | Médio | P | Inventário de rotas | M1 |
| Z-017 | Melhoria | Configuração ausente pode falhar tarde ou vazar no log | Validar nomes e formatos de variáveis na inicialização com erros redigidos | Alto | P | Z-001 | M1 |
| Z-018 | Melhoria | Frontend ignora erros TypeScript e ESLint no build | Executar verificações explícitas sem autofix e remover escapes após corrigir bloqueios | Alto | M | Manifests | M1 |
| Z-019 | Melhoria | Dependência SWC explícita de Windows reduz portabilidade | Validar instalação bloqueada em Windows e Linux e usar binário compatível por plataforma | Alto | M | Lockfile e executor Linux | M1 |
| Z-020 | Melhoria | Prisma Client da autenticação e do backend podem ser confundidos | Gerar clientes nos destinos corretos e verificar bootstrap independente dos serviços | Alto | M | Z-001 | M1 |
| Z-021 | Melhoria | SQLite de desenvolvimento está rastreado e acumula alterações | Planejar retirada do arquivo versionado com aprovação e gerar fixtures determinísticas isoladas | Alto | M | Fixture e política de dados legados | M1 |
| Z-022 | Melhoria | Health simples da API pode passar com login indisponível | Definir liveness e readiness separadas com status das dependências essenciais | Alto | M | Z-001 | M1 |
| Z-023 | Melhoria | Redirecionamentos de autenticação já sofreram regressão com barra final | Cobrir login, recuperação, callback e destino interno em teste de navegação | Alto | P | Z-001 | M1 |
| Z-024 | Melhoria | Política de origem precisa ser explícita antes do acesso externo | Restringir CORS à configuração esperada e verificar origem autorizada e não autorizada | Alto | P | Destino web definido | M3 |
| Z-025 | Melhoria | Access token expirado pode interromper captura | Preservar rascunho, retomar após autenticação e evitar logout em cascata por chamadas paralelas | Alto | M | Z-003 | M2 |
| Z-026 | Melhoria | JWKS indisponível ou rotacionado pode interromper sessões | Testar cache, expiração e atualização de chaves com falha segura | Alto | M | Z-001 | M1 |
| Z-027 | Melhoria | JSON inválido pode persistir quando validado tardiamente | Aplicar DTOs nas fronteiras principais e retornar erros por campo antes de efeitos | Alto | M | Contratos API | M1 |
| Z-028 | Melhoria | Status e campo completed da tarefa podem divergir | Formalizar transições e reconciliar fixtures com estados legados | Alto | M | Z-005 | M2 |
| Z-029 | Melhoria | Relações entre tarefas, metas e rotinas podem ficar órfãs | Documentar chaves e comportamentos de exclusão e validar invariantes nos testes | Alto | M | Z-002 | M1 |
| Z-030 | Melhoria | Operações de importação podem deixar estado parcial | Validar versão e plano de importação antes de gravar, com transação e relatório de conflitos | Alto | G | Z-002 e amostras de exportação | M3 |
| Z-031 | Melhoria | Exportação pode perder detalhes de páginas e vínculos | Cobrir entidades e blocos em teste de ida e volta de uma fixture | Médio | M | Z-030 | M3 |
| Z-032 | Melhoria | CSV com entrada livre pode ser interpretado como fórmula | Escapar texto para abertura segura em planilhas e validar com casos fictícios | Médio | P | ExportService | M3 |
| Z-033 | Melhoria | Uploads pessoais exigem checagem de acesso e conteúdo | Autorizar download por propriedade, limitar tamanho e validar tipo real | Alto | M | Z-002 | M3 |
| Z-034 | Melhoria | Busca em várias entidades pode exibir resultados demais | Paginar por categoria com limite de resultados e tratamento de consultas vazias | Médio | M | Z-002 | M3 |
| Z-035 | Melhoria | Busca de nomes com acento depende do modo de consulta | Normalizar pesquisa em português e medir relevância com fixture variada | Médio | P | SearchService | M2 |
| Z-036 | Melhoria | Busca e atalhos podem competir por foco | Definir regra de abertura e fechar com Escape devolvendo foco ao acionador | Médio | P | Z-009 | M2 |
| Z-037 | Melhoria | Briefing fica sujeito a latência e falha do provedor | Carregar Hoje independentemente do modelo, com resumo local e opção de repetir | Alto | M | Z-006 | M2 |
| Z-038 | Melhoria | Uma chamada de modelo pode gravar antes de confirmação | Classificar ferramentas por efeito e exigir proposta revisável antes de ação que muda agenda ou dados | Alto | G | Z-002 | M3 |
| Z-039 | Melhoria | Retentativa do modelo pode repetir escrita já aplicada | Retentar somente passos seguros e usar identificador de execução em escritas confirmadas | Alto | M | Z-038 | M3 |
| Z-040 | Melhoria | Histórico enviado ao modelo aumenta exposição e custo | Limitar contexto por propósito, remover dados desnecessários e reduzir retenção de logs | Alto | M | Inventário de dados | M3 |
| Z-041 | Melhoria | Resposta de IA pode afirmar sucesso sem mudança concluída | Gerar resultado com base nas operações registradas e mostrar falhas parciais explicitamente | Alto | M | Z-039 | M3 |
| Z-042 | Melhoria | Texto dentro de entidades pode induzir instruções indevidas na IA | Tratar texto como entrada não confiável e validar permissões e escrita fora do modelo | Alto | M | Z-038 | M3 |
| Z-043 | Nova | Datas faladas aumentam a digitação quando há pressa | Sugerir interpretação determinística de hoje, amanhã e dia/mês em português com edição antes de salvar | Médio | M | Z-003 e Z-006 | M2 |
| Z-044 | Nova | Capturas dependem de navegar à tela correta | Adicionar atalho global configurável e entrada rápida persistente na navegação móvel | Alto | P | Z-003 e Z-009 | M2 |
| Z-045 | Nova | Capturas longas misturam lembrete e contexto | Disponibilizar nota recolhida e preservar linha original ao extrair o título | Médio | P | Z-003 | M2 |
| Z-046 | Nova | Liberar vários itens da caixa consome toques repetidos | Permitir seleção em lote para agendar ou arquivar, com contagem e feedback parcial | Médio | M | Z-004 | M3 |
| Z-047 | Nova | Itens sem urgência ocupam o planejamento imediato | Adicionar estado Algum dia, com retorno explícito à caixa de entrada | Médio | M | Z-004 | M3 |
| Z-048 | Nova | Itens atrasados tendem a se acumular | Destacar vencidos com ações individuais de reagendar, concluir ou devolver à caixa | Alto | M | Z-004 e Z-006 | M2 |
| Z-049 | Nova | Dia muito cheio dificulta escolher o começo | Permitir fixar até três prioridades diárias e reordená-las | Médio | M | Z-005 | M2 |
| Z-050 | Nova | Prazo e data para trabalhar podem ser diferentes | Guardar prazo separado do dia planejado e exibir ambos onde afetem a decisão | Médio | M | Z-006 | M3 |
| Z-051 | Melhoria | Agenda sem duração realista prejudica avaliação de capacidade | Exibir duração estimada e soma de blocos no dia quando houver estimativas | Médio | M | Z-050 | M3 |
| Z-052 | Melhoria | Arrastar um evento pode ser impreciso em touch ou inacessível | Editar data e hora em formulário acessível com prévia do horário | Alto | M | Z-009 | M2 |
| Z-053 | Melhoria | Horário final inválido pode degradar agenda e resolução de conflito | Validar duração positiva e tratar explicitamente evento que cruza meia-noite | Alto | M | Z-006 | M2 |
| Z-054 | Melhoria | Movimento de ocorrência pode alterar expectativa da série | Separar edição desta ocorrência e das futuras com prévia do impacto | Alto | G | Z-010 | M3 |
| Z-055 | Nova | Feriado ou imprevisto pede exceção sem apagar histórico | Permitir pular uma ocorrência e preservar regra e motivo opcional | Médio | M | Z-010 | M2 |
| Z-056 | Melhoria | Regras semanais e mensais precisam de casos de borda | Cobrir dias úteis, dias selecionados e data ausente no mês com semântica documentada | Alto | M | Z-010 | M2 |
| Z-057 | Nova | Rotina temporariamente impossível precisa voltar no dia certo | Oferecer pausa da série com data opcional de retomada | Médio | M | Z-054 | M3 |
| Z-058 | Nova | Abrir outra agenda para enxergar compromisso é retrabalho | Disponibilizar importação ICS somente leitura com atualização e deduplicação | Médio | G | Z-006 e demanda no piloto | M3 |
| Z-059 | Nova | Próximas obrigações ficam dispersas entre telas | Criar lista de próximos sete dias com agrupamento pela data local | Alto | M | Z-004 | M2 |
| Z-060 | Melhoria | Vistas do calendário podem disputar filtros e perder contexto | Manter data selecionada e filtros ao alternar dia, semana e mês | Médio | M | Z-006 | M3 |
| Z-061 | Melhoria | Revisar conteúdo de uma página durante execução exige navegação extra | Permitir abrir contexto vinculado a tarefa ou meta e retornar ao mesmo ponto | Médio | M | Regras de acesso a páginas | M3 |
| Z-062 | Melhoria | Criar bases de rotina do zero custa configuração | Oferecer um preset enxuto de estudos com propriedades e vistas iniciais editáveis | Médio | M | Modelo existente de presets | M3 |
| Z-063 | Melhoria | Vistas salvas podem perder filtro ou ordenação ao reabrir | Persistir filtros por vista e testar abertura no celular e desktop | Médio | M | Modelo View | M3 |
| Z-064 | Melhoria | Valores flexíveis podem contrariar seus tipos | Validar valores de linha pelo catálogo de propriedades e tratar mudança de tipo | Alto | M | Modelo Property e Row | M3 |
| Z-065 | Melhoria | Mudanças na lista de blocos podem perder texto após falha | Mostrar estado de autosave, preservar rascunho e oferecer retry com verificação de versão | Alto | M | Editor de páginas | M3 |
| Z-066 | Melhoria | Criar muitas subtarefas exige editar repetidamente | Criar checklist no contexto da tarefa sem abrir outro formulário por linha | Médio | M | Vínculos no domínio Task | M3 |
| Z-067 | Nova | Um hábito não deve acumular dívida como tarefa atrasada | Registrar check-in por data local com opção de corrigir um registro passado | Médio | M | Z-010 | M3 |
| Z-068 | Nova | Taxa de hábito pode punir dias não previstos | Calcular aderência por dias programados e mostrar lacunas sem cobrança | Médio | M | Z-067 | M3 |
| Z-069 | Nova | Começar uma sessão de estudo pode exigir alternar aplicativo | Acoplar temporizador simples a uma tarefa e retomar estado pelo relógio | Médio | M | Z-005 e sinal no piloto | M3 |
| Z-070 | Nova | Sessões são difíceis de comparar sem registro | Salvar resumo de sessões concluídas com duração e tarefa associada, por opção | Baixo | M | Z-069 | Depois |
| Z-071 | Nova | Avaliação diária pode virar nova tarefa burocrática | Oferecer fechamento curto com itens pendentes e uma nota opcional | Médio | M | Z-012 | M2 |
| Z-072 | Melhoria | Relatório pode divergir da lista de executados | Usar a mesma fonte de conclusão em Hoje e Relatório com comparação por data | Médio | M | Z-005 e Z-006 | M2 |
| Z-073 | Melhoria | Avisos podem duplicar após rodar o cron em várias réplicas | Criar chave única por destinatário, tipo e ocorrência e verificar reprocessamento | Alto | M | Z-010 | M3 |
| Z-074 | Nova | Alertas fora do horário tiram foco | Configurar horário silencioso e fuso para lembretes opt-in | Médio | M | Z-073 e Z-006 | M3 |
| Z-075 | Melhoria | Aviso sem destino joga o usuário de volta à navegação | Abrir o item relacionado com feedback se ele foi removido ou perdeu acesso | Médio | P | Z-002 | M3 |
| Z-076 | Nova | Títulos privados podem aparecer em notificações compartilhadas | Oferecer conteúdo discreto por padrão para canais fora do app | Alto | P | Canal externo validado | Depois |
| Z-077 | Melhoria | Cores e animações podem impedir leitura | Auditar contraste por tema e respeitar preferência de movimento reduzido | Alto | M | Tokens do design system | M3 |
| Z-078 | Melhoria | Mensagens conflitantes de vazio e falha geram desconfiança | Definir feedback consistente por carregamento, ausência de dados e erro recuperável | Alto | M | Z-005 | M2 |
| Z-079 | Melhoria | Tela pode deslocar conteúdo ao carregar componentes pesados | Reservar espaço para timeline, painel de IA e calendário | Médio | P | Medição visual | M3 |
| Z-080 | Melhoria | FullCalendar e chat podem pesar no acesso a Hoje | Medir bundle por rota e carregar módulos pesados sob demanda | Médio | M | Baseline de build | M3 |
| Z-081 | Melhoria | Várias chamadas para montar Hoje geram espera e inconsistência | Medir fan-out e servir uma leitura consolidada e limitada para o dia | Médio | M | Z-006 | M3 |
| Z-082 | Melhoria | Listas extensas degradam filtro, rolagem e acesso por leitor | Paginar registros de bases com ordem estável e preservação de foco | Médio | M | Z-064 | M3 |
| Z-083 | Melhoria | Requisição de consulta antiga pode sobrescrever resultado novo | Cancelar busca e calendário quando parâmetros mudarem e preservar o último estado confirmado | Médio | P | Cliente HTTP | M3 |
| Z-084 | Melhoria | Filtros por usuário e dia podem perder desempenho em volume | Medir planos com massa fictícia e adicionar índices compostos quando sustentados | Médio | M | Banco alvo do staging | M3 |
| Z-085 | Melhoria | Falhas HTTP dificultam cruzar web, API e autenticação | Propagar identificador de requisição e registrar logs sem texto das tarefas | Alto | M | Z-022 | M3 |
| Z-086 | Nova | Falhas do cron podem passar despercebidas | Medir execução, atraso, quantidade de notificações e falhas com alerta e responsável | Médio | M | Z-073 | M3 |
| Z-087 | Nova | Falhas do Gemini podem aumentar latência e custo | Instrumentar latência, erro, timeout e uso sem gravar prompts completos | Alto | M | Z-040 | M3 |
| Z-088 | Melhoria | Rotas caras podem ser chamadas em excesso | Aplicar limites por conta ou origem nos fluxos de IA, pesquisa e uploads | Alto | M | Z-002 | M3 |
| Z-089 | Melhoria | Combinação de schema, ambiente e chave antiga pode falhar em restart | Testar atualização de staging sobre fixture de versão anterior antes de promover | Alto | M | Z-014 | M3 |
| Z-090 | Melhoria | Destino PostgreSQL aparece no README, schema Zenith usa SQLite | Escolher banco alvo e validar semântica, migração e retorno em cópia descartável | Alto | G | Z-015 e volume projetado | M3 |
| Z-091 | Nova | Operador precisa diagnosticar indisponibilidade rápido | Criar runbook por sintoma para auth, dados e IA com contatos e verificações | Alto | M | Z-022 e Z-085 | M3 |
| Z-092 | Nova | Política de retenção e fornecedores precisa ser compreensível | Disponibilizar aviso contextual para a beta cobrindo IA, telemetria e atendimento, com revisão antes de publicar | Alto | M | Inventário e escopo de coleta | M3 |
| Z-093 | Nova | Pessoas precisam conseguir encerrar uma conta e remover seus dados | Fluxo de exclusão com confirmação, escopo explícito e tratamento de backups | Alto | G | Z-002 e Z-092 | M4 |
| Z-094 | Nova | Participantes externos precisam entrar com controle de escopo | Habilitar convites revogáveis, limite de coorte e expiração | Alto | M | Z-014 e Z-015 | M3 |
| Z-095 | Nova | Feedback em beta pode perder o contexto da tarefa | Disponibilizar formulário de feedback com contexto técnico opcional e sem conteúdo de rotina por padrão | Médio | M | Política de dados do piloto | M3 |
| Z-096 | Nova | Erros de lançamento precisam de dono e caminho de atendimento | Disponibilizar canal de suporte com triagem, níveis de severidade e resposta esperada | Alto | M | Z-091 | M4 |
| Z-097 | Nova | Usuário novo pode enfrentar uma tela vazia | Oferecer checklist de primeiro uso removível e exemplos fictícios opt-in | Médio | M | Z-003 a Z-005 | M3 |
| Z-098 | Nova | Mudanças de versão podem surpreender quem usa todo dia | Publicar notas curtas de versão ligadas ao impacto nos fluxos e na migração | Baixo | P | Z-014 | M4 |
| Z-099 | Nova | Lançamento sem critério de interrupção amplia impacto de falhas | Liberar por coorte e usar gatilhos de pausa com base em saúde e regressões observadas | Alto | M | Z-015 e Z-094 | M4 |
| Z-100 | Nova | Abertura frequente no navegador móvel pode exigir passos extras | Experimentar instalação PWA com manifesto e atalho para capturar, sem cache de dados pessoais | Médio | M | Z-008 e evidência do piloto | M3 |
| Z-101 | Nova | Captura pode falhar sem conectividade | Implementar fila local mínima de capturas com reconciliação e descarte ao sair da conta | Médio | G | Z-003 e evidência de uso offline | Depois |
| Z-102 | Nova | Receber conteúdo de outro app pode exigir copiá-lo manualmente | Adicionar integração com compartilhamento do sistema após validar plataformas e formatos | Médio | G | Z-100 e análise dos navegadores | Depois |
| Z-103 | Melhoria | A árvore Tauri existe, mas a jornada desktop requer qualificação | Testar login, links, build e atualização assinada em ambiente de desktop alvo | Baixo | G | Jornada web validada | Depois |
| Z-104 | Nova | Aplicativo nativo aumenta cobertura de recursos do sistema | Avaliar cliente mobile nativo após medir o limite real da experiência web | Baixo | G | Z-100 e demanda demonstrada | Depois |
| Z-105 | Nova | Planejamento pode se espalhar entre Zenith e calendário externo | Explorar sincronização bidirecional com tratamento de conflito, repetição e autorização | Baixo | G | Z-058 e demanda demonstrada | Depois |
| Z-106 | Nova | Metas grandes podem perder vínculo com execução diária | Mostrar execução recente e tarefas futuras da meta na revisão com ligação aos marcos | Médio | M | Z-012 | M3 |
| Z-107 | Melhoria | Organizar páginas por mover em árvore pode gerar referências inválidas | Checar direitos, impedir ciclos e atualizar listagem após mover | Médio | M | Z-002 | M3 |
| Z-108 | Nova | Mercado e disposição a pagar ainda são hipóteses | Entrevistar participantes sobre substitutos e custo de mudança, sem cobrança na beta | Médio | P | Coorte externa e jornada validada | M3 |

## Para depois

- **Cobertura de plataforma** — desktop distribuído e aplicativo nativo (Z-103 e Z-104) após medir limites reais da web móvel.
- **Sincronização e captura fora da web** — fila offline, destino de compartilhamento e sincronização bidirecional (Z-101, Z-102 e Z-105) após evidência de uso recorrente.
- **Aprofundar engajamento** — histórico de foco (Z-070), gamificação e IA proativa após confirmar retorno espontâneo. Sugestões de uso do piloto orientam a escolha.
- **Monetização** — repetir pesquisa de Z-108 com usuários que concluíram o ciclo e retornaram. Colaboração em equipe e planos pagos dependem de problema e demanda corroborados.

## Regra de execução

Iniciar com Z-001 e Z-002. A primeira fatia de produto percorre **Z-003 → Z-004 → Z-005**, com Z-006 resolvendo a data local. Z-007, Z-008 e Z-009 conferem robustez, celular e acessibilidade na própria jornada antes de ampliar o escopo. As propostas estarão prontas para entrar em desenvolvimento quando tiverem aceite verificável e ambiente de teste.
