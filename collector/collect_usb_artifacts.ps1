<#
.SYNOPSIS
  Read-only triage collector: exports USB-related Windows artifacts from the current PC
  into the JSON format the analysis pipeline ingests.

.DESCRIPTION
  Runs as a normal user, needs no installation, and changes nothing on the examined system.
  It reads device history, removable volumes, recent-item shortcuts, the Recycle Bin and
  logon events, then writes collected_<Label>.json plus a SHA-256 manifest for custody.

  Live collection always touches the running system (for example, file access times may
  update). For formal casework, acquire a powered-off image instead and analyse a copy.

.EXAMPLE
  .\collector\collect_usb_artifacts.ps1 -OutputDir C:\Evidence\triage-001 -SinceDays 14
  python scripts\run_pipeline.py --input C:\Evidence\triage-001
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OutputDir,
    [ValidateRange(1, 365)][int]$SinceDays = 30,
    # Exact start of the examined activity (for example an experiment start); overrides -SinceDays.
    [datetime]$Since,
    [ValidateRange(10, 5000)][int]$MaxFilesPerVolume = 500,
    [ValidateRange(1, 32)][int]$MaxDepth = 4,
    [ValidatePattern('^[A-Za-z0-9-]+$')][string]$Label = 'LIVE',
    [string]$Examiner = 'Student Investigator'
)
$ErrorActionPreference = 'Stop'
$since = if ($PSBoundParameters.ContainsKey('Since')) { $Since } else { (Get-Date).AddDays(-$SinceDays) }
# EXP-A -> A-0001, LIVE -> L-0001, so several collections can be analysed together without ID clashes.
$prefix = if ($Label -match '^EXP-(\w+)$') { $Matches[1].ToUpper() } else { $Label.Substring(0, 1).ToUpper() }
$hostName = $env:COMPUTERNAME
$userName = $env:USERNAME
$records = [System.Collections.Generic.List[object]]::new()
$counter = 0

function Format-Time([datetime]$t) { if ($t -and $t.Year -gt 1601) { $t.ToString('yyyy-MM-ddTHH:mm:sszzz') } else { $null } }

function Add-Record([hashtable]$fields) {
    $script:counter++
    $base = [ordered]@{
        artifact_id = '{0}-{1:D4}' -f $prefix, $script:counter
        host        = $hostName
        user        = $userName
        experiment  = $Label
    }
    foreach ($k in $fields.Keys) { $base[$k] = $fields[$k] }
    $script:records.Add([pscustomobject]$base)
}

function Get-DeviceDate([string]$instanceId, [string]$key) {
    try {
        $p = Get-PnpDeviceProperty -InstanceId $instanceId -KeyName $key -ErrorAction Stop
        if ($p.Data) { [datetime]$p.Data } else { $null }
    } catch { $null }
}

# 1. Logon sessions (System log, Winlogon 7001 is readable without admin rights).
try {
    $sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $logons = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-Winlogon'; Id = 7001; StartTime = $since.AddDays(-30) } -ErrorAction Stop |
        Where-Object { $_.Properties.Count -ge 2 -and "$($_.Properties[1].Value)" -eq $sid })
    # Keep logons inside the window plus the latest one before it: that is the session in progress when the window opened.
    $inWindow = @($logons | Where-Object TimeCreated -ge $since | Select-Object -First 20)
    $inProgress = @($logons | Where-Object TimeCreated -lt $since | Select-Object -First 1)
    @($inProgress + $inWindow) |
        ForEach-Object {
            Add-Record @{ timestamp = Format-Time $_.TimeCreated; timestamp_type = 'logged_on'; artifact_type = 'user_session'
                source = 'System event log (Winlogon 7001)'; action = 'logged_on'; description = 'Interactive user logon' }
        }
} catch { Write-Warning "Logon events unavailable: $($_.Exception.Message)" }

