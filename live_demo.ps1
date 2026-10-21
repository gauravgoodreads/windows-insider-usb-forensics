<#
.SYNOPSIS
  Guided live demonstration: performs the whole investigation in front of the examiner, step by step.

.DESCRIPTION
  1. Creates fictional company files.       2. Runs Experiment A (normal backup) with the USB drive.
  3. Collects the real Windows evidence.    4. Runs Experiment B (simulated insider).
  5. Collects the evidence again.           6. Analyses both experiments (H1-H4).
  7. Cleans up the fictional files.         8. Opens the dashboard on the evidence just collected.
  Each step explains what happens and what to say, then waits for Enter.
  Only fictional files are used. The USB drive only gets a Backup folder, which goes to the Recycle Bin afterwards.

.EXAMPLE
  .\live_demo.ps1                 # detects the USB drive
  .\live_demo.ps1 -UsbDrive E:    # choose it yourself
#>
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z]:$')][string]$UsbDrive,
    [ValidateRange(1024, 65535)][int]$Port = 5000,
    # Self-test: no pauses, reuses the drive's current connection, and does not start the dashboard.
    [switch]$Unattended
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$python = Join-Path $root '.venv\Scripts\python.exe'
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidenceDir = Join-Path $root "evidence\live-$runId"
$outputDir = Join-Path $root "outputs\live-$runId"
$db = Join-Path $root "data\cases\live-$runId.db"
$companyRoot = 'C:\CompanyData'
$logDir = 'C:\LabLogs'

function Step([int]$n, [string]$title) {
    Write-Host ''
    Write-Host ('=' * 78) -ForegroundColor DarkCyan
    Write-Host " STEP $n of 8  |  $title" -ForegroundColor Cyan
    Write-Host ('=' * 78) -ForegroundColor DarkCyan
}
function Explain([string]$text) { Write-Host " What happens: $text" -ForegroundColor Gray }
function Why([string]$text) { Write-Host " Why it matters: $text" -ForegroundColor Yellow }
function Show([string]$text) { Write-Host "   $text" -ForegroundColor White }
function Show-Command([string]$cmd) { Write-Host ''; Write-Host " Command:  PS> $cmd" -ForegroundColor Green }
# Prints the real lines of the script that does the work, read from the file at run time, one statement per line.
function Show-Code([string]$file, [string]$caption, [scriptblock]$keep) {
    Write-Host " Code ($file): $caption" -ForegroundColor DarkCyan
    Get-Content -LiteralPath (Join-Path $root $file) | Where-Object $keep | ForEach-Object { $_ -split ';\s+(?=[\$\w\[&"''])' } |
        ForEach-Object { Write-Host "   | $($_.Trim())" -ForegroundColor DarkGray }
    Write-Host ''
}
$scriptBody = { $_.Trim() -and $_ -notmatch '^\s*(#|\[CmdletBinding|param\()' }
function Pause-Demo([string]$prompt = 'Press Enter to continue') { if (-not $Unattended) { [void](Read-Host "`n >> $prompt") } }

