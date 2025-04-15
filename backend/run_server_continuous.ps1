# Continuous Backend Server Runner for Mastermind Codex OS v2
# This script runs the backend server and restarts it if it crashes

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# Log file for output
$LogFile = Join-Path $ScriptPath "server_log.txt"

function Write-Log {
    param (
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp - $Message" | Out-File -Append -FilePath $LogFile
    Write-Host "$Timestamp - $Message"
}

Write-Log "Starting Mastermind Codex OS v2 Backend Server in continuous mode..."

# Check if Python is installed
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Log "Error: Python is not installed or not in PATH"
    exit 1
}

# Ensure .well-known directory exists
if (-not (Test-Path ".well-known")) {
    Write-Log "Creating .well-known directory..."
    New-Item -Path ".well-known" -ItemType Directory -Force | Out-Null
}

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $connections = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":$Port "
    return $null -ne $connections
}

# Function to find an available port
function Find-AvailablePort {
    param (
        [int]$StartPort = 8000,
        [int]$MaxPort = 8100
    )
    
    for ($port = $StartPort; $port -le $MaxPort; $port++) {
        if (-not (Test-PortInUse -Port $port)) {
            return $port
        }
    }
    
    return $null
}

# Function to kill processes using a specific port
function Kill-ProcessUsingPort {
    param (
        [int]$Port
    )
    
    $connections = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":$Port "
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection -split '\s+'
            $processPid = $parts[-1]
            Write-Log "Killing process with PID $processPid that is using port $Port"
            Stop-Process -Id $processPid -Force
        }
        return $true
    }
    
    return $false
}

# Main loop to keep the server running
while ($true) {
    try {
        # Check if port 8000 is in use
        if (Test-PortInUse -Port 8000) {
            Write-Log "Port 8000 is already in use. Attempting to kill the process..."
            if (Kill-ProcessUsingPort -Port 8000) {
                Write-Log "Successfully killed process using port 8000."
                # Wait a moment for the port to be released
                Start-Sleep -Seconds 2
            } else {
                Write-Log "Failed to kill process. Looking for an alternative port..."
                $port = Find-AvailablePort
                if ($port) {
                    Write-Log "Using alternative port: $port"
                    # Start the backend server with a custom port
                    Write-Log "Starting backend server on port $port..."
                    python -c "import simple_main; import uvicorn; uvicorn.run(simple_main.app, host='0.0.0.0', port=$port)"
                    Write-Log "Backend server on port $port exited. Restarting in 5 seconds..."
                    continue
                } else {
                    Write-Log "No available ports found. Waiting 30 seconds before trying again..."
                    Start-Sleep -Seconds 30
                    continue
                }
            }
        }
        
        Write-Log "Starting backend server on port 8000..."
        
        # Start the backend server
        python simple_main.py
        
        # If the server exits normally, log it and restart
        Write-Log "Backend server exited. Restarting in 5 seconds..."
    }
    catch {
        # If there's an error, log it and restart
        Write-Log "Error in backend server: $_"
        Write-Log "Restarting in 10 seconds..."
        Start-Sleep -Seconds 10
    }
    
    # Short delay before restarting
    Start-Sleep -Seconds 5
}
