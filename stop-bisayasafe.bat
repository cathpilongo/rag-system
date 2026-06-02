@echo off
title BisayaSafe - Stop

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo Stopping BisayaSafe services...

REM Stop Docker containers for this project
docker compose down 2>nul

REM Kill processes on ports 3001 and 5173 (backend + frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo.
echo Stopped. Close any remaining "BisayaSafe" cmd windows manually if still open.
echo.
pause
