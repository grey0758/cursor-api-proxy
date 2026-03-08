@echo off
echo ========================================
echo Starting Cursor-To-OpenAI Server
echo ========================================
echo.

cd /d %~dp0

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting server on http://localhost:3010
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node src/app.js

pause
