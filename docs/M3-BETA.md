# Preparação da beta do Zenith

## Verificação de um candidato

O workflow [Verificar Zenith](../.github/workflows/verify.yml) valida instalação
pelo lockfile no Linux, migrações em SQLite descartável, regressões da API,
lint e build web. A jornada autenticada usa Chromium, banco descartável e duas
contas fictícias no NexusAuth. Cobre login, perda de resposta na captura, nova
tentativa sem duplicar, planejamento, conclusão, revisão, calendário,
criação de página sem perder a sessão e isolamento entre
contas. Use o hash do commit aprovado como referência. O uso diário e as
verificações em staging têm registros próprios.

## Antes do primeiro convite

1. Fechar o piloto de 14 dias com o [registro do M2](M2-PILOTO.md). Reproduzir as
   falhas relevantes e decidir quais impedem o uso contínuo.
2. Escolher e autorizar um ambiente de staging separado, com URLs TLS e
   segredos próprios. Identificar o responsável por liberar versões e reverter.
   Configurar web, API, NexusAuth, armazenamento, origem autorizada e e-mail
   com valores exclusivos do ambiente.
3. Validar duas contas fictícias no domínio de staging. Cada uma deve ver
   apenas suas tarefas, rotinas, dados e arquivos. Testar cadastros, login,
   falhas de prontidão e a jornada de captura e conclusão no celular.
4. Confirmar backup e restauração em base descartável, incluindo auth,
   banco do produto e arquivos usados. Registrar versão restaurada, tempo
   medido e decisões de rollback.
5. Definir aviso de privacidade, retenção e canal de contato. Começar com
   convite revogável e acesso limitado à coorte do plano de produto.

## Configuração e recuperação

- Configure `ZENITH_WEB_ORIGIN` com a origem pública HTTPS exata da web,
  sem barra final. O endpoint de sessão usa essa origem para autorizar
  requisições e marcar os cookies como `Secure`. Defina `NEXUS_AUTH_URL` e
  `ZENITH_API_URL` se a web precisar usar endereços internos para alcançar as
  APIs. Valide login, recarga, rotação e logout atrás do proxy de staging.
- Defina `NODE_ENV=production` na API Zenith. Se a web e a API tiverem
  origens distintas, configure `CORS_ORIGINS` nas duas APIs com a origem
  completa da web, por exemplo `https://beta.zenith.example`. Confirme o
  preflight da origem autorizada e a ausência de autorização para outra
  origem. As requisições privadas continuam exigindo sessão.
- Verifique `/health` na API e no NexusAuth, `/ready` na API Zenith e um
  login de ponta a ponta. Registre o commit e a versão da migração no
  registro de passagem de versão.
- Antes de liberar, preserve um backup cifrado do PostgreSQL do auth, um
  snapshot consistente do SQLite e os arquivos de upload. Mantenha chaves
  de assinatura do NexusAuth e chaves de criptografia sob controle de acesso.
  Documente se a recuperação exige novo login por perda de estado do Redis
  ou rotação de chaves. Ensaie em um ambiente separado e compare identidade,
  tarefas, acesso entre contas e integridade dos arquivos.
- Suspenda os convites diante de erro recorrente no login ou na captura, ou
  de qualquer perda, duplicação ou exposição de dados. O responsável pelo
  ambiente deve restaurar a versão anterior do código quando compatível com
  o schema atual. Se houver dano nos dados, preserve o estado para diagnóstico
  e ensaie o retorno a um backup isolado antes de trocar a base em uso.

## Entrega de links de conta

- Configure `ACCOUNT_LINK_ORIGIN` com a origem HTTPS exata da web, sem barra
  final. No NexusAuth, defina `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` e, quando
  exigidos pelo servidor, `SMTP_USER` e `SMTP_PASS`. Use TLS direto na porta 465
  ou servidor com STARTTLS. Confirme que `REQUIRE_EMAIL_VERIFIED=true`.
