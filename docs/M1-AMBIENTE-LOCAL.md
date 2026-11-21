# Ambiente de verificação do Zenith

Este roteiro usa uma instância local do NexusAuth com PostgreSQL e Redis próprios e uma base SQLite para o Zenith. As portas de teste são 3100 para o NexusAuth, 3101 para a web e 3102 para a API. Use PowerShell 7, Node.js com npm, Docker e uma versão do Compose que suporte as tags `!reset` e `!override`.

## 1. Preparar as dependências

Execute na raiz do repositório. O npm instala as dependências do lockfile.

```powershell
npm ci
```

## 2. Iniciar a autenticação de teste

Em um terminal, a partir da raiz:

```powershell
Set-Location apps/auth-service
$fixtureFile = Join-Path (Get-Location).Path '.env.zenith-test.local'
if (!(Test-Path -LiteralPath $fixtureFile)) {
    $postgresSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $redisSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    [IO.File]::WriteAllLines($fixtureFile, @(
        "POSTGRES_PASSWORD=$postgresSecret"
        "REDIS_PASSWORD=$redisSecret"
    ))
}
$env:NEXUS_AUTH_ENV_FILE = $fixtureFile
$composeArgs = @('-p', 'zenith-m1', '--env-file', $fixtureFile, '-f', 'docker-compose.yml', '-f', 'compose.zenith-test.yml')
docker compose @composeArgs config --quiet
docker compose @composeArgs up -d api --wait --wait-timeout 180
```

O Compose inicia apenas os serviços necessários para o login. O NexusAuth gera chaves de teste e aplica as migrações Postgres no boot. O PostgreSQL de teste usa armazenamento temporário em memória e recria o banco vazio ao reiniciar. O arquivo de ambiente fica ignorado pelo Git. O perfil local aceita contas fictícias sem confirmação de e-mail, com validação da assinatura JWT pela API Zenith.

## 3. Iniciar API e web

Em outro terminal, a partir da raiz:

