[CmdletBinding()]
param(
    [ValidateRange(1024,65535)][int]$Port = 5000,
    # demo: the controlled scenario dataset. real: the evidence from the real A/B run (outputs\real-run, data\cases\real_run.db).
    [ValidateSet('demo','real')][string]$Dataset = 'demo'
)

$ErrorActionPreference = 'Stop'
$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $python)) {
    throw 'Virtual environment not found. Follow the Install and demonstrate section in README.md first.'
}

# Windows lets a second server share a busy port, so the browser would keep reaching the old one. Refuse instead.
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($busy) {
    throw "Port $Port is already used by another dashboard (process $($busy.OwningProcess)). Close that PowerShell window or press Ctrl+C in it, then run this again, or add -Port 5050."
}

Push-Location $PSScriptRoot
try {
    & $python 'scripts\validate_project.py'
    if ($LASTEXITCODE -ne 0) { throw 'Project validation failed; the dashboard was not started.' }
    if ($Dataset -eq 'real') {
        $env:FORENSICS_DB = Join-Path $PSScriptRoot 'data\cases\real_run.db'
        $env:FORENSICS_OUTPUTS = Join-Path $PSScriptRoot 'outputs\real-run'
        if (!(Test-Path -LiteralPath $env:FORENSICS_DB)) { throw 'No real-run analysis yet. See "Collecting real evidence" in docs\PROJECT_HANDOFF.md.' }
    } else {
        Remove-Item Env:FORENSICS_DB, Env:FORENSICS_OUTPUTS -ErrorAction SilentlyContinue
        & $python 'scripts\run_pipeline.py' '--demo'
        if ($LASTEXITCODE -ne 0) { throw 'Demo analysis failed; the dashboard was not started.' }
    }
    $env:FORENSICS_PORT = [string]$Port
    Write-Host "Dashboard ($Dataset data) is ready at http://127.0.0.1:$Port" -ForegroundColor Green
    Write-Host 'Keep this window open during the demonstration. Press Ctrl+C once to stop.'
    & $python 'dashboard\app.py'
} finally {
    Pop-Location
}
