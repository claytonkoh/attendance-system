@echo off
echo ===================================================
echo   ATTENDANCE SYSTEM - LOCAL SIMULATION DEPLOYMENT
echo ===================================================
echo.

echo [1/3] Building Frontend for Production...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Setting up Backend...
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [3/3] STARTING PRODUCTION SIMULATION
echo.
echo    - Frontend will be served statically.
echo    - Backend will run in production mode.
echo.
echo    NOTE: Since we don't have Nginx locally, we will run the backend
echo          and you can point your browser to the backend docs or frontend.
echo.
echo    ACTUALLY: Locally running a production build of React is hard without a server.
echo    We will use 'serve' to host the frontend build.
echo.

start cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo Backend started on port 8000...

echo Starting Frontend on port 3000...
cd frontend
call npx -y serve -s dist -l 3000

pause
