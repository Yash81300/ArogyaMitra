# ─── User Model ────────────────────────────────────────────────────────────
# Defines the `users` table and the enums used for profile preferences.
# Relationships are declared here so SQLAlchemy can cascade deletes properly.

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ─── Enums ─────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class FitnessGoal(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_GAIN = "weight_gain"
    MUSCLE_GAIN = "muscle_gain"
    MAINTENANCE = "maintenance"
    ENDURANCE = "endurance"

class WorkoutPreference(str, enum.Enum):
    HOME = "home"
    GYM = "gym"
    OUTDOOR = "outdoor"
    HYBRID = "hybrid"

class DietPreference(str, enum.Enum):
    VEGETARIAN = "vegetarian"
    NON_VEGETARIAN = "non_vegetarian"
    VEGAN = "vegan"
    KETO = "keto"
    PALEO = "paleo"


# ─── User Table ────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    # ── Identity ───────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)

    # ── Physical Profile ───────────────────────────────────────────────────
    age = Column(Integer)
    gender = Column(String)
    height = Column(Float)   # cm
    weight = Column(Float)   # kg

    # ── Fitness Preferences ────────────────────────────────────────────────
    fitness_level = Column(String, default="beginner")
    fitness_goal = Column(String, default=FitnessGoal.MAINTENANCE)
    workout_preference = Column(String, default=WorkoutPreference.HOME)
    diet_preference = Column(String, default=DietPreference.VEGETARIAN)

    # ── Account Metadata ───────────────────────────────────────────────────
    role = Column(String, default=UserRole.USER)
    is_active = Column(Boolean, default=True)

    # ── Gamification ───────────────────────────────────────────────────────
    streak_points = Column(Integer, default=0)
    total_workouts = Column(Integer, default=0)
    charity_donations = Column(Integer, default=0)  # Increments every 100 streak pts

    # ── Optional Profile Fields ────────────────────────────────────────────
    phone = Column(String)
    bio = Column(String)
    profile_photo_url = Column(String)

    # ── Google Calendar Integration ────────────────────────────────────────
    google_calendar_token = Column(String)  # Stored as JSON string

    # ── Timestamps ─────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────────────────────────────
    workouts = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    nutrition_plans = relationship("NutritionPlan", back_populates="user", cascade="all, delete-orphan")
    progress_records = relationship("ProgressRecord", back_populates="user", cascade="all, delete-orphan")
    health_assessments = relationship("HealthAssessment", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
