@echo off
echo Starting Backend Server...
start cmd /k "cd ""Development Team Workflows\backend"" && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Frontend Server...
start cmd /k "cd ""Development Team Workflows\frontend"" && npm run dev"

echo Done! The app is starting. You can access the UI at http://localhost:5173
pause
