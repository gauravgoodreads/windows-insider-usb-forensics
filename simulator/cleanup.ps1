[CmdletBinding(SupportsShouldProcess,ConfirmImpact='High')]
param([ValidatePattern('^[A-Za-z]:\\')][string]$CompanyRoot='C:\CompanyData',[ValidatePattern('^[A-Za-z]:\\')][string]$UsbBackup='E:\Backup',[string]$LogDir='C:\LabLogs')
foreach($target in @($CompanyRoot,$UsbBackup,$LogDir)){if(Test-Path -LiteralPath $target){$resolved=(Resolve-Path -LiteralPath $target).Path;if($resolved -notmatch '^[A-Za-z]:\\(CompanyData|Backup|LabLogs)(\\|$)'){throw "Refusing unsafe target $resolved"}; Remove-Item -LiteralPath $resolved -Recurse -Force -Confirm}}

