@echo off
echo Starting Ngrok in continuous mode for Mastermind Codex OS v2...
echo This window will remain open to keep ngrok running.
echo.
echo To stop ngrok, close this window.
echo.

REM Check for parameters
set NGROK_PATH=C:\Ngrok\ngrok.exe
set NGROK_AUTH_TOKEN=

:parse_args
if "%1"=="" goto end_parse_args
if "%1"=="--ngrok-path" (
    set NGROK_PATH=%2
    shift
    shift
    goto parse_args
)
if "%1"=="--auth-token" (
    set NGROK_AUTH_TOKEN=%2
    shift
    shift
    goto parse_args
)
shift
goto parse_args
:end_parse_args

if "%NGROK_AUTH_TOKEN%"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0backend\run_ngrok_continuous.ps1" -NgrokPath "%NGROK_PATH%"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0backend\run_ngrok_continuous.ps1" -NgrokPath "%NGROK_PATH%" -NgrokAuthToken "%NGROK_AUTH_TOKEN%"
)
