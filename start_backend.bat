@echo off
echo Installing and verifying dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install dependencies. Please check your Python environment.
    pause
    exit /b %errorlevel%
)

echo Starting backend server...
uvicorn app.main:app --reload
