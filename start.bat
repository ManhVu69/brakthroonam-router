@echo off
title Brakthroonam Router PRO Gateway
chcp 65001 >nul
setlocal enableextensions

REM Dam bao luon chay tai thu muc goc cua du an
cd /d "%~dp0"
pushd "%~dp0"

REM 1. Kiem tra Node.js da duoc cai dat hay chua
where node >nul 2>nul
if %errorlevel% neq 0 (
    cls
    echo =======================================================================
    echo   [LOI] KHONG TIM THAY NODE.JS TRONG HE THONG!
    echo =======================================================================
    echo   Brakthroonam Router can Node.js [v18 tro len] de hoat dong.
    echo   Vui long cai dat Node.js tai https://nodejs.org/ va khoi dong lai.
    echo =======================================================================
    echo.
    pause
    exit /b 1
)

REM 2. Kiem tra xem Router co dang chay ngam tren cong 20129 hay khong
set EXISTING_PID=
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /R ":20129.*LISTENING"') do (
    set EXISTING_PID=%%a
)

if not defined EXISTING_PID goto :LAUNCH_SERVER

cls
echo =======================================================================
echo   BRAKTHROONAM ROUTER PRO GATEWAY v2.0
echo =======================================================================
echo   Trang thai: Router dang chay ngam tren cong 20129 [PID: %EXISTING_PID%]
echo   Dashboard : http://localhost:20129
echo   OpenAI API: http://localhost:20129/v1
echo =======================================================================
echo.
echo   [1] Mo Dashboard tren trinh duyet [Mac dinh - Nhan Enter]
echo   [2] Khoi dong lai [Dong tien trinh PID %EXISTING_PID% va chay lai]
echo   [3] Dong cua so nay
echo.
set /p CHOICE="Nhap lua chon cua ban [1-3, Nhan Enter de chon 1]: "
if "%CHOICE%"=="" set CHOICE=1
if "%CHOICE%"=="1" goto :ACTION_OPEN_DASHBOARD
if "%CHOICE%"=="2" goto :ACTION_RESTART
exit /b 0

:ACTION_OPEN_DASHBOARD
echo.
echo [*] Dang mo Dashboard tren trinh duyet...
start http://localhost:20129
timeout /t 2 >nul
exit /b 0

:ACTION_RESTART
echo.
echo [*] Dang tat tien trinh cu [PID %EXISTING_PID%]...
taskkill /f /pid %EXISTING_PID% >nul 2>nul
timeout /t 1 >nul
goto :LAUNCH_SERVER

:LAUNCH_SERVER
cls
echo =======================================================================
echo   BRAKTHROONAM ROUTER PRO GATEWAY v2.0
echo =======================================================================
echo   Dashboard : http://localhost:20129
echo   OpenAI API: http://localhost:20129/v1
echo   Che do    : Khoi dong truc tiep [Terminal giu nguyen de xem logs]
echo =======================================================================
echo.

REM Kiem tra cap nhat tu Git neu co
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git" (
        echo [*] Kiem tra cap nhat tu repository...
        git pull --quiet --ff-only >nul 2>nul
        if %errorlevel% equ 0 (
            echo [OK] He thong da o phien ban moi nhat.
        )
        echo.
    )
)

REM Khoi dong Router qua Node
node "%~dp0bin\cli.js"

if %errorlevel% neq 0 (
    echo.
    echo =======================================================================
    echo [CANH BAO] Router da dung hoat dong [Ma loi: %errorlevel%].
    echo =======================================================================
)

echo.
echo Cua so lenh duoc giu lai de xem thong tin. Nhan phim bat ky de thoat...
pause >nul
