@echo off
title Emerald Discord Bot
cd /d "%~dp0"

echo ============================================
echo   Emerald Discord Bot - 24/7 auto-restart
echo   Press CTRL+C to stop.
echo ============================================
echo.

:loop
echo [%date% %time%] Starting bot...
node src/index.js
echo.
echo [%date% %time%] Bot stopped/exited. Restarting in 5 seconds... (CTRL+C to quit)
timeout /t 5 /nobreak >nul
goto loop