# 2. USB storage device history: USBSTOR pen drives (present or not) plus external USB hard disks,
#    which use the UAS driver and appear as SCSI disks reported as external media.
$externalDisks = @(Get-CimInstance Win32_DiskDrive -ErrorAction SilentlyContinue | Where-Object { $_.MediaType -match 'External|Removable' -or $_.InterfaceType -eq 'USB' })
$externalIds = @($externalDisks | ForEach-Object { $_.PNPDeviceID })
$usbDevices = @(Get-PnpDevice -Class DiskDrive -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -like 'USBSTOR*' -or $externalIds -contains $_.InstanceId })
foreach ($dev in $usbDevices) {
    $serial = ($dev.InstanceId -split '\\')[-1] -replace '&\d+$', ''
    $name = if ($dev.FriendlyName) { $dev.FriendlyName } else { ($dev.InstanceId -split '\\')[1] }
    $kind = if ($dev.InstanceId -like 'USBSTOR*') { 'USBSTOR' } else { 'external USB disk' }
    $common = @{ artifact_type = 'usb'; source = "PnP device properties ($kind)"; device = $name; serial_number = $serial; path = "HKLM\SYSTEM\CurrentControlSet\Enum\$($dev.InstanceId)" }
    $first = Get-DeviceDate $dev.InstanceId 'DEVPKEY_Device_FirstInstallDate'
    $arrive = Get-DeviceDate $dev.InstanceId 'DEVPKEY_Device_LastArrivalDate'
    $remove = Get-DeviceDate $dev.InstanceId 'DEVPKEY_Device_LastRemovalDate'
    if ($first -and $first -ge $since) { Add-Record ($common + @{ timestamp = Format-Time $first; timestamp_type = 'first_install'; action = 'first_seen'; description = 'First time this USB storage device was installed' }) }
    if ($arrive -and $arrive -ge $since) { Add-Record ($common + @{ timestamp = Format-Time $arrive; timestamp_type = 'connected'; action = 'connected'; description = 'Last connection of USB storage device' }) }
    if ($remove -and $remove -ge $since) { Add-Record ($common + @{ timestamp = Format-Time $remove; timestamp_type = 'disconnected'; action = 'disconnected'; description = 'Last removal of USB storage device' }) }
}

# 3. Currently mounted removable volumes and external USB disk volumes, and the files on them (destination-side evidence).
$removable = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=2' -ErrorAction SilentlyContinue)
foreach ($disk in $externalDisks) {
    foreach ($part in @(Get-CimAssociatedInstance -InputObject $disk -ResultClassName Win32_DiskPartition -ErrorAction SilentlyContinue)) {
        $removable += @(Get-CimAssociatedInstance -InputObject $part -ResultClassName Win32_LogicalDisk -ErrorAction SilentlyContinue)
    }
}
$removable = @($removable | Sort-Object DeviceID -Unique)
foreach ($vol in $removable) {
    $volumeLabel = if ($vol.VolumeName) { $vol.VolumeName.Trim() } else { $vol.DeviceID }
    # Large external disks are scanned to a bounded depth so collection stays fast.
    # Windows system folders on the volume (its own Recycle Bin, restore data) are not user files.
    $files = @(Get-ChildItem -LiteralPath "$($vol.DeviceID)\" -Recurse -Depth $MaxDepth -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\(\$RECYCLE\.BIN|System Volume Information)\\' } |
        Where-Object { $_.CreationTime -ge $since -or $_.LastWriteTime -ge $since } |
        Sort-Object CreationTime | Select-Object -First $MaxFilesPerVolume)
    foreach ($f in $files) {
        $isArchive = $f.Extension -in '.zip', '.7z', '.rar', '.tar', '.gz'
        Add-Record @{
            timestamp = Format-Time $f.CreationTime; timestamp_type = 'created'
            artifact_type = $(if ($isArchive) { 'archive' } else { 'filesystem' })
            source = "Removable volume listing ($($vol.DeviceID))"; path = $f.FullName; filename = $f.Name; device = $volumeLabel
            action = $(if ($isArchive) { 'archived' } else { 'created' }); size = $f.Length
            modified = Format-Time $f.LastWriteTime
            description = $(if ($isArchive) { 'Archive present on removable media' } else { 'Destination-side file on removable media' })
        }
    }
}

