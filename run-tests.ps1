#Requires -Version 5.1
<#
.SYNOPSIS
  PHENOMENON — Professional E2E Test Runner
  Runs the full Playwright test suite against the running Docker stack.

.DESCRIPTION
  Usage:
    .\run-tests.ps1                    # Run all tests, headless
    .\run-tests.ps1 -Suite smoke       # Run only smoke tests
    .\run-tests.ps1 -Suite seguros     # Run only Seguros demo tests
    .\run-tests.ps1 -Suite kpmg        # Run only KPMG demo tests
    .\run-tests.ps1 -Headed            # Run in headed mode (see the browser)
    .\run-tests.ps1 -UI                # Open Playwright interactive UI
    .\run-tests.ps1 -Report            # Open last HTML report
    .\run-tests.ps1 -Install           # Install Playwright browsers only

.PARAMETER Suite
  Which test suite to run: all | smoke | selection | seguros | kpmg | contracts | verify | tabs | cascade

.PARAMETER Headed
  Run tests in headed (visible browser) mode.

.PARAMETER UI
  Open Playwright's interactive test runner UI.

.PARAMETER Report
  Open the last generated HTML report.

.PARAMETER Install
  Install/update Playwright browsers and exit.

.PARAMETER Workers
  Number of parallel workers (default: 1 for DB-shared state).
#>
param(
  [string]$Suite   = "all",
  [switch]$Headed,
  [switch]$UI,
  [switch]$Report,
  [switch]$Install,
  [int]$Workers    = 1
)

$ErrorActionPreference = "Stop"
$E2E_DIR = Join-Path $PSScriptRoot "e2e"
$BACKEND_URL = "http://localhost:8000/health"
$FRONTEND_URL = "http://localhost:5173"

function Write-Banner($text, $color = "Cyan") {
  Write-Host ""
  Write-Host "══════════════════════════════════════════════════" -ForegroundColor $color
  Write-Host "  $text" -ForegroundColor $color
  Write-Host "══════════════════════════════════════════════════" -ForegroundColor $color
  Write-Host ""
}

function Test-ServiceReachable($url, $label) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  OK   $label reachable ($url)" -ForegroundColor Green
    return $true
  } catch {
    Write-Host "  FAIL $label not reachable ($url)" -ForegroundColor Red
    return $false
  }
}

# ── Show report only ─────────────────────────────────────────────────────────
if ($Report) {
  Write-Banner "Opening HTML Test Report" "Yellow"
  Set-Location $E2E_DIR
  npx playwright show-report reports/html
  exit 0
}

# ── Install only ─────────────────────────────────────────────────────────────
if ($Install) {
  Write-Banner "Installing Playwright Browsers" "Yellow"
  Set-Location $E2E_DIR
  if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
  }
  npx playwright install chromium
  Write-Host "`nPlaywright installed successfully." -ForegroundColor Green
  exit 0
}

# ── Pre-flight checks ─────────────────────────────────────────────────────────
Write-Banner "PHENOMENON E2E Test Suite" "Cyan"
Write-Host "  Suite:   $Suite" -ForegroundColor White
Write-Host "  Headed:  $Headed" -ForegroundColor White
Write-Host "  Workers: $Workers" -ForegroundColor White
Write-Host ""

Write-Host "Checking services..." -ForegroundColor Yellow
$backendOk  = Test-ServiceReachable $BACKEND_URL "Backend (FastAPI)"
$frontendOk = Test-ServiceReachable $FRONTEND_URL "Frontend (Vite)"

if (-not $backendOk -or -not $frontendOk) {
  Write-Host ""
  Write-Host "One or more services are not running." -ForegroundColor Red
  Write-Host "Start them with: docker compose up -d  (from phenomenon/)" -ForegroundColor Yellow
  Write-Host ""
  $start = Read-Host "Start Docker services now? (y/N)"
  if ($start -eq "y" -or $start -eq "Y") {
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    docker compose up -d
    Write-Host "Waiting 10s for services to be ready..."
    Start-Sleep 10
  } else {
    exit 1
  }
}

# ── Install dependencies if needed ────────────────────────────────────────────
Set-Location $E2E_DIR
if (-not (Test-Path "node_modules")) {
  Write-Host "`nInstalling npm dependencies..." -ForegroundColor Yellow
  npm install
  npx playwright install chromium
  Write-Host "Done." -ForegroundColor Green
}

# ── Build Playwright command ───────────────────────────────────────────────────
$cmd = "npx playwright test"

# Suite filter
$suiteFilter = switch ($Suite) {
  "smoke"      { "01-smoke" }
  "selection"  { "02-selection" }
  "seguros"    { "03-seguros" }
  "kpmg"       { "04-kpmg" }
  "contracts"  { "05-contract" }
  "verify"     { "06-verification" }
  "tabs"       { "07-tabs" }
  "cascade"    { "08-cascade" }
  default      { "" }
}

if ($UI) {
  Write-Banner "Opening Playwright UI" "Magenta"
  Invoke-Expression "npx playwright test --ui"
  exit 0
}

$args_list = @()
if ($suiteFilter) { $args_list += $suiteFilter }
if ($Headed)      { $args_list += "--headed" }
$args_list += "--workers=$Workers"

$full_cmd = "npx playwright test $($args_list -join ' ')"

# ── Run tests ─────────────────────────────────────────────────────────────────
Write-Host "`nRunning: $full_cmd" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
Invoke-Expression $full_cmd
$exitCode  = $LASTEXITCODE
$duration  = (Get-Date) - $startTime

# ── Results summary ────────────────────────────────────────────────────────────
Write-Host ""
if ($exitCode -eq 0) {
  Write-Banner "ALL TESTS PASSED  ($([int]$duration.TotalSeconds)s)" "Green"
} else {
  Write-Banner "SOME TESTS FAILED  ($([int]$duration.TotalSeconds)s)" "Red"
  Write-Host "  See full report: .\run-tests.ps1 -Report" -ForegroundColor Yellow
}

Write-Host "  Report: $E2E_DIR\reports\html\index.html" -ForegroundColor Cyan
Write-Host ""

# Auto-open report on failure
if ($exitCode -ne 0) {
  $open = Read-Host "Open HTML report now? (Y/n)"
  if ($open -ne "n" -and $open -ne "N") {
    npx playwright show-report reports/html
  }
}

exit $exitCode
