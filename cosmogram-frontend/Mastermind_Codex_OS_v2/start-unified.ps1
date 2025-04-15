# Unified Launcher for Mastermind Codex OS v2
Write-Host "Starting Mastermind Codex OS v2 Unified Launcher..." -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is running
Write-Host "Checking if Ollama is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "Ollama is already running." -ForegroundColor Green
    }
} catch {
    Write-Host "Ollama is not running. Please start Ollama first." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Start Ollama Nexus backend in a new window
Write-Host "Starting Ollama Nexus backend on port 8005..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$nexusPath = Join-Path -Path $scriptPath -ChildPath "ollama-nexus"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$nexusPath`" && scripts\start.bat" -WindowStyle Normal

# Wait for Ollama Nexus to start
Write-Host "Waiting for Ollama Nexus to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Ollama Nexus MCP server in a new window
Write-Host "Starting Ollama Nexus MCP server..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mcpServerPath = Join-Path -Path $scriptPath -ChildPath "ollama-nexus\mcp-server"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$mcpServerPath`" && start.bat" -WindowStyle Normal

# Wait for Ollama Nexus MCP server to start
Write-Host "Waiting for Ollama Nexus MCP server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the main application backend
Write-Host "Starting main application backend..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path -Path $scriptPath -ChildPath "backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$backendPath`" && python simple_main.py" -WindowStyle Normal

Write-Host ""
Write-Host "All components started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "- Ollama is running on port 11434" -ForegroundColor Cyan
Write-Host "- Ollama Nexus is running on port 8005" -ForegroundColor Cyan
Write-Host "- Main application backend is running on port 8001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, close their respective windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window (the services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
