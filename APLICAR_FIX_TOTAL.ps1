
$ErrorActionPreference = "Stop"

function Fail($msg) {
    Write-Host ""
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

function Backup-File($path) {
    if (Test-Path $path) {
        $backup = "$path.backup-antes-fix"
        if (-not (Test-Path $backup)) {
            Copy-Item $path $backup
        }
    }
}

function Copy-FixFile($relativePath) {
    $src = Join-Path $PSScriptRoot "_fix\$relativePath"
    $dst = Join-Path $PSScriptRoot $relativePath

    if (-not (Test-Path $src)) {
        Fail "No existe el archivo de corrección: $src"
    }

    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }

    Backup-File $dst
    Copy-Item $src $dst -Force
    Write-Host "REEMPLAZADO  $relativePath" -ForegroundColor Green
}

function Replace-Required($text, $oldText, $newText, $label) {
    if ($text.Contains($newText)) {
        return $text
    }
    if (-not $text.Contains($oldText)) {
        Fail "No encontre el bloque esperado para: $label"
    }
    return $text.Replace($oldText, $newText)
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "RED INTELFON - FIX TOTAL SIN NODE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1) Reemplazos controlados
$files = @(
    "js\app.js",
    "js\services\authService.js",
    "js\services\regionService.js",
    "js\services\syncService.js",
    "js\services\firebaseService.js",
    "js\services\makeService.js",
    "js\views\reportSection.js",
    "js\views\regionStatusBar.js"
)

foreach ($f in $files) {
    Copy-FixFile $f
}

# 2) Parchar generator.js
$generatorFile = Join-Path $PSScriptRoot "js\views\generator.js"
if (-not (Test-Path $generatorFile)) {
    Fail "No existe js\views\generator.js"
}
Backup-File $generatorFile
$gen = Get-Content $generatorFile -Raw -Encoding UTF8

$oldRun = @'
    let currentRunId = null;
'@

$newRun = @'
    let currentRunId = null;

    // Estado limpio de esta NUEVA instancia del generador.
    // No toca canProceed(); solo refleja que todavía no se seleccionó archivo aquí.
    SyncService.setDocumentStatus(activeRegion, {
        uploaded: false,
        fileName: null,
        count: 0
    }).catch(() => {});
'@

$gen = Replace-Required $gen $oldRun $newRun "reset estado archivo"

$oldMake = @'
data = await enviarArchivosAMake(selectedFiles, tipoReporte);
'@

$newMake = @'
data = await enviarArchivosAMake(selectedFiles, tipoReporte, {
                    region: activeRegion,
                    country: regionMeta.name,
                    executionId: processingId
                });
'@

$gen = Replace-Required $gen $oldMake $newMake "envio pais/ejecucion a Make"
Set-Content $generatorFile $gen -Encoding UTF8
Write-Host "PARCHEADO    js\views\generator.js" -ForegroundColor Green

# 3) Parchar report-viewer.html
$viewerFile = Join-Path $PSScriptRoot "report-viewer.html"
if (-not (Test-Path $viewerFile)) {
    Fail "No existe report-viewer.html"
}
Backup-File $viewerFile
$html = Get-Content $viewerFile -Raw -Encoding UTF8

$oldCountry = "let CURRENT_COUNTRY = 'GT'; // Por defecto siempre inicia en Guatemala"
$newCountry = @"
const REQUESTED_REGION = new URLSearchParams(window.location.search).get('region');
const LOCKED_COUNTRY = REQUESTED_REGION === 'SV' ? 'SV' : REQUESTED_REGION === 'GT' ? 'GT' : null;
let CURRENT_COUNTRY = LOCKED_COUNTRY || 'GT';
"@
$html = Replace-Required $html $oldCountry $newCountry "pais inicial visor"

$oldDebit = "const debit = numberValue(getField(m, 'Egreso', 'Debito', 'debito', 'debit', 'debits'));"
$newDebit = "const debit = numberValue(getField(m, 'Egreso', 'egreso', 'Debe', 'debe', 'Cargo', 'cargo', 'Débito', 'Debito', 'debito', 'debit', 'debits'));"
$html = Replace-Required $html $oldDebit $newDebit "Debe/Egreso"

$oldCredit = "const credit = numberValue(getField(m, 'Ingreso', 'Credito', 'credito', 'credit', 'credits'));"
$newCredit = "const credit = numberValue(getField(m, 'Ingreso', 'ingreso', 'Haber', 'haber', 'Abono', 'abono', 'Crédito', 'Credito', 'credito', 'credit', 'credits'));"
$html = Replace-Required $html $oldCredit $newCredit "Haber/Ingreso"

$oldSetCountry = @'
function setCountry(countryCode) {
  if (countryCode !== 'GT' && countryCode !== 'SV') return;
  CURRENT_COUNTRY = countryCode;
  updateCountryBadges();
  applyCountry(countryCode);
}
'@

$newSetCountry = @'
function setCountry(countryCode) {
  if (countryCode !== 'GT' && countryCode !== 'SV') return;
  if (LOCKED_COUNTRY && countryCode !== LOCKED_COUNTRY) return;
  CURRENT_COUNTRY = LOCKED_COUNTRY || countryCode;
  updateCountryBadges();
  applyCountry(CURRENT_COUNTRY);
}
'@

$html = Replace-Required $html $oldSetCountry $newSetCountry "bloqueo cambio de pais"

$domOld = "document.addEventListener('DOMContentLoaded', () => {"
$domNew = @"
document.addEventListener('DOMContentLoaded', () => {
  if (LOCKED_COUNTRY) {
    CURRENT_COUNTRY = LOCKED_COUNTRY;
    const switcher = document.getElementById('countrySwitcher');
    const quick = document.getElementById('btn-quick-toggle-country');
    if (switcher) switcher.style.display = 'none';
    if (quick) quick.style.display = 'none';
  }
"@

$html = Replace-Required $html $domOld $domNew "ocultar selector pais"

Set-Content $viewerFile $html -Encoding UTF8
Write-Host "PARCHEADO    report-viewer.html" -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "FIX TOTAL APLICADO SIN NODE" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Masters separados correctamente"
Write-Host "2. Guatemala -> GT / GTQ"
Write-Host "3. El Salvador -> SV / USD"
Write-Host "4. SyncService estable restaurado"
Write-Host "5. Make recibe pais, region y ejecucion_id"
Write-Host "6. Flujo diario lee Debe/Haber"
Write-Host "7. Visor bloqueado a la region de la sesion"
Write-Host "8. Backups creados con .backup-antes-fix"
Write-Host ""
Write-Host "CIERRA SESION Y PRUEBA EN UNA VENTANA INCOGNITO." -ForegroundColor Yellow
