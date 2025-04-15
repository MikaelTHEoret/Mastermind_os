Write-Host "Installing dependencies..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path frontend
npm install
Set-Location -Path ..
Write-Host ""

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location -Path backend
pip install -r requirements.txt
Set-Location -Path ..
Write-Host ""

Write-Host "Starting the database MCP server..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "C:/Users/Mik/Documents/Cline/MCP/database-mcp-server/build/index.js" -WindowStyle Normal
Write-Host ""

Write-Host "Starting the application..." -ForegroundColor Green
Write-Host ""
npm run dev
