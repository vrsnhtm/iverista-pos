@echo off
setlocal
cd /d "%~dp0"

echo Starting Iverista POS...
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js / npm was not found. Install Node.js first, then run this again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this takes a minute...
  call npm install || goto :fail
)

if not exist "dist\index.html" (
  echo Building the app...
  call npm run build || goto :fail
)

echo Your tablet address, on the same Wi-Fi as this PC:
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' }).IPAddress"`) do echo    http://%%i:4173
echo.
echo Keep this window open while you are selling. Press Ctrl+C to stop.
echo.
call npm run serve
pause
exit /b 0

:fail
echo.
echo Something went wrong. Scroll up for the error.
pause
exit /b 1
