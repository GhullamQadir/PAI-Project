@echo off
echo Starting AI Video Editor Project...

echo 1. Starting Backend...
cd backend
start cmd /k ".\.venv\Scripts\Activate.ps1 & uvicorn app.main:app --reload"

echo 2. Starting Frontend...
cd ../frontend
start cmd /k "npm run dev"

echo Both servers are starting in separate windows.
echo Frontend will be available at: http://localhost:5173/
echo Backend API will be available at: http://localhost:8000/
pause
