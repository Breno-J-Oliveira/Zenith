#requires -Version 7.0
param(
    [PSCredential]$AccountA,
    [PSCredential]$AccountB
)

$ErrorActionPreference = 'Stop'
if ([bool]$AccountA -ne [bool]$AccountB) {
    throw 'Informe as duas contas fictícias ou deixe os dois parâmetros vazios.'
}
$authUrl = 'http://localhost:3100'
$apiUrl = 'http://localhost:3102'
$webUrl = 'http://localhost:3101'

function Invoke-FixtureRequest {
    param(
        [string]$Uri,
        [string]$Method = 'Get',
        [hashtable]$Body,
        [string]$Token,
        [int]$ExpectedStatus = 200
    )

    $options = @{
        Uri = $Uri
        Method = $Method
        TimeoutSec = 60
        SkipHttpErrorCheck = $true
    }
    if ($Token) { $options.Headers = @{ Authorization = "Bearer $Token" } }
    if ($null -ne $Body) {
        $options.ContentType = 'application/json'
        $options.Body = ConvertTo-Json -InputObject $Body -Compress -Depth 8
    }
    try {
        $response = Invoke-WebRequest @options
    } catch {
        throw "$Method $Uri falhou na conexão: $($_.Exception.Message)"
    }
    if ($response.StatusCode -ne $ExpectedStatus) {
        throw "$Method $Uri retornou $($response.StatusCode), esperado $ExpectedStatus."
    }
    if ($response.Content) {
        return ConvertFrom-Json -InputObject $response.Content -NoEnumerate
    }
}

function New-FixtureAccount {
    param([string]$Label)
    $suffix = [Guid]::NewGuid().ToString('N')
    $credentials = @{ email = "zenith-$Label-$suffix@example.com"; password = "Fixture!9a$suffix" }
    $registration = $credentials.Clone()
    $registration.name = "Zenith Fixture $Label"
    $null = Invoke-FixtureRequest "$authUrl/auth/register" -Method Post -Body $registration -ExpectedStatus 201
    return [PSCredential]::new($credentials.email, (ConvertTo-SecureString $credentials.password -AsPlainText -Force))
}

function Get-FixtureToken {
    param([PSCredential]$Account)
    $credentials = @{
        email = $Account.UserName
        password = $Account.GetNetworkCredential().Password
    }
    $session = Invoke-FixtureRequest "$authUrl/auth/login" -Method Post -Body $credentials
    if (!$session.accessToken) { throw 'O login retornou sem access token.' }
    return $session.accessToken
}

$null = Invoke-FixtureRequest "$authUrl/health"
$null = Invoke-FixtureRequest "$apiUrl/health"
$null = Invoke-FixtureRequest "$apiUrl/auth/health"
$null = Invoke-FixtureRequest "$apiUrl/calendar" -ExpectedStatus 401
$null = Invoke-FixtureRequest "$apiUrl/ai/briefing" -ExpectedStatus 401
$loginPage = Invoke-WebRequest "$webUrl/hoje/" -MaximumRedirection 2 -TimeoutSec 60
if ($loginPage.BaseResponse.RequestMessage.RequestUri.AbsolutePath -ne '/login/') {
    throw 'A rota Hoje deveria levar um visitante ao formulário de login.'
}

if (!$AccountA) {
    $AccountA = New-FixtureAccount 'a'
    $AccountB = New-FixtureAccount 'b'
}
$tokenA = Get-FixtureToken $AccountA
$tokenB = Get-FixtureToken $AccountB
$userA = Invoke-FixtureRequest "$apiUrl/auth/me" -Token $tokenA
$userB = Invoke-FixtureRequest "$apiUrl/auth/me" -Token $tokenB
if (!$userA.id -or !$userB.id -or $userA.id -eq $userB.id) {
    throw 'A API deve reconhecer duas identidades distintas.'
}

$today = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId(
    [DateTimeOffset]::UtcNow, 'America/Sao_Paulo'
).ToString('yyyy-MM-dd')
$title = "Compromisso fictício $([Guid]::NewGuid().ToString('N'))"
$appointment = @{ title = $title; date = $today; startTime = '10:00'; endTime = '10:30' }
$null = Invoke-FixtureRequest "$apiUrl/appointments" -Method Post -Body $appointment -Token $tokenA -ExpectedStatus 201
$eventsA = Invoke-FixtureRequest "$apiUrl/calendar?from=$today&to=$today" -Token $tokenA
$eventsB = Invoke-FixtureRequest "$apiUrl/calendar?from=$today&to=$today" -Token $tokenB
if ($eventsA.title -notcontains $title -or $eventsB.title -contains $title) {
    throw 'A agenda deve mostrar o compromisso somente na conta proprietária.'
}

$thread = Invoke-FixtureRequest "$apiUrl/chat/threads" -Method Post -Body @{ title = 'Conversa fictícia' } -Token $tokenA -ExpectedStatus 201
$threadId = $thread.id
$null = Invoke-FixtureRequest "$apiUrl/chat/threads/$threadId" -Token $tokenA
$null = Invoke-FixtureRequest "$apiUrl/chat/threads/$threadId" -Token $tokenB -ExpectedStatus 404
$briefingA = Invoke-FixtureRequest "$apiUrl/ai/briefing" -Token $tokenA
$briefingB = Invoke-FixtureRequest "$apiUrl/ai/briefing" -Token $tokenB
if ($briefingA.source -ne 'template' -or $briefingB.source -ne 'template') {
    throw 'A verificação local espera briefing sem chamada externa ao provedor de IA.'
}
if (!$briefingA.text.Contains($title) -or $briefingB.text.Contains($title)) {
    throw 'O briefing deve resumir somente os registros da conta atual.'
}
Write-Output 'M1 passou: saúde, sessão real de duas contas e isolamento de agenda, chat e briefing.'
