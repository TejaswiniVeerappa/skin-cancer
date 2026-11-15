$ErrorActionPreference = "Continue"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:PYTHONIOENCODING = "utf-8"

$backendDir = "c:\Users\Teju Kurtakoti\Desktop\Skin-cancer\backend"
$frontendDir = "c:\Users\Teju Kurtakoti\Desktop\Skin-cancer\frontend"
$logDir = "c:\Users\Teju Kurtakoti\Desktop\Skin-cancer\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$backendOut = Join-Path $logDir "backend_out.log"
$backendErr = Join-Path $logDir "backend_err.log"
$frontendOut = Join-Path $logDir "frontend_out.log"
$frontendErr = Join-Path $logDir "frontend_err.log"

Write-Host "Stopping any existing python/node processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*venv*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 800

Write-Host ""
Write-Host "Starting BACKEND (FastAPI on port 8000)..." -ForegroundColor Cyan
$backendProc = Start-Process `
    -FilePath (Join-Path $backendDir "venv\Scripts\python.exe") `
    -ArgumentList "-m","uvicorn","app.main:app","--app-dir",$backendDir,"--reload-dir",(Join-Path $backendDir "app"),"--reload","--host","0.0.0.0","--port","8000" `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -PassThru -NoNewWindow

Write-Host "  Backend PID: $($backendProc.Id)"
Write-Host "  Logs: $backendOut"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting FRONTEND (Vite on port 5173)..." -ForegroundColor Green
$vitePath = '"' + (Join-Path $frontendDir "node_modules\vite\bin\vite.js") + '"'
$frontendProc = Start-Process `
    -FilePath "node.exe" `
    -ArgumentList "$vitePath","--host","0.0.0.0" `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru -NoNewWindow

Write-Host "  Frontend PID: $($frontendProc.Id)"
Write-Host "  Logs: $frontendOut"

Start-Sleep -Seconds 6

Write-Host ""
Write-Host "=================================" -ForegroundColor White
Write-Host "  SERVERS LAUNCHED" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor White
Write-Host "  Backend  URL : http://127.0.0.1:8000/" -ForegroundColor Cyan
Write-Host "  Frontend URL : http://localhost:5173/" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend PID  : $($backendProc.Id)"
Write-Host "  Frontend PID : $($frontendProc.Id)"
Write-Host ""
Write-Host "  Super Admin Key: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To stop servers, close this window or run:" -ForegroundColor DarkGray
Write-Host '    Get-Process python,node | Stop-Process -Force' -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Tail backend log:" -ForegroundColor DarkGray
Write-Host "    Get-Content $backendOut -Wait -Tail 20" -ForegroundColor DarkGray
Write-Host "  Tail frontend log:" -ForegroundColor DarkGray
Write-Host "    Get-Content $frontendOut -Wait -Tail 20" -ForegroundColor DarkGray
Write-Host ""