# 4. Recent-item shortcuts (LNK): evidence that a file was opened, and from where.
$recent = Join-Path $env:APPDATA 'Microsoft\Windows\Recent'
if (Test-Path -LiteralPath $recent) {
    $shell = New-Object -ComObject WScript.Shell
    Get-ChildItem -LiteralPath $recent -Filter '*.lnk' -File -ErrorAction SilentlyContinue |
        Where-Object LastWriteTime -ge $since | Sort-Object LastWriteTime |
        ForEach-Object {
            $target = try { $shell.CreateShortcut($_.FullName).TargetPath } catch { $null }
            if ($target -and [IO.Path]::GetExtension($target)) {
                Add-Record @{ timestamp = Format-Time $_.LastWriteTime; timestamp_type = 'accessed'; artifact_type = 'lnk'
                    source = 'Recent Items shortcut'; path = $target; filename = [IO.Path]::GetFileName($target); action = 'accessed'
                    lnk_file = $_.Name; description = 'Shortcut created when the file was opened' }
            }
        }
}

# 5. Recycle Bin $I records: original path and deletion time of deleted files.
try {
    $sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    foreach ($drive in Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' -ErrorAction SilentlyContinue) {
        $bin = "$($drive.DeviceID)\`$Recycle.Bin\$sid"
        if (-not (Test-Path -LiteralPath $bin)) { continue }
        Get-ChildItem -LiteralPath $bin -Filter '$I*' -Force -File -ErrorAction SilentlyContinue | ForEach-Object {
            $bytes = [IO.File]::ReadAllBytes($_.FullName)
            if ($bytes.Length -lt 28) { return }
            $version = [BitConverter]::ToInt64($bytes, 0)
            $size = [BitConverter]::ToInt64($bytes, 8)
            $deleted = [DateTime]::FromFileTime([BitConverter]::ToInt64($bytes, 16))
            $original = if ($version -ge 2) { [Text.Encoding]::Unicode.GetString($bytes, 28, $bytes.Length - 28).TrimEnd([char]0) } else { [Text.Encoding]::Unicode.GetString($bytes, 24, [math]::Min(520, $bytes.Length - 24)).TrimEnd([char]0) }
            if ($deleted -lt $since) { return }
            Add-Record @{ timestamp = Format-Time $deleted; timestamp_type = 'deleted'; artifact_type = 'recycle_bin'
                source = 'Recycle Bin $I record'; path = $original; filename = [IO.Path]::GetFileName($original); action = 'deleted'
                size = $size; description = 'File moved to the Recycle Bin' }
        }
    }
} catch { Write-Warning "Recycle Bin unavailable: $($_.Exception.Message)" }

# Collection metadata, output and integrity manifest.
$meta = [ordered]@{
    artifact_id = "META-$Label"; artifact_type = 'simulation_metadata'; experiment = $Label; host = $hostName; user = $userName
    source = 'collector metadata'; confidence = 'LOW'; collected_at = Format-Time (Get-Date); since = Format-Time $since
    collector = 'collect_usb_artifacts.ps1'; notes = 'COLLECTION METADATA - describes how the evidence was gathered, not evidence itself'
}
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$outName = "collected_$Label.json"
$out = Join-Path $OutputDir $outName
$all = @([pscustomobject]$meta) + $records.ToArray()
[IO.File]::WriteAllText([IO.Path]::GetFullPath($out), (ConvertTo-Json -InputObject $all -Depth 4), [Text.UTF8Encoding]::new($false))
$hash = (Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash
[ordered]@{ file = $outName; sha256 = $hash; records = $records.Count; host = $hostName; examiner = $Examiner; collected_at = $meta.collected_at; since = $meta.since } |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $OutputDir "collected_$Label-manifest.json") -Encoding utf8

$summary = $records | Group-Object artifact_type | ForEach-Object { "$($_.Name)=$($_.Count)" }
Write-Host "Collected $($records.Count) artifacts ($($summary -join ', ')) from $hostName" -ForegroundColor Green
Write-Host "Output: $out"
Write-Host "SHA-256: $hash"
Write-Host "Next: python scripts\run_pipeline.py --input `"$OutputDir`""
