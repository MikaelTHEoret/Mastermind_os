..
@echo off
echo Starting Mastermind Codex OS v2 Unified Launcher...
echo.

REM Check if Ollama is running
echo Checking if Ollama is running...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -Method GET -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host 'Ollama is already running.' } } catch { Write-Host 'Ollama is not running. Please start Ollama first.'; exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo Please start Ollama and try again.
    pause
    exit /b 1
)

REM Start Ollama Nexus backend in a new window
echo Starting Ollama Nexus backend on port 8005...
start "Ollama Nexus Backend" cmd /c "cd /d %~dp0ollama-nexus && scripts\start.bat"

REM Wait for Ollama Nexus to start
echo Waiting for Ollama Nexus to start...
timeout /t 5 /nobreak > nul

REM Start Ollama Nexus MCP server in a new window
echo Starting Ollama Nexus MCP server...
start "Ollama Nexus MCP Server" cmd /c "cd /d %~dp0ollama-nexus\mcp-server && start.bat"

REM Wait for Ollama Nexus MCP server to start
echo Waiting for Ollama Nexus MCP server to start...
timeout /t 3 /nobreak > nul

REM Start the main application backend
echo Starting main application backend...
start "Mastermind Codex OS v2 Backend" cmd /c "cd /d %~dp0backend && python simple_main.py"

echo.
echo All components started successfully!
echo.
echo - Ollama is running on port 11434
echo - Ollama Nexus is running on port 8005
echo - Main application backend is running on port 8001
echo.
echo To stop all services, close their respective windows.
echo.
echo Press any key to close this window (the services will continue running)...
pause > nul
