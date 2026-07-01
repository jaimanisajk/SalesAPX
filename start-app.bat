@echo off
title ApexSDR - Sales Automation Platform
echo ===================================================
echo 🚀 Launching ApexSDR Monorepo Development Servers...
echo ===================================================
echo.

:: Configure Node and Git Path
set Path=C:\Users\Lenovo\node;C:\Users\Lenovo\git\cmd;%Path%

:: Boot development environment
npm run dev

pause
