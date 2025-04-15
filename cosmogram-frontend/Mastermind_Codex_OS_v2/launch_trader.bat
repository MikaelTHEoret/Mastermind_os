@echo off
echo Launching GPT Trading Assistant...

:: Navigate to the correct directory
cd gpt_trader_assistant

:: Ask user for GUI preference
set /p useGui="Would you like to launch with GUI? (y/n): "

if /i "%useGui%"=="y" (
    echo Starting with GUI interface...
    call start_with_gui.bat
) else (
    echo Starting in console mode...
    call start.bat
)
