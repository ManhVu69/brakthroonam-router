@echo off
title Brakthroonam Router - Go bo Antigravity MITM
cd /d "%~dp0.."

net session >nul 2>&1
if %errorlevel% equ 0 goto :is_admin

echo [!] Requesting Administrator privileges (UAC)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = 'cmd.exe'; $psi.Arguments = '/c call \"\"%~f0\"\"'; $psi.Verb = 'runas'; $psi.UseShellExecute = $true; [System.Diagnostics.Process]::Start($psi) | Out-Null"
exit /b

:is_admin
node bin/uninstall-mitm.js

echo.
echo =======================================================================
echo  Hoan tat! Cua so se tu dong dong trong 2 giay...
echo =======================================================================
timeout /t 2 >nul
exit /b 0
