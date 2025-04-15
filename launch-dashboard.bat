@echo off
echo ====================================================
echo    MASTERMIND DASHBOARD LAUNCHER
echo ====================================================
echo.

REM Set working directory
cd /d "%~dp0"

REM Check if the dashboard directory exists
IF NOT EXIST dashboard-app (
    echo ERROR: Dashboard application not found.
    echo Please run setup-dashboard.bat first.
    pause
    exit /b 1
)

REM Launch frontend
cd dashboard-app
start cmd /k "npm run dev"
echo Frontend started at http://localhost:5173
timeout /t 3

REM Ask if user wants to also start the backend
echo.
echo Do you want to start the backend API? (Y/N)
set /p startBackend=

IF /I "%startBackend%"=="Y" (
    cd ../backend
    echo Starting backend API...
    
    REM Check for Python
    where python >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo WARNING: Python is not installed or not in PATH.
        echo Checking for Python3...
        where python3 >nul 2>&1
        IF %ERRORLEVEL% NEQ 0 (
            echo ERROR: Neither Python nor Python3 is found in PATH.
            cd ..
            pause
            exit /b 1
        ) ELSE (
            set PYTHON_CMD=python3
        )
    ) ELSE (
        set PYTHON_CMD=python
    )
    
    start cmd /k "%PYTHON_CMD% -m uvicorn main_with_neon:app --reload"
    cd ..
    echo Backend API started at http://localhost:8000
)

REM Open dashboard in browser
echo.
echo Opening dashboard in browser...
start http://localhost:5173

echo.
echo ====================================================
echo    MASTERMIND DASHBOARD IS RUNNING
echo ====================================================
echo.
echo - Dashboard: http://localhost:5173
echo - API (if started): http://localhost:8000
echo.
echo Press any key to close this window. The dashboard will continue running.
echo.
pause
