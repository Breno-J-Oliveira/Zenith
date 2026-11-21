# Piloto de rotina do Zenith

Use este roteiro com a versão do M2 que passar no teste de navegador. Comece
com duas contas fictícias para a verificação técnica. Use uma conta pessoal
somente depois de confirmar o isolamento e escolher o ambiente para o piloto.

## Verificação antes do piloto

1. Em Hoje, capture uma tarefa com um título e confirme que ela apareceu na
   Caixa de Entrada. Repita a captura com o mesmo identificador de operação
   e verifique que a API retorna o mesmo ID.
2. Mova a tarefa para outra data e confira Próximos dias. Depois mova para
   Hoje, conclua, desfaça e confira o estado após abrir novamente com a
   mesma conta. Se a recarga pedir login, entre de novo.
3. Confirme que a segunda conta não vê nem consegue alterar essa tarefa.
   Verifique o mesmo fluxo por teclado e em viewport móvel.
4. Gere a mesma rotina duas vezes. Cada ocorrência deve aparecer uma vez.
   Abra Relatório e confira o estado das tarefas com datas nos últimos sete
   dias, incluindo a data civil de hoje em São Paulo.
5. Com o provedor de IA indisponível, confirme que captura, triagem e
   conclusão continuam funcionando.

## Evidência técnica

- API local com SQLite e duas contas fictícias do NexusAuth. Captura
  concorrente retornou um único ID. A segunda conta recebeu 404 ao tentar
  acessar a tarefa. A API rejeitou título e data inválidos. Foram verificadas
  triagem, conclusão, reabertura, janela de revisão e geração concorrente de
  rotinas sem duplicatas.
- Chrome em 390 × 844 com o build de produção. A captura por Enter preservou
  o texto quando a primeira resposta foi interrompida depois da gravação.
  A tentativa seguinte reutilizou o identificador e mostrou uma única tarefa.
  O teste simulou um erro 503 no briefing, planejou a tarefa em duas datas e
  confirmou conclusão, reabertura após recarga e presença na revisão semanal.
- Nas verificações locais, as 14 regressões da API passaram. O build web
  gerou 17 rotas. O lint encerrou com quatro avisos de imagens em componentes
  sem alteração nesta etapa.
- A sessão usa tokens em memória. Ao recarregar a página, entre novamente
  para retomar o fluxo. A revisão usa as datas planejadas dos últimos sete
  dias e mostra o estado atual das tarefas.

## Ambiente do piloto local

Use um projeto Compose separado com volumes persistentes. O perfil descartável
do M1 recria o PostgreSQL quando ele reinicia. No piloto, use a mesma conta
durante os 14 dias e mantenha dados e backups fora do Git.

No passo 2 do [roteiro do M1](M1-AMBIENTE-LOCAL.md), use
`.env.zenith-pilot.local` para `$fixtureFile` e troque os argumentos do Compose
antes de iniciar a API de autenticação.

```powershell
$composeArgs = @('-p', 'zenith-pilot', '--env-file', $fixtureFile, '-f', 'docker-compose.yml', '-f', 'compose.zenith-pilot.yml')
docker compose @composeArgs config --quiet
docker compose @composeArgs up -d api --wait --wait-timeout 180
```

No passo 3, use um SQLite exclusivo em um caminho absoluto local
(`file:C:/caminho-do-piloto/zenith-pilot.sqlite`). Se precisar usar a alternativa
Linux para migrar o SQLite, mova a base recém-criada para o caminho definitivo.
Configure `NEXUS_AUTH_URL=http://localhost:3120` e `PORT=3122` na API.
Na web, use `NEXT_PUBLIC_NEXUS_AUTH_URL=http://localhost:3120`,
`NEXT_PUBLIC_API_URL=http://localhost:3122` e passe `--port 3121` para o Next.

Abra [Hoje](http://localhost:3121/hoje/) e use o cadastro local. A web e as
duas APIs escutam no próprio computador. A confirmação de e-mail fica
desativada neste perfil local. Para pausar e liberar memória, encerre web e API
e use `docker compose @composeArgs stop`. A retomada usa o mesmo projeto,
o mesmo arquivo de ambiente e o mesmo SQLite. Preserve os volumes do Compose
para manter contas, sessões e chaves do piloto.

## Registro diário

Antes do piloto, observe o método atual por três dias. Durante 14 dias,
registre uma linha por tentativa relevante. Use um identificador neutro no
lugar do título da tarefa. Marque cancelamentos intencionais separadamente.

| Dia | Dispositivo | Etapa | Gatilho | Tempo | Resultado | Motivo ou alternativa |
| --- | --- | --- | --- | --- | --- | --- |
| Exemplo fictício | Celular | Captura | Espontâneo | 8 s | Salvo | — |

Ao fim de cada dia, anote o tempo aproximado de planejamento e se precisou
consultar outra ferramenta. Nos dias 7 e 14, registre o que ficou na Caixa
de Entrada e os motivos recorrentes de abandono. Mantenha esses registros
fora do GitHub.

## Critério para avançar

Compare o piloto com a linha de base após dez ou mais capturas comparáveis.
Os alvos iniciais são reduzir a mediana de captura em 30% ou chegar a 10 s,
voltar espontaneamente com ação em 8 de 14 dias (4 na segunda semana) e ter
até 15% de abandonos evitáveis. Tempo de planejamento igual ou menor e zero
perdas, duplicações ou alterações inesperadas completam a checagem.

Consulte o [plano de produto](PLANO-DE-PRODUTO-ZENITH.md) para interpretar a
amostra e decidir se vale avançar para a beta por convite. O piloto requer
uso real do Breno por 14 dias.
