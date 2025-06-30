@echo off
echo Running Puppeteer MCP test...
echo.
echo This will demonstrate the capabilities of the Puppeteer MCP server
echo by opening a test page and interacting with it.
echo.
echo Press any key to continue...
pause > nul

cd /d "%~dp0"
node test-puppeteer.js

echo.
echo Test completed. You can now use the Puppeteer MCP server with Claude.
echo See test-with-claude.js for example commands to use with Claude.
echo.
pause
