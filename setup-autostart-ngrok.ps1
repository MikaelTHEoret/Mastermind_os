# Setup Autostart for Ngrok
# This script creates a scheduled task to run ngrok at system startup

$ErrorActionPreference = "Stop"

# Get the current directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatchFilePath = Join-Path $ScriptPath "start-continuous-ngrok.bat"

# Task name
$TaskName = "MastermindCodexOS_Ngrok"

# Check if the batch file exists
if (-not (Test-Path $BatchFilePath)) {
    Write-Host "Error: Could not find $BatchFilePath" -ForegroundColor Red
    exit 1
}

# Check if the task already exists
$TaskExists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($TaskExists) {
    Write-Host "Task $TaskName already exists. Removing it..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create a new scheduled task
$Action = New-ScheduledTaskAction -Execute $BatchFilePath -WorkingDirectory $ScriptPath
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Register the task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs Ngrok continuously for Mastermind Codex OS v2" -RunLevel Highest

Write-Host "Scheduled task $TaskName created successfully!" -ForegroundColor Green
Write-Host "Ngrok will now start automatically at system startup." -ForegroundColor Green
Write-Host "You can manage this task in Task Scheduler." -ForegroundColor Yellow

# Ask if the user wants to start ngrok now
$StartNow = Read-Host "Do you want to start ngrok now? (Y/N)"
if ($StartNow -eq "Y" -or $StartNow -eq "y") {
    Write-Host "Starting ngrok..." -ForegroundColor Cyan
    Start-Process $BatchFilePath
    Write-Host "Ngrok started!" -ForegroundColor Green
}
