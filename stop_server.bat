@echo off
echo ========================================
echo Stopping Cursor-To-OpenAI Server
echo ========================================
echo.

taskkill /F /IM node.exe /FI "WINDOWTITLE eq*app.js*" 2>nul

if %errorlevel% equ 0 (
    echo Server stopped successfully!
) else (
    echo No running server found.
)

echo.
pause
