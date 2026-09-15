param([string]$CompanyRoot='C:\CompanyData',[string]$UsbRoot='E:\')
$required=@('Finance\Employee_Salaries.xlsx','Customers\Customer_Database.csv','Projects\Project_Apollo.pdf','Management\Company_Strategy.docx'); $required|ForEach-Object{"{0}: {1}" -f $_,(Test-Path (Join-Path $CompanyRoot $_))}; "USB available: {0}" -f (Test-Path $UsbRoot); "Network profiles (manually confirm isolation):"; Get-NetConnectionProfile | Select-Object Name,NetworkCategory,IPv4Connectivity

