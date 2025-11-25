# Open application script for Windows PowerShell
# Starts backend, frontend, and opens browser
# Usage: .\open.ps1

$ErrorActionPreference = "Stop"

# Configuration
$BackendPort = 8000
$FrontendPort = 8080
$BackendUrl = "http://localhost:$BackendPort"
$FrontendUrl = "http://localhost:$FrontendPort"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[INFO] Starting 3D Graphing App..." -ForegroundColor Green
Write-Host "[INFO] Backend will run on: $BackendUrl" -ForegroundColor Green
Write-Host "[INFO] Frontend will run on: $FrontendUrl" -ForegroundColor Green

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-Port {
    param([int]$Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "[WARN] Port $Port is in use. Stopping process..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "[WARN] Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[INFO] Virtual environment created." -ForegroundColor Green
}

# Activate virtual environment
Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Green
& "venv\Scripts\Activate.ps1"

# Check if backend dependencies are installed
try {
    python -c "import fastapi" 2>$null
} catch {
    Write-Host "[WARN] Backend dependencies not installed. Installing..." -ForegroundColor Yellow
    Set-Location backend
    python -m pip install --upgrade pip -q
    python -m pip install -r requirements.txt -q
    Set-Location ..
    Write-Host "[INFO] Backend dependencies installed." -ForegroundColor Green
}

# Check if database exists
if (-not (Test-Path "backend\graphing_app.db")) {
    Write-Host "[WARN] Database not found. Initializing..." -ForegroundColor Yellow
    Set-Location backend
    $env:PYTHONPATH = "."
    python -m app.database.init_db
    Set-Location ..
    Write-Host "[INFO] Database initialized." -ForegroundColor Green
}

# Free up ports
Stop-Port -Port $BackendPort
Stop-Port -Port $FrontendPort

# Start backend server
Write-Host "[INFO] Starting backend server..." -ForegroundColor Green
Set-Location backend
$env:PYTHONPATH = "."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:ScriptDir\backend
    $env:PYTHONPATH = "."
    uvicorn app.main:app --host 0.0.0.0 --port $using:BackendPort --reload
} -Name "BackendServer"
Set-Location ..

# Wait for backend to be ready
Write-Host "[INFO] Waiting for backend to start..." -ForegroundColor Green
$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendReady) {
    Write-Host "[INFO] Backend is ready!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend failed to start." -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}

# Start frontend server
Write-Host "[INFO] Starting frontend server..." -ForegroundColor Green
Set-Location frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:ScriptDir\frontend
    python -m http.server $using:FrontendPort
} -Name "FrontendServer"
Set-Location ..

# Wait for frontend to be ready
Write-Host "[INFO] Waiting for frontend to start..." -ForegroundColor Green
$frontendReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$FrontendUrl" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($frontendReady) {
    Write-Host "[INFO] Frontend is ready!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend failed to start." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    exit 1
}

# Open browser
Write-Host "[INFO] Opening browser..." -ForegroundColor Green
Start-Sleep -Seconds 1
Start-Process $FrontendUrl

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Application is running!" -ForegroundColor Green
Write-Host "Backend API: $BackendUrl" -ForegroundColor White
Write-Host "Backend Docs: $BackendUrl/docs" -ForegroundColor White
Write-Host "Frontend: $FrontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "[ERROR] One of the servers has stopped." -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host "[INFO] Shutting down servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Stop-Port -Port $BackendPort
    Stop-Port -Port $FrontendPort
    Write-Host "[INFO] Cleanup complete." -ForegroundColor Green
}