```powershell
Set-Location apps/backend
$env:DATABASE_URL = 'file:./zenith-fixture.sqlite'
$env:ZENITH_TEST_BACKEND = 'true'
$env:NEXUS_AUTH_URL = 'http://localhost:3100'
$env:NEXUS_JWT_ISSUER = 'nexusauth'
$env:HOST = '127.0.0.1'
$env:PORT = '3102'
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Se o engine do Prisma falhar no Windows, use a alternativa abaixo para criar
uma base fictícia com o Prisma 6.19.3 no Linux. Execute no terminal da API, em
`apps/backend`. O contêiner recebe apenas o schema e as migrações copiados
para um diretório temporário novo.

```powershell
$fixtureDir = Join-Path $env:TEMP ('zenith-fixture-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixtureDir | Out-Null
Copy-Item -Path prisma/schema.prisma,prisma/migrations -Destination $fixtureDir -Recurse
docker run --rm --mount "type=bind,src=$fixtureDir,dst=/fixture" -e DATABASE_URL=file:/fixture/zenith.sqlite node:24-alpine sh -ec 'cd /tmp; npm install --no-audit --no-fund prisma@6.19.3; ./node_modules/.bin/prisma migrate deploy --schema /fixture/schema.prisma; ./node_modules/.bin/prisma migrate status --schema /fixture/schema.prisma'
if ($LASTEXITCODE -ne 0) { throw 'Migração de teste falhou.' }
$env:DATABASE_URL = 'file:' + (Join-Path $fixtureDir 'zenith.sqlite').Replace('\', '/')
npm run dev
```

Em um terceiro terminal, a partir da raiz:

```powershell
Set-Location apps/web
$env:ZENITH_TEST_WEB = 'true'
$env:NEXT_PUBLIC_NEXUS_AUTH_URL = 'http://localhost:3100'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:3102'
npm run dev -- --hostname 127.0.0.1 --port 3101
```

Abra [Hoje](http://localhost:3101/hoje/) e entre com uma conta criada na tela de cadastro local. Use nome fictício, endereço no domínio reservado `example.com` e uma senha exclusiva de teste. A conta do ambiente fica no PostgreSQL do projeto `zenith-m1`.

## 4. Verificar e encerrar

Na raiz, em outro terminal, execute:

```powershell
pwsh -NoProfile -File scripts/verify-zenith-m1.ps1
```

O script cria duas contas fictícias novas. Verifica as respostas de saúde, o redirecionamento da página privada, a sessão assinada e o isolamento de agenda, conversas e briefing. Use apenas contra as portas do ambiente descrito aqui. Para verificar o caminho interativo, acesse Hoje em uma janela anônima, faça login e confirme o retorno à rota solicitada. O cliente guarda os tokens em memória. Uma recarga completa pede nova autenticação e preserva a rota de destino.

Se uma verificação falhar, confira `http://localhost:3100/health` no NexusAuth, `http://localhost:3102/health` na API e `http://localhost:3102/auth/health` na integração. Inspecione o estado com `docker compose @composeArgs ps` e o boot com `docker compose @composeArgs logs --tail 80 api`. Health 200 na API confirma o processo e a checagem separada do auth confirma a integração.

Para parar, encerre web e API com Ctrl+C e rode `docker compose @composeArgs stop` no terminal do NexusAuth. O SQLite de teste permanece na pasta Prisma. O arquivo `dev.db` do checkout fica fora do roteiro.

### Saúde e prontidão

- `GET /health` indica que o processo do Zenith responde.
- `GET /ready` verifica uma leitura na tabela de usuários e consulta a saúde do NexusAuth. Responde HTTP 200 quando ambos estão disponíveis e HTTP 503 com os estados das dependências quando uma verificação falha. O smoke confere o caminho saudável.
- `GET /auth/health` permite diagnosticar o NexusAuth separadamente.

## Estado da validação em 20/11/2026

Para repetir o smoke sem consumir a cota de cadastros, reutilize duas contas fictícias distintas do ambiente atual:

```powershell
$a = Get-Credential -Message 'Conta fictícia A'
$b = Get-Credential -Message 'Conta fictícia B'
./scripts/verify-zenith-m1.ps1 -AccountA $a -AccountB $b
```

- Web local respondeu HTTP 200 na tela de login. O Chrome confirmou o redirecionamento de `/hoje/` para o login. A API local respondeu HTTP 200 em `/health`.
- Os três testes de isolamento com dependências simuladas passaram para calendário, parser/briefing e ferramentas do chat. Uma conta fictícia fez login no NexusAuth e recebeu HTTP 200 em `/auth/me` no Zenith. O isolamento HTTP com duas contas e o retorno autenticado a Hoje ainda exigem o smoke do ambiente completo.
- As quatro migrações do NexusAuth foram aplicadas no PostgreSQL descartável. A imagem reconstruída conferiu as migrações com o Prisma instalado no build e a integração respondeu HTTP 200 em `/auth/health`. O cadastro fictício respondeu HTTP 201. A repetição do smoke atingiu o limite de cadastros por origem e recebeu HTTP 429.
- No Windows, `prisma migrate deploy` no SQLite retornou `Schema engine error`. A aplicação direta dos arquivos SQL em uma base fictícia passou em `PRAGMA integrity_check`. Isso permitiu iniciar a API isolada e deixou pendente a repetição do roteiro pelo comando Prisma.
- A branch de progresso pode ser revisada enquanto as verificações do marco estão em andamento.

## Verificação integrada em 21/11/2026

- O NexusAuth, o PostgreSQL e o Redis responderam saudáveis no projeto descartável. A web respondeu 200 no login, e `GET /ready` confirmou o banco e a autenticação.
- Duas contas fictícias fizeram login com o NexusAuth. A API reconheceu identidades distintas e confirmou isolamento de compromissos, conversas e briefing. As rotas de calendário e briefing recusaram requisições sem sessão.
- Em Chrome com viewport de 390 × 844, abrir `/hoje/` redirecionou para o login. O formulário recebeu confirmação do NexusAuth e da API, e o navegador abriu Hoje.
- A tentativa de `prisma migrate deploy` em banco novo voltou a retornar `Schema engine error` no Windows. No Linux, o Prisma 6.19.3 aplicou as quatro migrações em um SQLite descartável. `prisma migrate status` confirmou o schema atualizado.
- O build web de produção compilou, passou pela checagem de tipos e gerou 17 páginas. O snapshot reutilizou as dependências locais. A verificação automática do lockfile do Next foi desativada nessa execução. O lint separado passou com quatro avisos preexistentes sobre imagens.
- Estado: M1 concluído para o fluxo local com a alternativa Linux documentada. A migração nativa no Windows, instalação limpa com lockfile e jornada OAuth não foram comprovadas nesta validação. O M2 começa pela captura manual de uma tarefa, triagem e conclusão em Hoje.
