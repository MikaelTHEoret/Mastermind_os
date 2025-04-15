@echo off
echo Starting Mastermind Codex OS v2 in continuous mode...
echo This will start both the backend server and ngrok (if available).
echo.
echo Two windows will open:
echo - One for the backend server
echo - One for ngrok (if available)
echo.
echo The databases will run continuously as long as the backend server is running.
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

REM Start the backend server in a new window
start "Mastermind Codex OS v2 - Backend Server" powershell -ExecutionPolicy Bypass -File "%~dp0run_server_continuous.ps1"

REM Check if ngrok exists
if exist "%NGROK_PATH%" (
    echo Ngrok found at %NGROK_PATH%
    echo Starting ngrok in continuous mode...
    
    if "%NGROK_AUTH_TOKEN%"=="" (
        start "Mastermind Codex OS v2 - Ngrok" powershell -ExecutionPolicy Bypass -File "%~dp0run_ngrok_continuous.ps1" -NgrokPath "%NGROK_PATH%"
    ) else (
        echo Using provided ngrok auth token for API access
        start "Mastermind Codex OS v2 - Ngrok" powershell -ExecutionPolicy Bypass -File "%~dp0run_ngrok_continuous.ps1" -NgrokPath "%NGROK_PATH%" -NgrokAuthToken "%NGROK_AUTH_TOKEN%"
    )
) else (
    echo Ngrok not found at %NGROK_PATH%
    echo If you want to use ngrok, please install it from https://ngrok.com/download
    echo and run this script with --ngrok-path parameter:
    echo start-continuous-all.bat --ngrok-path "C:\path\to\ngrok.exe"
)

echo.
echo Mastermind Codex OS v2 is now running in continuous mode!
echo.
echo - Backend API is available at: http://localhost:8000
echo - Databases are running continuously
echo - If ngrok is running, you can find the public URL in ngrok_url.txt
echo.
echo To stop the services, close their respective windows.
echo.
echo Press any key to close this window (the services will continue running)...
pause > nul
