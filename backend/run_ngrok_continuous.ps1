# Continuous Ngrok Runner for Mastermind Codex OS v2
# This script runs ngrok and restarts it if it crashes
# Uses the ngrok API for better tunnel management

param (
    [string]$NgrokPath = "C:\Ngrok\ngrok.exe",
    [string]$NgrokPort = "8001",
    [string]$NgrokAuthToken = $null
)

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# Log file for output
$LogFile = Join-Path $ScriptPath "ngrok_log.txt"

function Write-Log {
    param (
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp - $Message" | Out-File -Append -FilePath $LogFile
    Write-Host "$Timestamp - $Message"
}

Write-Log "Starting Ngrok in continuous mode for Mastermind Codex OS v2..."

# Check if ngrok executable exists
if (-not (Test-Path $NgrokPath)) {
    Write-Log "Error: Ngrok executable not found at $NgrokPath"
    Write-Log "Please specify the correct path using -NgrokPath parameter"
    exit 1
}

# Create a file to store the current ngrok URL
$UrlFile = Join-Path $ScriptPath "ngrok_url.txt"

# Try to get the auth token from ngrok config if not provided
if (-not $NgrokAuthToken) {
    $NgrokConfigPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"
    if (Test-Path $NgrokConfigPath) {
        $NgrokConfig = Get-Content $NgrokConfigPath -Raw
        if ($NgrokConfig -match "authtoken:\s*(.+)") {
            $NgrokAuthToken = $matches[1].Trim()
            Write-Log "Found ngrok auth token in config file"
        }
    }
}

# Function to check if a tunnel is active by checking the output file
function Get-NgrokTunnelFromOutput {
    if (Test-Path "ngrok_output.txt") {
        $content = Get-Content "ngrok_output.txt" -Raw
        if ($content -match "url=https://[^\.]+\.ngrok-free\.app") {
            return $matches[0] -replace "url=", ""
        }
    }
    return $null
}

# Function to check if ngrok is running
function Test-NgrokRunning {
    $ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    return $null -ne $ngrokProcess
}

# Main loop to keep ngrok running
while ($true) {
    try {
        # Check if ngrok is already running
        if (Test-NgrokRunning) {
            Write-Log "Ngrok is already running. Checking tunnel status..."
            
            # Check tunnel status from output file
            $url = Get-NgrokTunnelFromOutput
            
            if ($url) {
                # Tunnel is active, get the URL
                Write-Log "Ngrok tunnel is active with URL: $url"
                $url | Out-File -FilePath $UrlFile -Force
                
                # Create a .well-known/ngrok.txt file with the URL for the frontend to use
                $wellKnownDir = Join-Path $ScriptPath ".well-known"
                if (-not (Test-Path $wellKnownDir)) {
                    New-Item -Path $wellKnownDir -ItemType Directory -Force | Out-Null
                }
                
                $url | Out-File -FilePath (Join-Path $wellKnownDir "ngrok.txt") -Force
                
                # Sleep for a while before checking again
                Write-Log "Tunnel is healthy. Checking again in 60 seconds..."
                Start-Sleep -Seconds 60
                continue
            } else {
                Write-Log "No active tunnel found. Restarting ngrok..."
                Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
            }
        }
        
        Write-Log "Starting ngrok for port $NgrokPort..."
        
        # Start ngrok and capture its output
        $process = Start-Process -FilePath $NgrokPath -ArgumentList "http", $NgrokPort, "--log=stdout" -NoNewWindow -PassThru -RedirectStandardOutput "ngrok_output.txt"
        
        # Wait a moment for ngrok to start
        Start-Sleep -Seconds 5
        
        # Try to extract the public URL from ngrok's output
        $attempts = 0
        $maxAttempts = 12  # Try for up to 1 minute (5 seconds * 12)
        $url = $null
        
        while ($attempts -lt $maxAttempts) {
            # Try to get the URL from the output file
            $url = Get-NgrokTunnelFromOutput
            if ($url) {
                Write-Log "Found tunnel URL in output: $url"
                break
            }
            
            $attempts++
            Start-Sleep -Seconds 5
        }
        
        if ($url) {
            Write-Log "Ngrok running with public URL: $url"
            $url | Out-File -FilePath $UrlFile -Force
            
            # Create a .well-known/ngrok.txt file with the URL for the frontend to use
            $wellKnownDir = Join-Path $ScriptPath ".well-known"
            if (-not (Test-Path $wellKnownDir)) {
                New-Item -Path $wellKnownDir -ItemType Directory -Force | Out-Null
            }
            
            $url | Out-File -FilePath (Join-Path $wellKnownDir "ngrok.txt") -Force
            
            # Monitor the tunnel in a loop
            while (Test-NgrokRunning) {
                $url = Get-NgrokTunnelFromOutput
                if (-not $url) {
                    Write-Log "Tunnel appears to be down. Restarting ngrok..."
                    break
                }
                
                Write-Log "Tunnel is healthy. Checking again in 60 seconds..."
                Start-Sleep -Seconds 60
            }
        } else {
            Write-Log "Warning: Could not determine ngrok URL"
            
            # If ngrok is running but we couldn't get the URL, wait a bit and then restart
            if (Test-NgrokRunning) {
                Write-Log "Ngrok is running but URL could not be determined. Restarting..."
                Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
            }
        }
        
        # If we get here, either the tunnel is down or ngrok has exited
        if (Test-NgrokRunning) {
            Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
        }
        
        Write-Log "Ngrok needs to be restarted. Waiting 5 seconds..."
    }
    catch {
        # If there's an error, log it and restart
        Write-Log "Error in ngrok: $_"
        Write-Log "Restarting in 10 seconds..."
        
        # Make sure ngrok is stopped
        try {
            Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
        } catch {
            # Ignore errors when trying to stop ngrok
        }
        
        Start-Sleep -Seconds 10
    }
    
    # Short delay before restarting
    Start-Sleep -Seconds 5
}
