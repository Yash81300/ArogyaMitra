# ─── Workouts Router ───────────────────────────────────────────────────────
# Handles AI workout plan generation, retrieval, and exercise completion
# tracking with streak-point gamification.
#
# Streak point rules (enforced server-side to prevent farming):
#   • +10 pts per exercise completed — awarded once per exercise per plan.
#     Unchecking and re-checking an exercise never re-awards points.
#   • Every 100 pts → +1 charity donation milestone.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.models.progress import ProgressRecord
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Request Schemas ───────────────────────────────────────────────────────

class WorkoutGenerateRequest(BaseModel):
    days: int = 7
    force_regenerate: bool = False

class CompletedExercisesUpdate(BaseModel):
    completed_exercises: dict  # {exercise_key: bool}

class CompleteExerciseRequest(BaseModel):
    exercise_key: str       # Unique key identifying this exercise in the plan
    exercise_name: str
    calories_burned: int = 0


# ─── Plan Endpoints ────────────────────────────────────────────────────────

@router.post("/generate")
def generate_workout(
    request: WorkoutGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new AI workout plan and deactivate any existing active plan."""
    plan_data = ai_agent.generate_workout_plan(current_user, request.days)
    db.query(WorkoutPlan).filter(WorkoutPlan.user_id == current_user.id).update({"is_active": False})
    workout_plan = WorkoutPlan(
        user_id=current_user.id,
        title=plan_data.get("title", "My Workout Plan"),
        duration_weeks=1,
        plan_data=plan_data,
        is_active=True
    )
    db.add(workout_plan)
    db.commit()
    db.refresh(workout_plan)
    return {"id": workout_plan.id, "plan": plan_data}


@router.get("/current")
def get_current_workout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the user's currently active workout plan."""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()
    if not plan:
        return {"message": "No active workout plan. Please generate one!"}
    return {"id": plan.id, "plan": plan.plan_data}


@router.get("/history")
def get_workout_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the 10 most recent workout plans for the user."""
    plans = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id
    ).order_by(WorkoutPlan.created_at.desc()).limit(10).all()
    return [{"id": p.id, "title": p.title, "created_at": str(p.created_at), "is_active": p.is_active} for p in plans]


@router.get("/videos/{exercise_name}")
def get_exercise_videos(exercise_name: str, current_user: User = Depends(get_current_user)):
    """Fetch YouTube tutorial videos for a given exercise name."""
    videos = ai_agent.get_youtube_exercise_videos(exercise_name)
    return {"videos": videos}


# ─── Completion Tracking Endpoints ─────────────────────────────────────────

@router.get("/completed")
def get_completed_exercises(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the checkbox state (completed_exercises dict) for the active plan."""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()
    if not plan:
        return {"completed_exercises": {}}
    return {"completed_exercises": plan.completed_exercises or {}}


@router.put("/completed")
def save_completed_exercises(
    data: CompletedExercisesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist checkbox UI state only — no points are awarded here."""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan")
    plan.completed_exercises = data.completed_exercises
    db.commit()
    return {"completed_exercises": plan.completed_exercises}


@router.post("/complete-exercise")
def complete_exercise(
    data: CompleteExerciseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Award +10 streak points and log calories for a completed exercise.
    Points are awarded only once per exercise per plan — toggling the checkbox
    off and on again will not re-award points (idempotent after first award).
    """
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan")

    awarded = list(plan.awarded_exercises or [])

    # Already awarded — return current state without any changes
    if data.exercise_key in awarded:
        return {
            "calories_burned": data.calories_burned,
            "already_counted": True,
            "total_workouts": current_user.total_workouts,
            "streak_points": current_user.streak_points,
        }

    # First completion — award points once and mark as awarded
    awarded.append(data.exercise_key)
    plan.awarded_exercises = awarded

    record = ProgressRecord(
        user_id=current_user.id,
        calories_burned=data.calories_burned,
        workout_completed=data.exercise_name,
    )
    db.add(record)

    current_user.total_workouts += 1
    old_donations = current_user.streak_points // 100
    current_user.streak_points += 10
    new_donations = current_user.streak_points // 100
    current_user.charity_donations += (new_donations - old_donations)

    db.commit()

    return {
        "calories_burned": data.calories_burned,
        "already_counted": False,
        "total_workouts": current_user.total_workouts,
        "streak_points": current_user.streak_points,
    }
