#!/bin/bash
echo "🏋️ Setting up ArogyaMitra - AI Fitness Platform"
echo "================================================"

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy .env if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Created .env from template. Please add your API keys!"
fi

echo "✅ Backend setup complete!"

# Frontend setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend
npm install
echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && source venv/bin/activate && python main.py"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "📌 Backend API: http://localhost:8000"
echo "📌 Frontend:    http://localhost:3001"
echo "📌 API Docs:    http://localhost:8000/docs"
