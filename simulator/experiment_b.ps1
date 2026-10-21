[CmdletBinding(SupportsShouldProcess)]
param([ValidatePattern('^[A-Za-z]:\\')][string]$CompanyRoot='C:\CompanyData',[ValidatePattern('^[A-Za-z]:\\')][string]$UsbRoot='E:\',[string]$LogDir='C:\LabLogs')
$ErrorActionPreference='Stop'; if(!(Test-Path $CompanyRoot)){throw 'Run create_company_data.ps1 first.'}; if(!(Test-Path $UsbRoot)){throw 'Attach only the designated isolated laboratory USB.'}
# Opening a file registers it with the shell (Recent Items LNK); deleting through the shell routes it to the Recycle Bin ($I/$R records).
Add-Type -Namespace Lab -Name Shell -MemberDefinition '[DllImport("shell32.dll", CharSet = CharSet.Unicode)] public static extern void SHAddToRecentDocs(uint flags, string path);' -ErrorAction SilentlyContinue
Add-Type -AssemblyName Microsoft.VisualBasic
New-Item -ItemType Directory -Force $LogDir | Out-Null; $log=Join-Path $LogDir 'EXP-B-intended-actions.log'; "SIMULATION METADATA, NOT FORENSIC EVIDENCE`nExperiment B started: $(Get-Date -Format o)" | Set-Content $log
$files=@('Finance\Employee_Salaries.xlsx','Customers\Customer_Database.csv','Projects\Project_Apollo.pdf'); $files|ForEach-Object{$p=Join-Path $CompanyRoot $_; Get-FileHash -LiteralPath $p -Algorithm SHA256 | Out-Null; [Lab.Shell]::SHAddToRecentDocs(3,$p)}
$destination=Join-Path $UsbRoot 'Backup'; New-Item -ItemType Directory -Force $destination | Out-Null; $files|Select-Object -First 2|ForEach-Object{Copy-Item (Join-Path $CompanyRoot $_) $destination}
$tempDir=Join-Path $env:TEMP 'apollo-lab-temp'; New-Item -ItemType Directory -Force $tempDir | Out-Null; $temp=Join-Path $tempDir 'Project_Apollo.pdf'; Copy-Item (Join-Path $CompanyRoot 'Projects\Project_Apollo.pdf') $temp
Compress-Archive -Path (Join-Path $destination 'Employee_Salaries.xlsx'),(Join-Path $destination 'Customer_Database.csv') -DestinationPath (Join-Path $destination 'Project_Files.zip') -Force
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($temp,'OnlyErrorDialogs','SendToRecycleBin'); Remove-Item -LiteralPath $tempDir -Force
"Controlled fictional operations finished: $(Get-Date -Format o)" | Add-Content $log
