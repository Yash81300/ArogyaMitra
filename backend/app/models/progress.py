# ─── Progress Model ────────────────────────────────────────────────────────
# Records a single progress snapshot for a user on a given date.
# Rows are created by two paths:
#   1. Manual log   — user submits a progress form (workout_completed is None)
#   2. Auto log     — complete-exercise endpoint appends a row automatically

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())

    # ── Body Metrics ───────────────────────────────────────────────────────
    weight = Column(Float)              # kg
    body_fat_percent = Column(Float)    # %
    muscle_mass = Column(Float)         # kg
    waist_circumference = Column(Float) # cm

    # ── Activity Data ──────────────────────────────────────────────────────
    calories_burned = Column(Integer)
    workout_completed = Column(String)  # Set to exercise name when auto-logged;
                                        # None for manual progress entries.

    # ── Free-form Notes ────────────────────────────────────────────────────
    notes = Column(String)
    metrics = Column(JSON)  # Reserved for future custom metric extensions

    user = relationship("User", back_populates="progress_records")
