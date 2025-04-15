# GPT Trading Assistant Launcher
Write-Host "Launching GPT Trading Assistant..." -ForegroundColor Green

# Navigate to the correct directory
Set-Location -Path "gpt_trader_assistant"

# Ask user for GUI preference
$useGui = Read-Host "Would you like to launch with GUI? (y/n)"

if ($useGui -eq 'y') {
    Write-Host "Starting with GUI interface..." -ForegroundColor Cyan
    .\start_with_gui.ps1
} else {
    Write-Host "Starting in console mode..." -ForegroundColor Yellow
    .\start.ps1
}
