# PowerShell script to run the Puppeteer MCP test

Write-Host "Running Puppeteer MCP test..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will demonstrate the capabilities of the Puppeteer MCP server" -ForegroundColor White
Write-Host "by opening a test page and interacting with it." -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptDir

# Run the test script
node test-puppeteer.js

Write-Host ""
Write-Host "Test completed. You can now use the Puppeteer MCP server with Claude." -ForegroundColor Green
Write-Host "See test-with-claude.js for example commands to use with Claude." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
