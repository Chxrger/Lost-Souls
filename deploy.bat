@echo off
title Deploy Slash Commands
cd /d "%~dp0"

echo Registering slash commands with Discord...
node src/deploy-commands.js
echo.
pause
