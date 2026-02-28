# 🏋️ ArogyaMitra — AI-Powered Fitness Platform

> **Transforming Lives Through AI-Powered Fitness**  
> Created by Srinivas | Mission: Making personalised fitness accessible to everyone

---

## 🌟 Overview

ArogyaMitra is a full-stack AI fitness platform that delivers:

- 🤖 **AI Workout Plans** — Personalised 7-day routines via Groq LLaMA-3.3-70B
- 🥗 **Smart Nutrition** — Calorie-precise meal plans with Spoonacular integration
- 💪 **AROMI AI Coach** — Real-time chat-based wellness guidance
- 📊 **Progress Analytics** — Charts, BMI tracking, and streak gamification
- ❤️ **Health Assessment** — 12-question AI health analysis
- 📹 **Exercise Videos** — YouTube tutorial integration
- 📅 **Google Calendar Sync** — Add workouts and meal reminders to your calendar

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + SQLAlchemy + SQLite |
| AI Engine | Groq LLaMA-3.3-70B-Versatile |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand + React Query |
| Auth | JWT (python-jose) + bcrypt |
| Charts | Recharts |

---

## 🚀 Quick Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### One-Command Setup
```bash
# Linux/Mac
chmod +x SETUP.sh && ./SETUP.sh

# Windows
SETUP.bat
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your API keys
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 API Keys

| Key                   | Source                                   |
|-----------------------|------------------------------------------|
| `GROQ_API_KEY`        | https://console.groq.com/keys            |
| `YOUTUBE_API_KEY`     | https://console.cloud.google.com         |
| `SPOONACULAR_API_KEY` | https://spoonacular.com/food-api/console |
| `GOOGLE_CALENDAR_*`   | https://console.cloud.google.com         |

---

## 🌐 URLs After Starting

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## 📁 Project Structure

```
ArogyaMitra/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy DB models
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # AI agent & third-party API wrappers
│   │   └── utils/           # Config & settings
│   ├── main.py              # App entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── components/      # Reusable UI components
│   │   ├── stores/          # Zustand state management
│   │   └── services/        # Axios API service layer
│   └── package.json
├── SETUP.sh / SETUP.bat
└── .gitignore
```

---

## ✨ Features

### 🤖 AI Workout Generation
- Personalised 7-day plans based on fitness level, goal, and equipment
- Exercise details: sets, reps, rest time, muscle groups, how-to descriptions
- YouTube video tutorials per exercise
- Checkbox completion tracking with streak points

### 🥗 Smart Nutrition
- 7-day meal plans with calorie & macro breakdown
- Supports: vegetarian, vegan, keto, paleo, non-vegetarian
- Auto-generated grocery list
- Spoonacular recipe integration

### 💬 AROMI AI Coach
- Real-time floating chat assistant
- Handles: travel adjustments, injuries, low energy, motivation
- Persistent conversation history (last 50 messages)
- Quick-prompt buttons for common queries

### 📊 Progress Tracking
- Weight, BMI, body fat, calorie burn logging
- Recharts visualisations (line + bar charts)
- Streak points gamification
- Charity impact calculator (every 100 pts = 1 milestone)

### ❤️ Health Assessment
- 12-question health questionnaire
- AI-powered risk analysis
- Personalised fitness and diet recommendations

---

## 🔌 API Endpoints

```
# Auth
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login (OAuth2 form)
GET    /api/auth/me                    Get current user
PUT    /api/auth/me                    Update profile
POST   /api/auth/upload-photo          Upload profile photo
DELETE /api/auth/photo                 Remove profile photo

# Workouts
POST   /api/workouts/generate          Generate AI workout plan
GET    /api/workouts/current           Get active workout plan
GET    /api/workouts/history           Get plan history
POST   /api/workouts/complete-exercise Mark exercise done (+10 pts)
GET    /api/workouts/completed         Get checkbox state
PUT    /api/workouts/completed         Save checkbox state

# Nutrition
POST   /api/nutrition/generate         Generate AI nutrition plan
GET    /api/nutrition/current          Get active nutrition plan
POST   /api/nutrition/complete-meal    Toggle meal done (+2 pts)
GET    /api/nutrition/recipes          Browse Spoonacular recipes
GET    /api/nutrition/videos/{name}    Get recipe videos

# Progress
POST   /api/progress/log               Log a progress entry (+5 pts)
GET    /api/progress/history           Get progress history
GET    /api/progress/stats             Get aggregated stats

# Health
POST   /api/health/assessment/submit   Submit health questionnaire
POST   /api/health/analysis/analyze    Get AI health analysis
GET    /api/health/assessment/latest   Get latest assessment

# AI Coach
POST   /api/ai-coach/aromi-chat        Chat with AROMI
GET    /api/ai-coach/chat-history      Get chat history
DELETE /api/ai-coach/chat-history      Clear chat history

# Google Calendar
GET    /api/calendar/status            Check connection status
GET    /api/calendar/authorize         Get OAuth URL
DELETE /api/calendar/disconnect        Disconnect calendar
POST   /api/calendar/sync-workout      Sync workouts to calendar
POST   /api/calendar/sync-nutrition    Sync meal reminders to calendar

# Admin
GET    /api/admin/stats                Platform statistics
GET    /api/admin/users                List all users
```

---

## 🏆 Gamification

| Action                       | Points Awarded       | Notes                      |
|------------------------------|----------------------|----------------------------|
| Complete an exercise         | +10 pts              | Once per exercise per plan |
| Complete a meal              | +2 pts               | Once per meal per plan     |
| Log progress (with calories) | +5 pts               | Once per calendar day      |
| Every 100 streak pts         | +1 charity milestone | Cumulative                 |

---

*Built with ❤️ for a healthier India | ArogyaMitra v1.0*