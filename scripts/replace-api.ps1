# Substitui a constante API nos ficheiros restantes e converte os fetches.
# Ficheiros a processar:
$files = @(
    'app\rotinas\page.tsx',
    'app\paginas\page.tsx',
    'app\paginas\[id]\page.tsx',
    'app\databases\page.tsx',
    'components\databases\DatabaseTable.tsx',
    'components\databases\DatabaseGallery.tsx',
    'components\calendar\CalendarView.tsx'
)

$root = 'f:\PORTIFOLIO\projetos\zenith\apps\web'

foreach ($rel in $files) {
    $path = Join-Path $root $rel
    if (-not (Test-Path $path)) { Write-Host "NOT FOUND: $path"; continue }
    $content = Get-Content -Path $path -Raw

    # 1) Substituir a linha "const API = 'http://localhost:3002';" por nada
    $content = $content -replace "const API = 'http://localhost:3002';\r?\n", ""

    # 2) Adicionar import do lib/api no topo (depois de 'use client' se existir)
    if ($content -match "'use client';") {
        # Já existe 'use client' - inserir import depois
        if ($content -notmatch "from '@/lib/api'") {
            # encontrar primeira linha de import
            $lines = $content -split "`n"
            $inserted = $false
            $newLines = @()
            $importRe = '^import .+ from .+;'
            foreach ($line in $lines) {
                $newLines += $line
                if (-not $inserted -and $line -match $importRe) {
                    # verifica se a próxima linha também é import
                    $idx = $newLines.Count - 1
                    # ver se já é import depois (apenas uma vez)
                    $inserted = $true
                }
            }
            # encontrar a posição da última linha de import antes de algo diferente
            $finalLines = @()
            $seenNonImport = $false
            for ($i = 0; $i -lt $newLines.Count; $i++) {
                $line = $newLines[$i]
                $finalLines += $line
                if (-not $seenNonImport -and $line -notmatch $importRe -and $line.Trim() -ne '' -and $line -notmatch "'use client'") {
                    $seenNonImport = $true
                }
            }
            # inserir linha de import do api antes da primeira linha não-import
            $api = "import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api';"
            $out = @()
            $done = $false
            foreach ($line in $newLines) {
                if (-not $done -and $line -notmatch $importRe -and $line.Trim() -ne '' -and $line -notmatch "'use client'") {
                    $out += $api
                    $done = $true
                }
                $out += $line
            }
            $content = $out -join "`n"
        }
    }

    Set-Content -Path $path -Value $content -NoNewline
    Write-Host "OK: $rel"
}
Write-Host "DONE"
