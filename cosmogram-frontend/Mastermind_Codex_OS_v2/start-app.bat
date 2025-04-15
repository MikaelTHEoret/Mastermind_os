@echo off
echo Starting Mastermind Codex OS v2...
echo.

REM Check for parameters
set USE_NGROK=false
set NGROK_PATH=C:\Ngrok\ngrok.exe
set SKIP_OLLAMA=false

if "%1"=="--ngrok" set USE_NGROK=true
if "%1"=="--ngrok-path" (
    set NGROK_PATH=%2
    set USE_NGROK=true
)
if "%1"=="--skip-ollama" set SKIP_OLLAMA=true
if "%2"=="--skip-ollama" set SKIP_OLLAMA=true
if "%3"=="--skip-ollama" set SKIP_OLLAMA=true

if "%USE_NGROK%"=="true" (
    echo Ngrok mode enabled - application will be exposed externally
    echo Using ngrok executable: %NGROK_PATH%
    
    if "%SKIP_OLLAMA%"=="true" (
        echo Ollama integration disabled
        REM Run the PowerShell script with ngrok but without Ollama
        powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1" -UseNgrok -NgrokPath "%NGROK_PATH%" -SkipOllama
    ) else (
        REM Run the PowerShell script with ngrok and Ollama
        powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1" -UseNgrok -NgrokPath "%NGROK_PATH%"
    )
) else (
    if "%SKIP_OLLAMA%"=="true" (
        echo Ollama integration disabled
        REM Run the PowerShell script without ngrok and without Ollama
        powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1" -SkipOllama
    ) else (
        REM Run the PowerShell script without ngrok but with Ollama
        powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"
    )
)

echo.
echo If Ollama is enabled, the nous-hermes model will be used in the Nexus Terminal.
echo You can interact with it by typing in the Terminal chat box.

REM Keep the window open if there's an error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred while starting the application.
    pause
)
