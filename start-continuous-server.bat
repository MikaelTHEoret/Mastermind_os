@echo off
echo Starting Mastermind Codex OS v2 Backend Server in continuous mode...
echo This window will remain open to keep the server running.
echo.
echo To stop the server, close this window.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0backend\run_server_continuous.ps1"
