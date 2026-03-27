@echo off
REM Setup Script Wrapper for Translation Office
REM This script will call the PowerShell setup script with appropriate permissions

echo.
echo ====================================================
echo  TRANSLATION OFFICE SETUP (Windows Wrapper)
echo ====================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] The setup script encountered an error.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Setup completed successfully!
pause
