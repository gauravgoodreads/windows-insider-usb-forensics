[CmdletBinding()]
param([ValidatePattern('^[A-Za-z]:\\')][string]$Root='C:\CompanyData')
$ErrorActionPreference='Stop'

function Compress-OfficePackage([string]$SourceDirectory,[string]$Destination) {
    $zip = "$Destination.zip"
    Compress-Archive -Path (Join-Path $SourceDirectory '*') -DestinationPath $zip -Force
    Move-Item -LiteralPath $zip -Destination $Destination -Force
}

function New-LabXlsx([string]$Path,[string[][]]$Rows) {
    $work = Join-Path $env:TEMP ('cf-xlsx-' + [guid]::NewGuid().ToString('N'))
    try {
        New-Item -ItemType Directory -Force -Path (Join-Path $work '_rels'),(Join-Path $work 'xl\_rels'),(Join-Path $work 'xl\worksheets') | Out-Null
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>
'@ | Set-Content -LiteralPath (Join-Path $work '[Content_Types].xml') -Encoding utf8
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>
'@ | Set-Content -LiteralPath (Join-Path $work '_rels\.rels') -Encoding utf8
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Fictional Data" sheetId="1" r:id="rId1"/></sheets></workbook>
'@ | Set-Content -LiteralPath (Join-Path $work 'xl\workbook.xml') -Encoding utf8
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>
'@ | Set-Content -LiteralPath (Join-Path $work 'xl\_rels\workbook.xml.rels') -Encoding utf8
        $rowXml = for ($r=0; $r -lt $Rows.Count; $r++) {
            $cells = for ($c=0; $c -lt $Rows[$r].Count; $c++) {
                $column = [char](65 + $c); $value = [Security.SecurityElement]::Escape($Rows[$r][$c])
                '<c r="{0}{1}" t="inlineStr"><is><t>{2}</t></is></c>' -f $column,($r+1),$value
            }
            '<row r="{0}">{1}</row>' -f ($r+1),($cells -join '')
        }
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{0}</sheetData></worksheet>' -f ($rowXml -join '') | Set-Content -LiteralPath (Join-Path $work 'xl\worksheets\sheet1.xml') -Encoding utf8
        Compress-OfficePackage $work $Path
    } finally { if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force } }
}

function New-LabDocx([string]$Path,[string[]]$Paragraphs) {
    $work = Join-Path $env:TEMP ('cf-docx-' + [guid]::NewGuid().ToString('N'))
    try {
        New-Item -ItemType Directory -Force -Path (Join-Path $work '_rels'),(Join-Path $work 'word') | Out-Null
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>
'@ | Set-Content -LiteralPath (Join-Path $work '[Content_Types].xml') -Encoding utf8
        @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>
'@ | Set-Content -LiteralPath (Join-Path $work '_rels\.rels') -Encoding utf8
        $body = ($Paragraphs | ForEach-Object { '<w:p><w:r><w:t>{0}</w:t></w:r></w:p>' -f [Security.SecurityElement]::Escape($_) }) -join ''
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{0}<w:sectPr/></w:body></w:document>' -f $body | Set-Content -LiteralPath (Join-Path $work 'word\document.xml') -Encoding utf8
        Compress-OfficePackage $work $Path
    } finally { if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force } }
}

function New-LabPdf([string]$Path) {
    $stream = 'BT /F1 18 Tf 72 720 Td (FICTIONAL - Project Apollo Laboratory Brief) Tj 0 -30 Td /F1 11 Tf (Example Corporation synthetic research document. No real confidential data.) Tj ET'
    $objects = @('<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',"<< /Length $($stream.Length) >>`nstream`n$stream`nendstream",'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    $builder = [Text.StringBuilder]::new(); [void]$builder.Append("%PDF-1.4`n"); $offsets = @()
    for ($i=0; $i -lt $objects.Count; $i++) { $offsets += [Text.Encoding]::ASCII.GetByteCount($builder.ToString()); [void]$builder.Append("$($i+1) 0 obj`n$($objects[$i])`nendobj`n") }
    $xref = [Text.Encoding]::ASCII.GetByteCount($builder.ToString()); [void]$builder.Append("xref`n0 6`n0000000000 65535 f `n")
    foreach ($offset in $offsets) { [void]$builder.Append(('{0:D10} 00000 n ' -f $offset) + "`n") }
    [void]$builder.Append("trailer`n<< /Size 6 /Root 1 0 R >>`nstartxref`n$xref`n%%EOF`n")
    [IO.File]::WriteAllBytes($Path,[Text.Encoding]::ASCII.GetBytes($builder.ToString()))
}

@('Finance','Customers','Projects','Management','Public') | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $Root $_) | Out-Null }
New-LabXlsx (Join-Path $Root 'Finance\Employee_Salaries.xlsx') @(@('EmployeeId','Name','Role','AnnualSalary'),@('E001','Alex Example','Analyst','52000'),@('E002','Jamie Example','Manager','71000'))
New-LabXlsx (Join-Path $Root 'Finance\Q4_Budget.xlsx') @(@('Department','Quarter','Budget'),@('Research','Q4','125000'),@('Operations','Q4','93000'))
@('CustomerID,Name,Department','C001,John Example,Sales','C002,Jane Example,Finance','C003,Alice Example,Marketing') | Set-Content -LiteralPath (Join-Path $Root 'Customers\Customer_Database.csv') -Encoding utf8
New-LabPdf (Join-Path $Root 'Projects\Project_Apollo.pdf')
New-LabDocx (Join-Path $Root 'Management\Company_Strategy.docx') @('FICTIONAL - Example Corporation Strategy','Controlled educational laboratory document.','No real company or personal information is present.')
'Ordinary fictional laboratory backup note.' | Set-Content -LiteralPath (Join-Path $Root 'Public\Readme.txt') -Encoding utf8
Write-Host "Created valid, clearly fictional XLSX, CSV, PDF, DOCX, and TXT laboratory files at $Root"
