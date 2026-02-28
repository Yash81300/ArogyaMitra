@echo off
echo Setting up ArogyaMitra - AI Fitness Platform

REM Backend
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

if not exist .env (
  copy .env.example .env
  echo Created .env - Please add your API keys!
)

REM Frontend
cd ..\frontend
npm install

echo.
echo Setup complete!
echo Backend:  cd backend ^& venv\Scripts\activate ^& python main.py
echo Frontend: cd frontend ^& npm run dev
echo API Docs: http://localhost:8000/docs
