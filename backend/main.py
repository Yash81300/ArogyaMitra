# ─── ArogyaMitra Backend Entry Point ──────────────────────────────────────
# Initialises the FastAPI application, registers all routers, mounts the
# static file server, and creates database tables on startup.
#
# Run with:  python main.py   (or uvicorn main:app --reload)

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.utils.config import settings
from app.database import create_tables
from app.routers import auth, users, workouts, nutrition, progress, health, ai_coach, admin, google_calendar


# ─── App Instance ──────────────────────────────────────────────────────────

app = FastAPI(
    title="ArogyaMitra API",
    description="🏋️ AI-Powered Personal Fitness & Wellness Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ─── CORS Middleware ───────────────────────────────────────────────────────
# Allow requests from the Vite dev server (3001) and any origins listed in
# the CORS_ORIGINS environment variable.

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ───────────────────────────────────────────────────────────────

app.include_router(auth.router,             prefix="/api/auth",       tags=["Auth"])
app.include_router(users.router,            prefix="/api/users",      tags=["Users"])
app.include_router(workouts.router,         prefix="/api/workouts",   tags=["Workouts"])
app.include_router(nutrition.router,        prefix="/api/nutrition",  tags=["Nutrition"])
app.include_router(progress.router,         prefix="/api/progress",   tags=["Progress"])
app.include_router(health.router,           prefix="/api/health",     tags=["Health"])
app.include_router(ai_coach.router,         prefix="/api/ai-coach",   tags=["AI Coach"])
app.include_router(admin.router,            prefix="/api/admin",      tags=["Admin"])
app.include_router(google_calendar.router,  prefix="/api/calendar",   tags=["Google Calendar"])


# ─── Static Files ──────────────────────────────────────────────────────────
# Serve user-uploaded profile photos from /static/uploads/.
# The directory is created if it doesn't exist so the app starts cleanly on
# a fresh clone without requiring a pre-created folder.

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── Startup Event ─────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    create_tables()
    # Eagerly import the AI agent so any initialisation errors surface early.
    from app.services.ai_agent import ai_agent
    print("🚀 ArogyaMitra backend is running at http://localhost:8000")
    print("📖 API docs available at  http://localhost:8000/docs")


# ─── Health & Root Endpoints ───────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "🏋️ Welcome to ArogyaMitra API",
        "tagline": "Transforming Lives Through AI-Powered Fitness",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "app": "ArogyaMitra"}


# ─── Dev Server ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
