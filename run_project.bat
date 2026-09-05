@echo off
setlocal
echo ======================================================================
echo           MedLens - AI-Powered Clinical Information Intelligence
echo                   PromptWars x AIMERverse Edition
echo ======================================================================
echo.

set ROOT_DIR=%~dp0

echo [1/2] Starting MedLens Backend (FastAPI + Deterministic Engine)...
start "MedLens Backend" cmd /k "cd /d "%ROOT_DIR%backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [2/2] Starting MedLens Frontend (React + Vite)...
start "MedLens Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ======================================================================
echo MedLens is now running!
echo.
echo   Command Center:    http://localhost:3000/dashboard
echo   MedLens Studio:    http://localhost:3000/medlens
echo   Review Center:     http://localhost:3000/review
echo   Biomarker Trends:  http://localhost:3000/trends
echo   Patient Dossiers:  http://localhost:3000/patients
echo   Data Inspector:    http://localhost:3000/database
echo   FastAPI Swagger:   http://127.0.0.1:8000/docs
echo.
echo Both windows will remain open. Press Ctrl+C in either window to stop.
echo ======================================================================
