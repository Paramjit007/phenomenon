Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir

Write-Host "=== PHENOMENON Tester Agent Health Check ===" -ForegroundColor Cyan
Write-Host "Working directory: $scriptDir"

Write-Host "`n1) Docker Compose service status..." -ForegroundColor Yellow
try {
    docker compose ps
} catch {
    Write-Error "Failed to run 'docker compose ps'. Ensure Docker is installed and the terminal has access to Docker."
    Pop-Location
    exit 1
}

Write-Host "`n2) Checking service connectivity..." -ForegroundColor Yellow

$ports = @(
    @{ host = "localhost"; port = 5173; name = "Frontend" },
    @{ host = "localhost"; port = 8000; name = "Backend API" },
    @{ host = "localhost"; port = 5432; name = "Database" }
)

$allOk = $true
foreach ($service in $ports) {
    $conn = Test-NetConnection -ComputerName $service.host -Port $service.port -WarningAction SilentlyContinue
    if ($conn.TcpTestSucceeded) {
        Write-Host "  OK: $($service.name) is reachable on $($service.host):$($service.port)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: $($service.name) is not reachable on $($service.host):$($service.port)" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host "`n3) Testing API endpoints (via curl)..." -ForegroundColor Yellow
$urls = @(
    "http://localhost:5173",
    "http://localhost:8000/phenomena/",
    "http://localhost:8000/docs"
)

foreach ($url in $urls) {
    Write-Host "  Testing $url..." -ForegroundColor Gray
    try {
        $curlCmd = "curl.exe -s -w 'HTTP Status: %{http_code}' -o /dev/null $url"
        $result = Invoke-Expression $curlCmd 2>&1
        Write-Host "    $result" -ForegroundColor Green
    } catch {
        Write-Host "    Error: $_" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host "`n4) Backend logs tail..." -ForegroundColor Yellow
try {
    docker compose logs --tail 15 backend
} catch {
    Write-Host "  Unable to retrieve backend logs." -ForegroundColor Red
}

Write-Host "`n5) Frontend logs tail..." -ForegroundColor Yellow
try {
    docker compose logs --tail 15 frontend
} catch {
    Write-Host "  Unable to retrieve frontend logs." -ForegroundColor Red
}

if ($allOk) {
    Write-Host "`n✅ All checks passed. The tester agent confirms the application is reachable." -ForegroundColor Green
    Pop-Location
    exit 0
} else {
    Write-Host "`n⚠️  Some checks reported issues. Review logs above." -ForegroundColor Yellow
    Pop-Location
    exit 1
}
