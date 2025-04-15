@echo off
title Mastermind Control Center
color 0B

:menu
cls
echo ====================================================
echo            MASTERMIND CONTROL CENTER
echo ====================================================
echo.
echo  [1] Configure Database Connections
echo  [2] Set Up Dashboard System
echo  [3] Launch Dashboard
echo  [4] Initialize Database Schema
echo  [5] Create Backup
echo  [6] Check System Status
echo  [7] Exit
echo.
echo ====================================================
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto configure
if "%choice%"=="2" goto setup
if "%choice%"=="3" goto launch
if "%choice%"=="4" goto initialize
if "%choice%"=="5" goto backup
if "%choice%"=="6" goto status
if "%choice%"=="7" goto end

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:configure
cls
echo Running connection configuration...
call configure-connections.bat
pause
goto menu

:setup
cls
echo Setting up the dashboard system...
call setup-dashboard.bat
goto menu

:launch
cls
echo Launching the dashboard...
start launch-dashboard.bat
goto menu

:initialize
cls
echo Initializing database schema...
echo.
echo This will create all necessary tables and functions in your databases.
echo Make sure your database connections are configured correctly.
echo.
echo Do you want to continue? (Y/N)
set /p confirm=

if /i not "%confirm%"=="Y" goto menu

echo.
echo Sending initialization request to API...
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:8000/initialize' -Method 'POST'"

echo.
echo Database initialization complete.
pause
goto menu

:backup
cls
echo Creating system backup...
echo.

REM Create backup directory if it doesn't exist
if not exist backups mkdir backups

REM Create timestamp for backup filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"

set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "backupfile=backups\mastermind_backup_%timestamp%.zip"

echo Backing up configuration and code files...
powershell -Command "Compress-Archive -Path 'backend\*.py', 'backend\*.env', 'dashboard-app\src\*', 'dashboard-app\*.json', '*.bat' -DestinationPath '%backupfile%' -Force"

echo.
echo Backup completed: %backupfile%
pause
goto menu

:status
cls
echo Checking system status...
echo.
echo === Node.js Status ===
node --version

echo.
echo === Dashboard Status ===
powershell -Command "try { $result = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 2; Write-Host 'Dashboard is RUNNING' } catch { Write-Host 'Dashboard is NOT RUNNING' }"

echo.
echo === API Status ===
powershell -Command "try { $result = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 2; Write-Host 'API is RUNNING' } catch { Write-Host 'API is NOT RUNNING' }"

echo.
echo === Database Connection Status ===
powershell -Command "try { $result = Invoke-WebRequest -Uri 'http://localhost:8000/api/neon/status' -TimeoutSec 2; $result.Content } catch { Write-Host 'Could not get database status. Make sure API is running.' }"

echo.
pause
goto menu

:end
cls
echo Thank you for using Mastermind Control Center.
echo Goodbye!
timeout /t 3 >nul
exit /b 0
