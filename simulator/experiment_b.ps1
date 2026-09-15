[CmdletBinding(SupportsShouldProcess)]
param([ValidatePattern('^[A-Za-z]:\\')][string]$CompanyRoot='C:\CompanyData',[ValidatePattern('^[A-Za-z]:\\')][string]$UsbRoot='E:\',[string]$LogDir='C:\LabLogs')
$ErrorActionPreference='Stop'; if(!(Test-Path $CompanyRoot)){throw 'Run create_company_data.ps1 first.'}; if(!(Test-Path $UsbRoot)){throw 'Attach only the designated isolated laboratory USB.'}
New-Item -ItemType Directory -Force $LogDir | Out-Null; $log=Join-Path $LogDir 'EXP-B-intended-actions.log'; "SIMULATION METADATA, NOT FORENSIC EVIDENCE`nExperiment B started: $(Get-Date -Format o)" | Set-Content $log
$files=@('Finance\Employee_Salaries.xlsx','Customers\Customer_Database.csv','Projects\Project_Apollo.pdf'); $files|ForEach-Object{Get-Content (Join-Path $CompanyRoot $_) | Out-Null}; $destination=Join-Path $UsbRoot 'Backup'; New-Item -ItemType Directory -Force $destination | Out-Null; $files|ForEach-Object{Copy-Item (Join-Path $CompanyRoot $_) $destination}
$temp=Join-Path $env:TEMP 'apollo-lab-temp.pdf'; Copy-Item (Join-Path $CompanyRoot 'Projects\Project_Apollo.pdf') $temp; Compress-Archive -Path (Join-Path $destination 'Employee_Salaries.xlsx'),(Join-Path $destination 'Customer_Database.csv') -DestinationPath (Join-Path $destination 'Project_Files.zip') -Force; Remove-Item -LiteralPath $temp
"Controlled fictional operations finished: $(Get-Date -Format o)" | Add-Content $log

