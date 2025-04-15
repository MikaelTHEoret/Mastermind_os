@echo off
echo ====================================================
echo    MASTERMIND DATABASE CONNECTION CONFIGURATION
echo ====================================================
echo.

REM Set working directory
cd /d "%~dp0"

REM Create .env file for backend
IF NOT EXIST backend (
    echo Creating backend directory...
    mkdir backend
)

echo Creating .env file for database connections...
echo.
echo Please enter your database connection details:
echo.

REM Get Mastermind database connection
echo === Mastermind Database ===
set /p mastermindProjectId="Project ID (e.g., fancy-waterfall-67832806): "
set /p mastermindConnString="Connection String: "

REM Get NeuralDBApp database connection
echo.
echo === NeuralDBApp Database ===
set /p neuralDbProjectId="Project ID (e.g., mute-hill-71288021): "
set /p neuralDbConnString="Connection String: "

REM Get CodexDoc database connection
echo.
echo === CodexDoc Database ===
set /p codexDocProjectId="Project ID (e.g., aged-brook-87920580): "
set /p codexDocConnString="Connection String: "

REM Get CodexMemory database connection
echo.
echo === CodexMemory Database ===
set /p codexMemoryProjectId="Project ID (e.g., shy-dawn-30097352): "
set /p codexMemoryConnString="Connection String: "

REM Write to .env file
echo Writing configuration to .env file...
(
echo # Database Connection Settings
echo MASTERMIND_PROJECT_ID=%mastermindProjectId%
echo MASTERMIND_DATABASE=neondb
echo MASTERMIND_CONNECTION_STRING=%mastermindConnString%
echo.
echo NEURAL_DB_PROJECT_ID=%neuralDbProjectId%
echo NEURAL_DB_DATABASE=neondb
echo NEURAL_DB_CONNECTION_STRING=%neuralDbConnString%
echo.
echo CODEX_DOC_PROJECT_ID=%codexDocProjectId%
echo CODEX_DOC_DATABASE=neondb
echo CODEX_DOC_CONNECTION_STRING=%codexDocConnString%
echo.
echo CODEX_MEMORY_PROJECT_ID=%codexMemoryProjectId%
echo CODEX_MEMORY_DATABASE=neondb
echo CODEX_MEMORY_CONNECTION_STRING=%codexMemoryConnString%
echo.
echo # API Settings
echo API_PORT=8000
echo CORS_ORIGIN=http://localhost:5173
) > backend\.env

echo.
echo Configuration saved to backend\.env
echo.

REM Create a local .env file for the frontend
echo Creating frontend environment configuration...
(
echo VITE_API_URL=http://localhost:8000
) > dashboard-app\.env.local

echo Frontend configuration saved to dashboard-app\.env.local
echo.

echo ====================================================
echo    CONFIGURATION COMPLETE
echo ====================================================
echo.
echo You can now run setup-dashboard.bat to start the application.
echo.
pause
