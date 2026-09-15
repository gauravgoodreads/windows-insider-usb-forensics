[CmdletBinding()]
param([ValidatePattern('^[A-Za-z]:\\')][string]$Root='C:\CompanyData')
$ErrorActionPreference='Stop'
@('Finance','Customers','Projects','Management','Public') | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $Root $_) | Out-Null }
'EmployeeId,Name,Role,AnnualSalary`nE001,Alex Example,Analyst,52000`nE002,Jamie Example,Manager,71000' | Set-Content (Join-Path $Root 'Finance\Employee_Salaries.xlsx')
'Department,Quarter,Budget`nResearch,Q4,125000`nOperations,Q4,93000' | Set-Content (Join-Path $Root 'Finance\Q4_Budget.xlsx')
'CustomerID,Name,Department`nC001,John Example,Sales`nC002,Jane Example,Finance`nC003,Alice Example,Marketing' | Set-Content (Join-Path $Root 'Customers\Customer_Database.csv')
'FICTIONAL PDF PLACEHOLDER: Project Apollo laboratory brief.' | Set-Content (Join-Path $Root 'Projects\Project_Apollo.pdf')
'FICTIONAL DOCX PLACEHOLDER: Example Corporation strategy.' | Set-Content (Join-Path $Root 'Management\Company_Strategy.docx')
'Ordinary laboratory backup note.' | Set-Content (Join-Path $Root 'Public\Readme.txt')
Write-Host "Created clearly fictional laboratory data at $Root"

