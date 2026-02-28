# ─── Progress Router ───────────────────────────────────────────────────────
# Handles manual progress logging and stats aggregation.
#
# Streak point rules for manual logs:
#   • +5 pts for logging calories burned — once per calendar day.
#     Multiple manual logs on the same day only award points on the first.
#   • Calories are capped at 2 000 per manual entry to prevent farming.
#
# Auto-logged entries (from the complete-exercise endpoint) are written
# directly to ProgressRecord with workout_completed set, so the stats
# endpoint can separate them from manual entries.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.progress import ProgressRecord
from app.routers.auth import get_current_user

router = APIRouter()


# ─── Request Schemas ───────────────────────────────────────────────────────

class ProgressCreate(BaseModel):
    weight: Optional[float] = None              # kg
    body_fat_percent: Optional[float] = None    # %
    muscle_mass: Optional[float] = None         # kg
    waist_circumference: Optional[float] = None # cm
    calories_burned: Optional[int] = None
    workout_completed: Optional[str] = None
    notes: Optional[str] = None

    @validator("weight")
    def weight_positive(cls, v):
        if v is not None and (v <= 0 or v > 500):
            raise ValueError("Weight must be between 0 and 500 kg")
        return v

    @validator("calories_burned")
    def calories_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Calories burned cannot be negative")
        return v

    @validator("body_fat_percent")
    def body_fat_bounds(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Body fat percent must be between 0 and 100")
        return v


# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/log")
def log_progress(
    data: ProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a manual progress entry. If calories_burned is provided, award +5
    streak points — but only once per calendar day per user.
    """
    # Cap calories to a realistic max to prevent streak farming
    MAX_MANUAL_CALORIES = 2000
    if data.calories_burned and data.calories_burned > MAX_MANUAL_CALORIES:
        data.calories_burned = MAX_MANUAL_CALORIES

    record = ProgressRecord(user_id=current_user.id, **data.dict())
    db.add(record)

    if data.calories_burned:
        from datetime import date
        today = date.today()
        # Check whether the user has already received points today from a manual log
        already_logged_today = db.query(ProgressRecord).filter(
            ProgressRecord.user_id == current_user.id,
            ProgressRecord.workout_completed == None,
            ProgressRecord.calories_burned > 0,
            ProgressRecord.date >= str(today)
        ).first()
        if not already_logged_today:
            old_donations = current_user.streak_points // 100
            current_user.streak_points += 5
            new_donations = current_user.streak_points // 100
            current_user.charity_donations += (new_donations - old_donations)

    db.commit()
    db.refresh(record)
    return {"id": record.id, "message": "Progress logged!", "streak_points": current_user.streak_points}


@router.get("/history")
def get_progress_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return the most recent progress records (default: last 30)."""
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).order_by(ProgressRecord.date.desc()).limit(limit).all()
    return [{
        "id": r.id, "date": str(r.date), "weight": r.weight,
        "body_fat_percent": r.body_fat_percent, "calories_burned": r.calories_burned,
        "workout_completed": r.workout_completed, "notes": r.notes
    } for r in records]


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Aggregate stats for the dashboard.
    - total_workouts   : authoritative count from user.total_workouts (incremented
                         once per exercise in the complete-exercise endpoint).
    - calories_burned  : sum of exercise logs + sum of manual logs.
    """
    records = db.query(ProgressRecord).filter(ProgressRecord.user_id == current_user.id).all()

    exercise_calories = sum(r.calories_burned or 0 for r in records if r.workout_completed)
    manual_calories = sum(r.calories_burned or 0 for r in records if not r.workout_completed)
    total_calories = exercise_calories + manual_calories

    return {
        "total_workouts": current_user.total_workouts,
        "total_calories_burned": total_calories,
        "streak_points": current_user.streak_points,
        "charity_donations": current_user.charity_donations,
        "records_count": len(records)
    }
