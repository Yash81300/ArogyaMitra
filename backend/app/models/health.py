# ─── Health Assessment Model ───────────────────────────────────────────────
# Stores a user's completed health questionnaire and the AI's analysis of it.
# Multiple assessments can exist per user; the latest one is used for context.

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class HealthAssessment(Base):
    __tablename__ = "health_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ── Health Questionnaire Answers ───────────────────────────────────────
    medical_history = Column(JSON)      # List of past conditions/surgeries
    allergies = Column(JSON)            # Food or medication allergies
    injuries = Column(JSON)             # Current or past injuries
    medications = Column(JSON)          # Current medications
    health_conditions = Column(JSON)    # Chronic conditions (e.g. diabetes)
    fitness_goals = Column(JSON)        # User-selected goals from the form

    # ── AI Analysis ────────────────────────────────────────────────────────
    ai_analysis = Column(String)        # Free-text analysis from the AI agent
    bmi = Column(String)                # Calculated BMI category string

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="health_assessments")
