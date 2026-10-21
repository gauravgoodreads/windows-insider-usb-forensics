[CmdletBinding(SupportsShouldProcess)]
param([ValidatePattern('^[A-Za-z]:\\')][string]$CompanyRoot='C:\CompanyData',[ValidatePattern('^[A-Za-z]:\\')][string]$UsbRoot='E:\',[string]$LogDir='C:\LabLogs')
$ErrorActionPreference='Stop'; if(!(Test-Path $CompanyRoot)){throw 'Run create_company_data.ps1 first.'}; if(!(Test-Path $UsbRoot)){throw 'Attach the designated isolated laboratory USB first.'}
# Opening a file in Explorer or an app registers it with the shell, which writes the Recent Items shortcut (LNK) artifact.
Add-Type -Namespace Lab -Name Shell -MemberDefinition '[DllImport("shell32.dll", CharSet = CharSet.Unicode)] public static extern void SHAddToRecentDocs(uint flags, string path);' -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $LogDir | Out-Null; $log=Join-Path $LogDir 'EXP-A-intended-actions.log'; "SIMULATION METADATA, NOT FORENSIC EVIDENCE`nExperiment A started: $(Get-Date -Format o)" | Set-Content $log
$readme=Join-Path $CompanyRoot 'Public\Readme.txt'; $destination=Join-Path $UsbRoot 'Backup'; New-Item -ItemType Directory -Force $destination | Out-Null
Get-Content $readme | Out-Null; [Lab.Shell]::SHAddToRecentDocs(3,$readme); Copy-Item $readme $destination
"Normal fictional file opened and copied; session finished: $(Get-Date -Format o)" | Add-Content $log
