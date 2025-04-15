@echo off
echo Installing dependencies...
echo.

echo Installing root dependencies...
call npm install
echo.

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..
echo.

echo Starting the database MCP server...
start cmd /k "node C:/Users/Mik/Documents/Cline/MCP/database-mcp-server/build/index.js"
echo.

echo Starting the application...
echo.
call npm run dev
