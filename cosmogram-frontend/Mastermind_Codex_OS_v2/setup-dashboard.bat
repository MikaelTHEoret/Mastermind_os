@echo off
echo ====================================================
echo    MASTERMIND DASHBOARD SYSTEM SETUP
echo ====================================================
echo.

REM Set working directory
cd /d "%~dp0"
echo Working Directory: %cd%
echo.

REM Check for required tools
echo Checking for required tools...
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version

where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH.
    pause
    exit /b 1
)
echo npm found:
npm --version
echo.

REM Create directory if it doesn't exist
IF NOT EXIST dashboard-app\node_modules (
    echo Setting up the dashboard application...
    
    REM Install dependencies
    cd dashboard-app
    echo Installing dependencies...
    call npm install react react-dom react-router-dom axios lucide-react
    call npm install -D typescript tailwindcss postcss autoprefixer @types/react @types/react-dom vite @vitejs/plugin-react
    
    REM Initialize TypeScript
    echo Initializing TypeScript...
    call npx tsc --init
    
    REM Setup Tailwind
    echo Setting up Tailwind CSS...
    call npx tailwindcss init -p
    
    cd ..
    echo Setup complete!
) ELSE (
    echo Dashboard dependencies already installed.
)

REM Ask if user wants to run the dashboard
echo.
echo Do you want to start the dashboard application? (Y/N)
set /p runDashboard=

IF /I "%runDashboard%"=="Y" (
    cd dashboard-app
    echo Starting dashboard application...
    start cmd /k "npm run dev"
    timeout /t 5
    start http://localhost:5173
)

REM Ask if user wants to setup backend API
echo.
echo Do you want to set up the backend API? (Y/N)
set /p setupBackend=

IF /I "%setupBackend%"=="Y" (
    echo Setting up backend API...
    cd backend
    
    REM Check for Python
    where python >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo WARNING: Python is not installed or not in PATH.
        echo Checking for Python3...
        where python3 >nul 2>&1
        IF %ERRORLEVEL% NEQ 0 (
            echo ERROR: Neither Python nor Python3 is found in PATH.
            echo Please install Python from https://www.python.org/
            cd ..
            pause
            exit /b 1
        ) ELSE (
            set PYTHON_CMD=python3
        )
    ) ELSE (
        set PYTHON_CMD=python
    )
    
    echo Python found:
    %PYTHON_CMD% --version
    
    REM Install Python dependencies
    echo Installing Python dependencies...
    %PYTHON_CMD% -m pip install fastapi uvicorn python-dotenv psycopg2-binary langchain langchain_huggingface langchain_qdrant qdrant-client pydantic httpx

    REM Start the API server
    echo Starting API server...
    start cmd /k "%PYTHON_CMD% -m uvicorn main_with_neon:app --reload"
    
    cd ..
)

echo.
echo ====================================================
echo    MASTERMIND DASHBOARD SYSTEM IS READY
echo ====================================================
echo.
echo - Dashboard: http://localhost:5173
echo - API (if started): http://localhost:8000
echo.
echo You can now use the dashboard to interact with your databases.
echo.
pause
