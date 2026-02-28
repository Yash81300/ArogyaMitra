# ─── Application Configuration ─────────────────────────────────────────────
# All settings are loaded from environment variables (or a .env file).
# Copy backend/.env.example → backend/.env and fill in your values before
# running the server. The app will refuse to start if SECRET_KEY is missing.

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./arogyamitra.db"

    # ── Security ───────────────────────────────────────────────────────────
    # No default — must be set in .env. A missing key raises a ValidationError
    # on startup, preventing the app from running with an empty secret.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── App Settings ───────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:3001"]'

    # ── AI Services ────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""       # Required for AI features
    OPENAI_API_KEY: str = ""     # Optional fallback
    GEMINI_API_KEY: str = ""     # Optional fallback

    # ── Google Services ────────────────────────────────────────────────────
    GOOGLE_CALENDAR_CLIENT_ID: str = ""
    GOOGLE_CALENDAR_CLIENT_SECRET: str = ""
    GOOGLE_CALENDAR_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    YOUTUBE_API_KEY: str = ""    # Optional — for exercise/recipe video search

    # ── Nutrition ──────────────────────────────────────────────────────────
    SPOONACULAR_API_KEY: str = ""  # Optional — for recipe browsing

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS JSON string into a Python list."""
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
