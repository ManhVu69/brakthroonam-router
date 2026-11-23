@echo off
title Brakthroonam Router - Antigravity MITM Setup (1-Click)
cd /d "%~dp0.."

net session >nul 2>&1
if %errorlevel% equ 0 goto :is_admin

echo [!] Requesting Administrator privileges (UAC)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c call \"\"%~f0\"\"' -Verb RunAs"
exit /b

:is_admin
echo =======================================================================
echo  [OK] Da xac nhan quyen Administrator! Dang cau hinh he thong...
echo =======================================================================
node bin/setup-mitm.js

echo.
echo =======================================================================
echo  Hoan tat! Cua so se tu dong dong trong 2 giay...
echo =======================================================================
timeout /t 2 >nul
exit /b 0
