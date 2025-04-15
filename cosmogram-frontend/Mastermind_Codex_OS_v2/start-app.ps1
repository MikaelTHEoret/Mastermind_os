# Mastermind_Codex_OS_v2 Launcher Script
param (
    [switch]$UseNgrok = $false,
    [string]$NgrokPath = "C:\Ngrok\ngrok.exe",
    [string]$NgrokPort = "443",
    [switch]$SkipOllama = $false
)

Write-Host "Starting Mastermind Codex OS v2..." -ForegroundColor Cyan

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Verify required tools are installed
if (-not (Test-CommandExists "python")) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "Error: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if ngrok is available if UseNgrok is specified
if ($UseNgrok -and -not (Test-Path $NgrokPath)) {
    Write-Host "Error: Ngrok executable not found at $NgrokPath" -ForegroundColor Red
    Write-Host "Please specify the correct path using -NgrokPath parameter" -ForegroundColor Yellow
    exit 1
}

# Check if Ollama is installed
if (-not $SkipOllama) {
    if (-not (Test-CommandExists "ollama")) {
        Write-Host "Warning: Ollama is not installed or not in PATH. Ollama features will be disabled." -ForegroundColor Yellow
        Write-Host "To install Ollama, visit: https://ollama.com/download" -ForegroundColor Yellow
    } else {
        # Start Ollama with nous-hermes model
        Write-Host "Starting Ollama with nous-hermes model..." -ForegroundColor Green
        
        # Check if nous-hermes model is already pulled
        $modelExists = $false
        try {
            $ollamaModels = Invoke-Expression "ollama list" | Out-String
            $modelExists = $ollamaModels -match "nous-hermes"
        } catch {
            Write-Host "Error checking Ollama models: $_" -ForegroundColor Red
        }
        
        if (-not $modelExists) {
            Write-Host "Pulling nous-hermes model (this may take a while)..." -ForegroundColor Yellow
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama pull nous-hermes"
        } else {
            # Start Ollama server in a new PowerShell window
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
            Write-Host "Ollama server started with nous-hermes model available." -ForegroundColor Green
        }
    }
}

# Create .well-known directory if it doesn't exist
if (-not (Test-Path "backend\.well-known")) {
    Write-Host "Creating .well-known directory..." -ForegroundColor Yellow
    New-Item -Path "backend\.well-known" -ItemType Directory -Force | Out-Null
}

# Start the backend server in a new PowerShell window
Write-Host "Starting backend server (simplified version)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '$PSScriptRoot\backend'; python simple_main.py"

# Wait a moment for the backend to initialize
Start-Sleep -Seconds 2

# Start the frontend development server in a new PowerShell window
Write-Host "Starting frontend development server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '$PSScriptRoot\frontend'; npm run dev"

# Start ngrok if requested
if ($UseNgrok) {
    Write-Host "Starting ngrok to expose the backend API externally..." -ForegroundColor Green
    # Use port 8000 for the backend API
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$NgrokPath' http 8000"
    Write-Host "Ngrok started. Check the ngrok window for your public URL." -ForegroundColor Yellow
    Write-Host "Note: The ngrok URL will be your public API endpoint for the Recursive Codex API." -ForegroundColor Yellow
}

Write-Host "Mastermind Codex OS v2 is starting up!" -ForegroundColor Cyan
Write-Host "- Backend API should be available at: http://localhost:8000" -ForegroundColor Yellow
Write-Host "- Frontend should be available at: http://localhost:5173" -ForegroundColor Yellow
Write-Host "- Databases: SQLite (file-based, backend/codex_memory.db) and Qdrant (file-based, backend/qdrant_data/)" -ForegroundColor Yellow
if ($UseNgrok) {
    Write-Host "- External access via ngrok: Check the ngrok window for your public URL" -ForegroundColor Yellow
}
Write-Host "Press Ctrl+C in the respective terminal windows to stop the servers." -ForegroundColor Yellow
