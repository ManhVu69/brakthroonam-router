@echo off
title Stop AI Router PRO
echo ===================================================
echo   Stopping AI Router PRO Gateway (Port 20129)...
echo ===================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R ":20129.*LISTENING"') do (
    echo Terminating Process PID: %%a
    taskkill /f /pid %%a 2>nul
)
echo.
echo AI Router PRO has been successfully stopped.
echo ===================================================
timeout /t 3 >nul