- O cadastro web aguarda a confirmação do endereço. O usuário pode solicitar
  outro link no login, inclusive após falha de entrega. O transporte registra
  a categoria da falha sem incluir destinatário ou token. A fila em memória
  é limitada e pode perder envios se o processo parar. Reenvio e recuperação
  são as rotas para pedir um novo link nessas condições.
- A redefinição revoga as sessões e os refresh tokens no NexusAuth. Um JWT
  já emitido pode ser aceito até expirar em serviços que validam apenas sua
  assinatura. Verifique o comportamento ponta a ponta no staging.
- O CI usa um coletor SMTP descartável. A entrega em caixas reais, as
  configurações de remetente e as chaves reais de CAPTCHA exigem validação
  no staging. Confirme também os links de login social antes dos convites.
- Para o cadastro, configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no build web,
  `TURNSTILE_SECRET_KEY` no NexusAuth e `TURNSTILE_EXPECTED_HOSTNAME` com o
  hostname da web sem protocolo ou porta. O NexusAuth confere a ação
  `zenith_register` quando o hostname esperado está configurado. Teste
  sucesso, expiração e nova tentativa. Use chaves exclusivas do ambiente.

## Evidência local

- A checagem de CORS passou via HTTP. A origem permitida recebeu o cabeçalho
  de autorização no preflight. A origem externa ficou sem o cabeçalho.
  A API respondeu HTTP 200 em `/ready`.
- Em ambiente descartável, o PostgreSQL foi restaurado com pg_restore e o
  Prisma confirmou as quatro migrações. O SQLite manteve as tarefas e passou
  nas checagens de integridade. O upload recuperado manteve o SHA-256, com
  acesso restrito à conta proprietária.
- O NexusAuth demorou a ficar pronto nas duas primeiras tentativas. Após
  verificar as migrações e inicializar a aplicação diretamente com novas
  chaves de teste, duas contas fizeram login e a API preservou identidades,
  tarefas e isolamento. O backup levou cerca de 120 s e a recuperação
  bem-sucedida, 118 s. Repita a recuperação no staging antes dos convites.
- A atualização de `proxy-addr` para 2.0.8 e do bcrypt para 6.0.0 removeu
  dois alertas críticos. O bcrypt 6 validou um hash gerado pela versão 5 em
  contêiner Linux.
- No candidato com Next.js 16, a auditoria da árvore de produção caiu
  de 25 para 12 alertas altos e de 39 para 5 moderados, com zero críticos.
  O CLI do shadcn, pacotes do Tiptap e o Nodemailer saíram da árvore por
  falta de uso no código. Os lockfiles passaram a usar `ip-address` 10.7.6
  e `source-map-js` 1.2.4 onde aplicável. A instalação isolada do NexusAuth
  registrou zero críticos, 9 altos e 4 moderados.
- Rode `npm audit --omit=dev` no workspace e na raiz isolada do NexusAuth
  antes de liberar uma versão. Avalie os alertas restantes conforme os
  caminhos usados em produção. Antes dos convites, faça os mesmos fluxos
  de e-mail com o domínio, remetente e CAPTCHA do staging.

## Primeira sessão da beta

Oriente cada participante a capturar uma tarefa fictícia, encontrá-la na Caixa
de Entrada, trazê-la para Hoje, concluir e consultar a revisão. Peça que volte
no dispositivo habitual para planejar um dia real. Registre bloqueios,
alternativas usadas e dúvidas espontâneas. A contagem de retorno usa uma ação
na segunda semana, conforme o plano de produto.

## Evidência da coorte

Registrar, sem conteúdo das tarefas, o número de pessoas convidadas, ativadas
e que retornaram com uma ação na segunda semana. Anotar bloqueios de acesso,
abandono, problemas de privacidade e custo de suporte. A decisão de ampliar
acesso exige o resultado real desse período e o aceite de segurança e recuperação.