function Get-UsbVolumes {
    $disks = @(Get-CimInstance Win32_DiskDrive | Where-Object { $_.MediaType -match 'External|Removable' -or $_.InterfaceType -eq 'USB' })
    foreach ($disk in $disks) {
        foreach ($part in @(Get-CimAssociatedInstance -InputObject $disk -ResultClassName Win32_DiskPartition)) {
            foreach ($vol in @(Get-CimAssociatedInstance -InputObject $part -ResultClassName Win32_LogicalDisk)) {
                [pscustomobject]@{ Drive = $vol.DeviceID; Label = $vol.VolumeName; Model = $disk.Model; PnpId = $disk.PNPDeviceID }
            }
        }
    }
}
function Get-LastArrival([string]$pnpId) {
    try { [datetime](Get-PnpDeviceProperty -InstanceId $pnpId -KeyName DEVPKEY_Device_LastArrivalDate).Data } catch { $null }
}
function Wait-Replug($usb, [datetime]$since, [string]$experiment) {
    if ($Unattended) { return Get-LastArrival $usb.PnpId }
    Write-Host ''
    Write-Host " ${experiment}: unplug the USB drive, wait 5 seconds, then plug it back in." -ForegroundColor Magenta
    Write-Host '   (Taskbar USB icon > Eject first, if Windows asks.)' -ForegroundColor DarkGray
    while ($true) {
        Pause-Demo "Press Enter once $($usb.Drive) is back in File Explorer"
        $arrival = Get-LastArrival $usb.PnpId
        if ((Test-Path "$($usb.Drive)\") -and $arrival -and $arrival -ge $since) { return $arrival }
        Write-Host '   Windows has not recorded a new connection yet. Please unplug and plug it in again.' -ForegroundColor Red
    }
}

if (!(Test-Path -LiteralPath $python)) { throw 'Virtual environment not found. See "Install and demonstrate" in README.md.' }
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($busy) { throw "Port $Port is already used by another dashboard (process $($busy.OwningProcess)). Press Ctrl+C in that window or close it, then run this again." }

if (-not $Unattended) { Clear-Host }
Write-Host ''
Write-Host ' USB INSIDER FORENSICS  |  Live demonstration' -ForegroundColor Cyan
Write-Host ' Question: can Windows traces tell a normal USB backup apart from an insider copying company files?' -ForegroundColor White
Write-Host ''
Why 'Both experiments run live on this laptop. The real Windows evidence is collected and the software decides which session looks like an insider transfer.'
Pause-Demo 'Press Enter to start'

# STEP 1 - USB drive
Step 1 'Find the USB drive'
$volumes = @(Get-UsbVolumes)
$usb = if ($UsbDrive) { $volumes | Where-Object Drive -eq $UsbDrive.ToUpper() | Select-Object -First 1 } else { $volumes | Select-Object -First 1 }
if (-not $usb) { throw 'No USB drive found. Plug in a pen drive or external USB disk (or pass -UsbDrive E:) and run again.' }
$backup = "$($usb.Drive)\Backup"
if (Test-Path -LiteralPath $backup) { throw "$backup already exists. Move or rename it first so the demonstration never touches your own files." }
Explain 'The script asks Windows which drives are USB storage.'
Show-Command "Get-CimInstance Win32_DiskDrive | Where-Object { `$_.MediaType -match 'External|Removable' -or `$_.InterfaceType -eq 'USB' }"
Show "Using $($usb.Drive) '$($usb.Label)'  ($($usb.Model))"
Why 'This drive plays the role of the removable device used to take data out.'
Pause-Demo

# STEP 2 - fictional company files
Step 2 'Create the fictional company files'
Explain 'Creates a fake company folder with salary, customer, project and strategy files. No real data.'
Show-Command ".\simulator\create_company_data.ps1 -Root $companyRoot"
Show-Code 'simulator\create_company_data.ps1' 'the lines that create each file' { $_ -match "^(New-Lab(Xlsx|Pdf|Docx) \(|@\('C|'Ordinary)" }
& (Join-Path $root 'simulator\create_company_data.ps1') -Root $companyRoot | Out-Null
Get-ChildItem $companyRoot -Recurse -File | ForEach-Object { Show $_.FullName }
Why 'All files are fictional. Employee_Salaries.xlsx and Customer_Database.csv are classified HIGHLY SENSITIVE in config/project.yaml.'
Pause-Demo

# STEP 3 - Experiment A
Step 3 'Experiment A: a normal USB backup (the control)'
Explain 'The user plugs in the USB drive, opens an ordinary Readme.txt and copies it to the USB. Nothing sensitive.'
Why 'Experiment A is the control. Ordinary USB use must not be flagged as a leak.'
$startA = Get-Date
$arrivalA = Wait-Replug $usb $startA 'Experiment A'
if ($Unattended) { $startA = $arrivalA.AddSeconds(-1) }
Show "Windows recorded: USB connected at $($arrivalA.ToString('HH:mm:ss'))"
Show-Command ".\simulator\experiment_a.ps1 -CompanyRoot $companyRoot -UsbRoot $($usb.Drive)\"
Show-Code 'simulator\experiment_a.ps1' 'every statement in the script' $scriptBody
& (Join-Path $root 'simulator\experiment_a.ps1') -CompanyRoot $companyRoot -UsbRoot "$($usb.Drive)\" -LogDir $logDir
Get-ChildItem $backup | ForEach-Object { Show "On the USB now: $($_.Name)  ($($_.CreationTime.ToString('HH:mm:ss')))" }
Pause-Demo

# STEP 4 - collect A
Step 4 'Collect the evidence for Experiment A'
Explain 'A read-only script reads the traces Windows left: USB device history, files on the USB, opened-file shortcuts, Recycle Bin and logons. It changes nothing and fingerprints its output with SHA-256.'
Show-Command ".\collector\collect_usb_artifacts.ps1 -OutputDir evidence\live-$runId -Since '$($startA.ToString('HH:mm:ss'))' -Label EXP-A"
Show-Code 'collector\collect_usb_artifacts.ps1' 'the five evidence sources it reads' { $_ -match '^# \d\.' }
& (Join-Path $root 'collector\collect_usb_artifacts.ps1') -OutputDir $evidenceDir -Since $startA -Label EXP-A 6>$null | Out-Null
# Assign first: Windows PowerShell 5.1 passes a parsed JSON array down the pipeline as one object.
$all = Get-Content (Join-Path $evidenceDir 'collected_EXP-A.json') -Raw | ConvertFrom-Json
$a = @($all | Where-Object artifact_type -ne 'simulation_metadata')
$a | ForEach-Object { Show ("{0,-8} {1,-14} {2,-10} {3}" -f $_.artifact_id, $_.artifact_type, $_.action, $(if ($_.filename) { $_.filename } else { $_.device })) }
Why "$($a.Count) real Windows records, limited to Experiment A's time window."
Pause-Demo

# STEP 5 - Experiment B
Step 5 'Experiment B: the simulated insider'
Explain 'The user opens the salary, customer and project files, copies two of them to the USB, makes a ZIP, and deletes a temporary copy.'
Why 'Same laptop, user and USB drive as Experiment A. Only the behaviour differs.'
$startB = Get-Date
$arrivalB = Wait-Replug $usb $startB 'Experiment B'
if ($Unattended) { $startB = $arrivalB.AddSeconds(-1) }
Show "Windows recorded: USB connected at $($arrivalB.ToString('HH:mm:ss'))"
Show-Command ".\simulator\experiment_b.ps1 -CompanyRoot $companyRoot -UsbRoot $($usb.Drive)\"
Show-Code 'simulator\experiment_b.ps1' 'every statement in the script' $scriptBody
& (Join-Path $root 'simulator\experiment_b.ps1') -CompanyRoot $companyRoot -UsbRoot "$($usb.Drive)\" -LogDir $logDir
Get-ChildItem $backup | Where-Object CreationTime -ge $startB | ForEach-Object { Show "On the USB now: $($_.Name)  ($($_.CreationTime.ToString('HH:mm:ss')))" }
Show 'Project_Apollo.pdf temporary copy: moved to the Recycle Bin'
Pause-Demo

# STEP 6 - collect B
Step 6 'Collect the evidence for Experiment B'
Explain 'The same read-only collector, now limited to Experiment B''s time window.'
Show-Command ".\collector\collect_usb_artifacts.ps1 -OutputDir evidence\live-$runId -Since '$($startB.ToString('HH:mm:ss'))' -Label EXP-B"
& (Join-Path $root 'collector\collect_usb_artifacts.ps1') -OutputDir $evidenceDir -Since $startB -Label EXP-B 6>$null | Out-Null
$all = Get-Content (Join-Path $evidenceDir 'collected_EXP-B.json') -Raw | ConvertFrom-Json
$b = @($all | Where-Object artifact_type -ne 'simulation_metadata')
$b | ForEach-Object { Show ("{0,-8} {1,-14} {2,-10} {3}" -f $_.artifact_id, $_.artifact_type, $_.action, $(if ($_.filename) { $_.filename } else { $_.device })) }
$hash = (Get-Content (Join-Path $evidenceDir 'collected_EXP-B-manifest.json') -Raw | ConvertFrom-Json).sha256
Show "SHA-256 fingerprint of this evidence: $hash"
Why 'Files opened, the same files on the USB, a ZIP and a deletion within seconds. Each clue is weak alone; together they are strong.'
Pause-Demo

# STEP 7 - analyse
Step 7 'Analyse both experiments'
Explain 'The software normalises the records, links those that share a user, device, file and time window, and answers four questions H1 to H4.'
$user = ($b | Where-Object user | Select-Object -First 1).user
if (-not $user) { $user = $env:USERNAME }
Show-Command "python scripts\run_pipeline.py --input evidence\live-$runId --user $user"
Show-Code 'forensic\pipeline.py' 'the analysis stages, in order' { $_ -match '^\s+(config=|correlations=|hypotheses=|rules=|with connect|reports=)' }
# The pipeline logs progress on stderr; Windows PowerShell 5.1 would turn that into a terminating error under 'Stop'.
$ErrorActionPreference = 'Continue'
$json = & $python (Join-Path $root 'scripts\run_pipeline.py') --input $evidenceDir --user $user --output $outputDir --db $db 2>$null | Out-String
$pipelineExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($pipelineExit -ne 0) { throw 'The analysis failed. Run scripts\validate_project.py to see why.' }
$result = $json | ConvertFrom-Json
$hypotheses = [ordered]@{ H1 = 'Was a USB drive used?'; H2 = 'Were the sensitive files opened?'; H3 = 'Were they copied to the USB?'; H4 = 'Was anything hidden?' }
foreach ($h in $hypotheses.Keys) { Show ("{0}  {1,-36} {2}" -f $h, $hypotheses[$h], $result.hypotheses.$h) }
Show "Correlations: $($result.correlations)   Experimental score: $($result.score) of 13"
$py = "import json,sqlite3,sys; db=sqlite3.connect(sys.argv[1]); [print(c['event_id'], c['experiment'], c['confidence']) for c in (json.loads(p) for (p,) in db.execute('select payload from correlations')) if c['type']=='POSSIBLE_TRANSFER_SESSION']"
$transfers = @(& $python -c $py $db)
$transfers | ForEach-Object { Show "Possible transfer session found: $_" }
$inA = @($transfers | Where-Object { $_ -match ' EXP-A ' }).Count
$inB = @($transfers | Where-Object { $_ -match ' EXP-B ' }).Count
if ($inB -and -not $inA) {
    Show 'Result: a possible transfer is flagged only in Experiment B, not in Experiment A.'
} else {
    Show "Transfers flagged: Experiment A = $inA, Experiment B = $inB. Check the Correlations page for the reasons."
}
Pause-Demo

# STEP 8 - clean up and open the dashboard
Step 8 'Clean up and open the dashboard'
foreach ($dir in $backup, $companyRoot, $logDir) { Show-Command "[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory('$dir', 'OnlyErrorDialogs', 'SendToRecycleBin')" }
Add-Type -AssemblyName Microsoft.VisualBasic
foreach ($dir in $backup, $companyRoot, $logDir) {
    if (Test-Path -LiteralPath $dir) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($dir, 'OnlyErrorDialogs', 'SendToRecycleBin') }
}
Show 'Fictional files moved to the Recycle Bin. The evidence stays preserved and fingerprinted in:'
Show $evidenceDir
Why 'Evidence is preserved and fingerprinted before anything is cleaned up.'
if ($Unattended) { Write-Host "`n Self-test finished. Dashboard not started." -ForegroundColor Green; return }
$env:FORENSICS_DB = $db
$env:FORENSICS_OUTPUTS = $outputDir
$env:FORENSICS_PORT = [string]$Port
Show-Command "python dashboard\app.py   (reading data\cases\live-$runId.db)"
Write-Host " Dashboard for THIS live run: http://127.0.0.1:$Port   (Ctrl+C here to stop it)" -ForegroundColor Green
Start-Process "http://127.0.0.1:$Port"
Push-Location $root
try { & $python 'dashboard\app.py' } finally { Pop-Location }
