@echo off
title Brakthroonam Router PRO Gateway
setlocal enableextensions

:: Dam bao thu muc lam viec luon la thu muc chua script nay
cd /d "%~dp0"
pushd "%~dp0"

cls
echo =======================================================================
echo   BRAKTHROONAM ROUTER PRO GATEWAY v2.0
echo =======================================================================
echo   Dashboard : http://localhost:20129
echo   OpenAI API: http://localhost:20129/v1
echo   Che do    : Mo binh thuong (Cau hinh On-Demand theo nhu cau tren Web)
echo =======================================================================
echo.

:: Khoi dong Router bang duong dan tuyet doi, tranh bi anh huong boi System32
node "%~dp0bin\cli.js"

if %errorlevel% neq 0 (
    echo.
    echo [CANH BAO] Router da dung hoat dong (Ma loi: %errorlevel%).
    echo.
    pause
)
