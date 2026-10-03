# Corre el scraper de Zonaprop y, si la cartera cambió, hace commit + push.
# Al pushear, Netlify (conectado a este repo) redeploya solo.
# Pensado para Task Scheduler de Windows, no para correr a mano
# (usá `npm run sync-properties` para eso).

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\pollo\PROYECTOS\aurea-propiedades"
$logPath = Join-Path $repoPath "scripts\sync-and-push.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logPath -Value "[$timestamp] $Message"
}

Set-Location $repoPath

try {
    Write-Log "Corriendo sync-properties.mjs..."
    node scripts/sync-properties.mjs 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -ne 0) { throw "sync-properties.mjs salió con código $LASTEXITCODE" }

    # Auditoría extrema (03-oct-2026, Codex): corrida desatendida (Task
    # Scheduler) -- si el checkout tiene commits locales sin pushear de otra
    # sesión, un `git push` sin chequear esto los publica también sin que
    # nadie se entere. Se aborta si HEAD ya está adelantado respecto del
    # remoto ANTES de tocar nada.
    git fetch origin --quiet
    if ($LASTEXITCODE -ne 0) { throw "git fetch falló con código $LASTEXITCODE" }
    $ahead = git rev-list --count '@{u}..HEAD'
    if ($LASTEXITCODE -ne 0) { throw "git rev-list falló con código $LASTEXITCODE" }
    if ([int]$ahead -gt 0) {
        throw "HEAD tiene $ahead commit(s) locales sin pushear -- se aborta para no publicarlos junto con el sync automático."
    }

    git diff --quiet -- src/data/properties.mock.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Sin cambios en la cartera, nada que pushear."
        exit 0
    }

    # `git commit <path>` (a diferencia de `git commit` a secas) solo
    # commitea cambios de ESE path, sin tocar lo que ya estuviera preparado
    # en el índice por otra cosa -- antes, un `git add` de otro trabajo
    # pendiente en este mismo checkout se colaba en este commit automático.
    git add src/data/properties.mock.ts
    if ($LASTEXITCODE -ne 0) { throw "git add falló con código $LASTEXITCODE" }
    git commit -m "chore: sync cartera desde Zonaprop [auto]" -- src/data/properties.mock.ts | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git commit falló con código $LASTEXITCODE" }
    git push | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git push falló con código $LASTEXITCODE" }
    Write-Log "Cartera actualizada y pusheada."
}
catch {
    Write-Log "ERROR: $_"
    exit 1
}
