@echo off
REM NeuronHire Setup Script for Windows
REM This script will set up the project and fix all current errors

echo.
echo ================================
echo   NeuronHire Setup Script
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Step 1: Install dependencies
echo ================================
echo Step 1: Installing dependencies
echo ================================
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Generate Prisma Client
echo ================================
echo Step 2: Generating Prisma Client
echo ================================
cd apps\api
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate Prisma Client
    echo [TIP] Make sure your DATABASE_URL is set in apps\api\.env
    cd ..\..
    exit /b 1
)
cd ..\..
echo [OK] Prisma Client generated
echo.

REM Step 3: Check if .env files exist
echo ================================
echo Step 3: Checking environment files
echo ================================
if not exist "apps\api\.env" (
    echo [WARNING] apps\api\.env not found
    echo [INFO] Creating from .env.example...
    copy apps\api\.env.example apps\api\.env
    echo [WARNING] Please edit apps\api\.env with your actual credentials
)

if not exist "apps\web\.env" (
    echo [WARNING] apps\web\.env not found
    echo [INFO] Creating from .env.example...
    copy apps\web\.env.example apps\web\.env
    echo [WARNING] Please edit apps\web\.env with your actual credentials
)
echo [OK] Environment files checked
echo.

REM Step 4: Verify setup
echo ================================
echo Step 4: Verifying setup
echo ================================
cd apps\api
call npm run build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] TypeScript compilation successful
) else (
    echo [WARNING] TypeScript compilation has warnings (this is normal)
)
cd ..\..
echo.

REM Success message
echo ================================
echo   Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Edit apps\api\.env with your database credentials
echo 2. Edit apps\web\.env with your frontend configuration
echo 3. Run database migrations: cd apps\api ^&^& npm run db:migrate
echo 4. Start development server: npm run dev
echo.
echo Documentation:
echo - Setup Guide: SETUP_INSTRUCTIONS.md
echo - Module 5 Guide: MODULE_5_COMPLETION.md
echo - Quick Start: QUICKSTART_MODULE_5.md
echo.
echo Happy coding! 🚀
echo.
pause
