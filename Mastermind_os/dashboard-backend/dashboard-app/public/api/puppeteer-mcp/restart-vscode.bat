@echo off
echo Restarting VSCode to apply MCP settings changes...
taskkill /f /im code.exe
start code "C:\Users\Mik\Documents\GitHub\Mastermind_Codex_OS_v2"
echo VSCode has been restarted.
