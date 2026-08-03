@echo off
REM Shadow Runner - Premium Launcher
REM Professional launcher with detailed status reporting

setlocal enabledelayedexpansion
color 0A

cls
echo.
echo.
echo                    ╔══════════════════════════════════════════════════════════════╗
echo                    ║                                                              ║
echo                    ║            █▀  █▀█ █   █    █▀▄ █▀█ █ █ █▀▄ █   █▀▄ █▀▄ █▀▀  ║
echo                    ║            █   █ █ █   █    █▀▄ █ █ █ █ █ █ █   █▀▄ █   █▀▀  ║
echo                    ║            ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀      ║
echo                    ║                                                              ║
echo                    ║               Professional Game Platform Launcher            ║
echo                    ║                    Version 1.0 - Production Ready            ║
echo                    ║                                                              ║
echo                    ╚══════════════════════════════════════════════════════════════╝
echo.
echo.

REM Get the current directory (project root)
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

REM Initialize counters
set CHECK_COUNT=0
set PASS_COUNT=0

REM Helper function to display status
setlocal enabledelayedexpansion

echo                    ╔══════════════════════════════════════════════════════════════╗
echo                    ║              SYSTEM REQUIREMENTS CHECK                       ║
echo                    ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check Java
set /a CHECK_COUNT+=1
echo                    [%CHECK_COUNT%/4] Checking Java Installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo                         [ERROR] Java not found!
    echo.
    echo                    ACTION REQUIRED:
    echo                    1. Install Java 21 JDK from:
    echo                       https://www.oracle.com/java/technologies/downloads/
    echo                    2. Restart your computer after installation
    echo                    3. Run this launcher again
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('java -version 2^>^&1') do set JAVA_VERSION=%%i
echo                         [OK] Java found: !JAVA_VERSION!
set /a PASS_COUNT+=1
echo.

REM Check Node/npm
set /a CHECK_COUNT+=1
echo                    [%CHECK_COUNT%/4] Checking Node.js/npm Installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo                         [ERROR] npm not found!
    echo.
    echo                    ACTION REQUIRED:
    echo                    1. Install Node.js from:
    echo                       https://nodejs.org (LTS recommended)
    echo                    2. Restart your computer after installation
    echo                    3. Run this launcher again
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo                         [OK] npm found: v!NPM_VERSION!
set /a PASS_COUNT+=1
echo.

REM Check Backend JAR
set /a CHECK_COUNT+=1
echo                    [%CHECK_COUNT%/4] Checking Backend Build...
if not exist "backend\target\shadow-runner-1.0.0.jar" (
    echo                         [ERROR] Backend JAR not found!
    echo.
    echo                    ACTION REQUIRED:
    echo                    1. Run this command in Command Prompt:
    echo                       cd backend
    echo                       mvn clean package
    echo                    2. Wait for build to complete
    echo                    3. Return to this launcher
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%A in ('dir "backend\target\shadow-runner-1.0.0.jar" /B') do (
    echo                         [OK] Backend JAR found: %%A
)
set /a PASS_COUNT+=1
echo.

REM Check Frontend Dependencies
set /a CHECK_COUNT+=1
echo                    [%CHECK_COUNT%/4] Checking Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo                         [INSTALLING] Dependencies not found, installing...
    echo.
    cd frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo                         [ERROR] Failed to install dependencies!
        echo.
        echo                    Try running manually:
        echo                    cd frontend
        echo                    npm install
        echo.
        pause
        exit /b 1
    )
    cd ..
    echo                         [OK] Dependencies installed
) else (
    echo                         [OK] Dependencies found
)
set /a PASS_COUNT+=1
echo.

echo                    ╔══════════════════════════════════════════════════════════════╗
echo                    ║             ALL CHECKS PASSED (%PASS_COUNT%/%CHECK_COUNT%)                        ║
echo                    ║                 Starting Servers...                          ║
echo                    ╚══════════════════════════════════════════════════════════════╝
echo.

REM Start Backend in a new window
echo                    [1/3] Starting Backend Server on port 8081...
start "Shadow Runner - Backend (Port 8081)" cmd /k "cd /d %PROJECT_ROOT%backend && echo. && echo Starting Backend Server... && echo. && java -jar target\shadow-runner-1.0.0.jar && pause"

REM Wait for backend to initialize
timeout /t 5 /nobreak >nul

REM Start Frontend in a new window
echo                    [2/3] Starting Frontend Server on port 8080...
start "Shadow Runner - Frontend (Port 8080)" cmd /k "cd /d %PROJECT_ROOT%frontend && echo. && echo Starting Frontend Server... && echo. && npm run dev && pause"

REM Wait for frontend to initialize
timeout /t 5 /nobreak >nul

echo                    [3/3] Opening Game in Browser...
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:8080

echo.
echo                    ╔══════════════════════════════════════════════════════════════╗
echo                    ║                    LAUNCH SUCCESSFUL!                        ║
echo                    ║                                                              ║
echo                    ║  🎮 Game:     http://localhost:8080                          ║
echo                    ║  🔌 Backend:  http://localhost:8081/api                      ║
echo                    ║  📡 WebSocket: ws://localhost:8081/api/ws/game               ║
echo                    ║                                                              ║
echo                    ║  ⚠️  DO NOT CLOSE THESE WINDOWS - Servers are running!       ║
echo                    ║                                                              ║
echo                    ║  To stop: Run STOP_SHADOW_RUNNER.bat or close both windows   ║
echo                    ║                                                              ║
echo                    ╚══════════════════════════════════════════════════════════════╝
echo.

timeout /t 3 /nobreak >nul
exit /b 0
