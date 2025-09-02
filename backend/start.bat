@echo off
cd /d C:\Users\Lenovo\Desktop\TranscriptionSaaS\backend
set SECRET_KEY=your-super-secure-production-token-2024
uvicorn main:app --reload --port 8000
pause