@echo off
:: I-enable ang command extensions para sa mas advanced nga features sa batch scripting
setlocal EnableExtensions
title BisayaSafe Launcher

:: Kuhaon ang current directory (folder kung asa nakabutang kani nga script) ug i-set isip ROOT
set "ROOT=%~dp0"
:: Mobalhin sa sulod sa ROOT directory aron sigurado nga husto ang lokasyon sa mga sunod nga command
cd /d "%ROOT%"

echo.
echo ========================================
echo   BisayaSafe - One-Click Start
echo ========================================
echo.

REM --- Check Docker ---
:: Susiha kung nagdagan ba ang Docker pinaagi sa pagtawag sa 'docker info'
:: I-tago ang agi (>nul 2>&1) para limpyo ang screen
docker info >nul 2>&1
:: Kung ang errorlevel kay 1 o pataas (nagpasabot wala nagdagan ang Docker), mosulod dinhi
if errorlevel 1 (
    echo [ERROR] Docker is not running.
    echo Open Docker Desktop first, wait until it says Running, then run this file again.
    echo.
    pause
    exit /b 1
)

REM --- Check Gemini API key in backend/.env ---
:: Pangitaon sa backend\.env kung naa bay "GEMINI_API_KEY=" sa sugod sa linya
:: I-check usab kung wala ba kini maggamit sa default/placeholder nga text
findstr /B "GEMINI_API_KEY=" "%ROOT%backend\.env" | findstr /V "your_gemini_api_key_here" >nul 2>&1
:: Kung dili makit-an o placeholder pa ang sulod, maghatag og warning
if errorlevel 1 (
    echo [WARN] Set GEMINI_API_KEY in backend\.env before running chat.
    echo Get a free key: https://aistudio.google.com/apikey
    :: huwaton og 4 seconds ang user para makabasa sa warning sa dili pa mopadayon
    timeout /t 4 /nobreak >nul
)

echo [1/4] Starting Docker (PostgreSQL + ChromaDB)...
:: Mag-abli og bag-ong command prompt window nga naay title nga "BisayaSafe - Docker"
:: I-execute ang 'docker compose up -d' para modagan ang mga sudlanan (containers) sa background
start "BisayaSafe - Docker" cmd /k "cd /d "%ROOT%" && docker compose up -d && echo. && echo Docker containers started. && echo."
:: Paabuton og 5 segundos para mahatagan og higayon ang Docker sa pag-initialize
timeout /t 5 /nobreak >nul

echo [2/4] Starting Backend API (port 3001)...
:: Mag open og laing window para sa Backend ug sugdan ang Node.js server gamit ang npm start
start "BisayaSafe - Backend" cmd /k "cd /d "%ROOT%backend" && npm.cmd start"

echo        Waiting for backend to be ready...
:: Mag-set og counter para sa gidaghanon sa pag-check sa backend health
set "TRIES=0"
:WAIT_BACKEND
:: Mag-send og silent request sa health check endpoint sa backend aron mahibal an kung ok na ba kini
curl -s -f http://localhost:3001/api/health >nul 2>&1
:: Kung mopadayon ang curl (errorlevel 0), mopaingon diretso sa BACKEND_OK
if not errorlevel 1 goto BACKEND_OK
:: Kung masipyat, pun-an og 1 ang counter
set /a TRIES+=1
:: Kung ka-45 na ka nagsige og check , mo-padayon na lang bisag hinay ang backend
if %TRIES% geq 45 (
    echo [WARN] Backend slow to start. Continuing anyway...
    goto BACKEND_OK
)
:: huwaton og 2 seconds matag check sa dili pa mobalik sa loop
timeout /t 2 /nobreak >nul
goto WAIT_BACKEND
:BACKEND_OK
echo        Backend is ready.

echo [3/4] Starting Frontend (port 5173)...
:: open og laing window para sa Frontend ug padaganon ang Vite development server
start "BisayaSafe - Frontend" cmd /k "cd /d "%ROOT%" && npm.cmd run dev"

echo        Waiting for Vite...
:: huwaton og 6 second para masiguro nga loading na ang Vite sa port 5173
timeout /t 6 /nobreak >nul

echo [4/4] Opening browser...
:: Awtomatik ablihan ang default web browser sa computer paingon sa lokal nga address sa frontend
start "" http://localhost:5173

echo.
echo ========================================
echo    Done! Keep these windows OPEN:
echo    - BisayaSafe - Backend
echo    - BisayaSafe - Frontend
echo.
echo    Chat:  http://localhost:5173
echo    Admin: http://localhost:5173/admin  (PIN: 1234)
echo ========================================
echo.
:: Pahunongon ang script aron magpabiling makita ang final summary sa main launcher window
pause