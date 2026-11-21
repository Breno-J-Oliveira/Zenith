# Preparação da beta do Zenith

## Verificação de um candidato

O workflow [Verificar Zenith](../.github/workflows/verify.yml) valida instalação
pelo lockfile no Linux, migrações em SQLite descartável, regressões da API,
lint e build web. Use o hash do commit verificado como referência. A jornada
com o NexusAuth e o piloto continuam com verificações próprias.

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

## Evidência da coorte

Registrar, sem conteúdo das tarefas, o número de pessoas convidadas, ativadas
e que retornaram com uma ação na segunda semana. Anotar bloqueios de acesso,
abandono, problemas de privacidade e custo de suporte. A decisão de ampliar
acesso exige o resultado real desse período e o aceite de segurança e recuperação.
