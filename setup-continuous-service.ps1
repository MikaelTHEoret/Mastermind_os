# Setup Continuous Service for Mastermind Codex OS v2
# This script sets up both the backend server and ngrok to run continuously

$ErrorActionPreference = "Stop"

# Get the current directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Mastermind Codex OS v2 Continuous Service Setup ===" -ForegroundColor Cyan
Write-Host "This script will set up the backend server and ngrok to run continuously," -ForegroundColor Cyan
Write-Host "even after system restarts." -ForegroundColor Cyan
Write-Host ""

# Check for ngrok path
$NgrokPath = "C:\Ngrok\ngrok.exe"
$CustomNgrokPath = Read-Host "Enter the path to ngrok.exe or press Enter to use default [$NgrokPath]"
if ($CustomNgrokPath) {
    $NgrokPath = $CustomNgrokPath
}

# Verify ngrok exists
if (-not (Test-Path $NgrokPath)) {
    Write-Host "Warning: Ngrok executable not found at $NgrokPath" -ForegroundColor Yellow
    Write-Host "You can download ngrok from https://ngrok.com/download" -ForegroundColor Yellow
    $ContinueWithoutNgrok = Read-Host "Continue without ngrok? (Y/N)"
    if ($ContinueWithoutNgrok -ne "Y" -and $ContinueWithoutNgrok -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
    $SetupNgrok = $false
} else {
    $SetupNgrok = $true
}

# Update the ngrok path in the batch file if needed
if ($SetupNgrok -and $CustomNgrokPath) {
    $NgrokBatchPath = Join-Path $ScriptPath "start-continuous-ngrok.bat"
    $NgrokBatchContent = Get-Content $NgrokBatchPath -Raw
    $NgrokBatchContent = $NgrokBatchContent -replace "set NGROK_PATH=.*", "set NGROK_PATH=$NgrokPath"
    $NgrokBatchContent | Out-File -FilePath $NgrokBatchPath -Force
}

# Setup backend server scheduled task
Write-Host "Setting up backend server scheduled task..." -ForegroundColor Green
$BackendTaskName = "MastermindCodexOS_BackendServer"
$BackendBatchPath = Join-Path $ScriptPath "start-continuous-server.bat"

# Check if the task already exists
$BackendTaskExists = Get-ScheduledTask -TaskName $BackendTaskName -ErrorAction SilentlyContinue
if ($BackendTaskExists) {
    Write-Host "Task $BackendTaskName already exists. Removing it..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $BackendTaskName -Confirm:$false
}

# Create a new scheduled task for backend
$BackendAction = New-ScheduledTaskAction -Execute $BackendBatchPath -WorkingDirectory $ScriptPath
$BackendTrigger = New-ScheduledTaskTrigger -AtStartup
$BackendSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Register the task
Register-ScheduledTask -TaskName $BackendTaskName -Action $BackendAction -Trigger $BackendTrigger -Settings $BackendSettings -Description "Runs the Mastermind Codex OS v2 Backend Server continuously" -RunLevel Highest
Write-Host "Backend server scheduled task created successfully!" -ForegroundColor Green

# Setup ngrok scheduled task if ngrok is available
if ($SetupNgrok) {
    Write-Host "Setting up ngrok scheduled task..." -ForegroundColor Green
    $NgrokTaskName = "MastermindCodexOS_Ngrok"
    $NgrokBatchPath = Join-Path $ScriptPath "start-continuous-ngrok.bat"
    
    # Check if the task already exists
    $NgrokTaskExists = Get-ScheduledTask -TaskName $NgrokTaskName -ErrorAction SilentlyContinue
    if ($NgrokTaskExists) {
        Write-Host "Task $NgrokTaskName already exists. Removing it..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $NgrokTaskName -Confirm:$false
    }
    
    # Create a new scheduled task for ngrok
    $NgrokAction = New-ScheduledTaskAction -Execute $NgrokBatchPath -WorkingDirectory $ScriptPath
    $NgrokTrigger = New-ScheduledTaskTrigger -AtStartup
    $NgrokSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    
    # Register the task
    Register-ScheduledTask -TaskName $NgrokTaskName -Action $NgrokAction -Trigger $NgrokTrigger -Settings $NgrokSettings -Description "Runs Ngrok continuously for Mastermind Codex OS v2" -RunLevel Highest
    Write-Host "Ngrok scheduled task created successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "The Mastermind Codex OS v2 backend server and ngrok (if available) will now run continuously," -ForegroundColor Green
Write-Host "even after system restarts." -ForegroundColor Green
Write-Host ""
Write-Host "You can manage these services in Task Scheduler:" -ForegroundColor Yellow
Write-Host "- Task name for backend server: MastermindCodexOS_BackendServer" -ForegroundColor Yellow
if ($SetupNgrok) {
    Write-Host "- Task name for ngrok: MastermindCodexOS_Ngrok" -ForegroundColor Yellow
}
Write-Host ""

# Ask if the user wants to start the services now
$StartNow = Read-Host "Do you want to start the services now? (Y/N)"
if ($StartNow -eq "Y" -or $StartNow -eq "y") {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Start-Process (Join-Path $ScriptPath "start-continuous-server.bat")
    
    if ($SetupNgrok) {
        Write-Host "Starting ngrok..." -ForegroundColor Cyan
        Start-Process (Join-Path $ScriptPath "start-continuous-ngrok.bat") -ArgumentList "--ngrok-path", $NgrokPath
    }
    
    Write-Host "Services started!" -ForegroundColor Green
    Write-Host "You can find the current ngrok URL in backend/ngrok_url.txt once ngrok is running." -ForegroundColor Yellow
}
