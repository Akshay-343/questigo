@echo off
REM Start the Questigo backend (FastAPI via uvicorn) at http://localhost:8000
REM Activates the server's virtualenv, then runs uvicorn with auto-reload.
cd /d "%~dp0server"

if not exist ".venv\Scripts\activate.bat" (
    echo Error: virtualenv not found at server\.venv
    echo Create it with:  python -m venv .venv  and then  .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

call .venv\Scripts\activate.bat
echo Starting Questigo backend (FastAPI) on http://localhost:8000 ...
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
