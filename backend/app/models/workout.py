# ─── Workout Models ────────────────────────────────────────────────────────
# WorkoutPlan  — AI-generated weekly plan assigned to a user.
# Exercise     — Catalogue of individual exercises (not yet linked to plans).

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="My Workout Plan")
    duration_weeks = Column(Integer, default=1)

    # ── AI-Generated Content ───────────────────────────────────────────────
    plan_data = Column(JSON)  # Full plan object returned by the AI agent

    # ── Completion Tracking ────────────────────────────────────────────────
    # completed_exercises: {exercise_key: bool} — persists checkbox UI state
    completed_exercises = Column(JSON, default=dict)
    # awarded_exercises: [exercise_key] — keys that have already been awarded
    # streak points; checked before awarding to prevent double-counting.
    awarded_exercises = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="workouts")


class Exercise(Base):
    """Catalogue table for individual exercise definitions."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    muscle_group = Column(String)
    equipment = Column(String)
    difficulty = Column(String)

    # ── Performance Targets ────────────────────────────────────────────────
    sets = Column(Integer)
    reps = Column(Integer)
    duration_seconds = Column(Integer)
    calories_per_minute = Column(Float)

    # ── Media ──────────────────────────────────────────────────────────────
    youtube_url = Column(String)
    thumbnail_url = Column(String)
