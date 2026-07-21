@echo off
REM Start the Questigo frontend (Vite dev server) at http://localhost:5173
cd /d "%~dp0client"
echo Starting Questigo frontend (Vite) on http://localhost:5173 ...
call npm run dev -- --host
