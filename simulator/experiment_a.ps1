[CmdletBinding(SupportsShouldProcess)]
param([ValidatePattern('^[A-Za-z]:\\')][string]$CompanyRoot='C:\CompanyData',[ValidatePattern('^[A-Za-z]:\\')][string]$UsbRoot='E:\',[string]$LogDir='C:\LabLogs')
$ErrorActionPreference='Stop'; if(!(Test-Path $CompanyRoot)){throw 'Run create_company_data.ps1 first.'}; if(!(Test-Path $UsbRoot)){throw 'Attach the designated isolated laboratory USB first.'}
New-Item -ItemType Directory -Force $LogDir | Out-Null; $log=Join-Path $LogDir 'EXP-A-intended-actions.log'; "SIMULATION METADATA, NOT FORENSIC EVIDENCE`nExperiment A started: $(Get-Date -Format o)" | Set-Content $log
$destination=Join-Path $UsbRoot 'Backup'; New-Item -ItemType Directory -Force $destination | Out-Null; Get-Content (Join-Path $CompanyRoot 'Public\Readme.txt') | Out-Null; Copy-Item (Join-Path $CompanyRoot 'Public\Readme.txt') $destination
"Normal fictional file copied; session finished: $(Get-Date -Format o)" | Add-Content $log

