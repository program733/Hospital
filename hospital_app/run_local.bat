@echo OFF

REM Start Backend
start "Backend" cmd /k "cd hospital_app/src/backend && python -m uvicorn main:app --reload"

REM Start Frontend
start "Frontend" cmd /k "cd hospital_app/src/frontend && npm start"