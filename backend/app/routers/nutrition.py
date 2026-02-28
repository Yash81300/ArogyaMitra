# ─── Nutrition Router ──────────────────────────────────────────────────────
# Handles AI nutrition plan generation, retrieval, and meal completion
# tracking with streak-point gamification.
#
# Streak point rules:
#   • +2 pts per meal completed — awarded once per meal per plan.
#     Unchecking and re-checking a meal never re-awards points.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models.user import User
from app.models.nutrition import NutritionPlan
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Request Schemas ───────────────────────────────────────────────────────

class NutritionGenerateRequest(BaseModel):
    days: int = 7
    allergies: Optional[List[str]] = []

class CompleteMealRequest(BaseModel):
    meal_key: str  # Format: "day|meal_type|meal_name" — unique per meal per plan


# ─── Helper ────────────────────────────────────────────────────────────────

def _build_plan_response(plan: NutritionPlan):
    """
    Merge completed_meals state into the plan_data and flatten meals so the
    frontend receives a single list with is_completed flags per meal.
    """
    data = plan.plan_data or {}
    completed = set(plan.completed_meals or [])

    meals = []
    for day_data in data.get("days", []):
        day = day_data.get("day", "")
        for meal in day_data.get("meals", []):
            key = f"{day}|{meal.get('meal_type','')}|{meal.get('name','')}"
            meals.append({
                **meal,
                "day": day,
                "meal_key": key,
                "is_completed": key in completed,
            })

    return {
        "id": plan.id,
        "title": plan.title,
        "daily_calories": data.get("daily_calories"),
        "protein_grams": (data.get("macros") or {}).get("protein"),
        "carbs_grams": (data.get("macros") or {}).get("carbs"),
        "fat_grams": (data.get("macros") or {}).get("fat"),
        "meals": meals,
        "grocery_list": plan.grocery_list or data.get("grocery_list", []),
        "completed_meals": list(completed),
    }


# ─── Plan Endpoints ────────────────────────────────────────────────────────

@router.post("/generate")
def generate_nutrition(
    request: NutritionGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new AI nutrition plan and deactivate any existing active plan."""
    plan_data = ai_agent.generate_nutrition_plan(current_user, request.days, request.allergies or [])
    db.query(NutritionPlan).filter(NutritionPlan.user_id == current_user.id).update({"is_active": False})
    nutrition_plan = NutritionPlan(
        user_id=current_user.id,
        title=plan_data.get("title", "My Nutrition Plan"),
        calories_target=plan_data.get("daily_calories", 2000),
        plan_data=plan_data,
        grocery_list=plan_data.get("grocery_list", []),
        completed_meals=[],
        awarded_meals=[],
        is_active=True
    )
    db.add(nutrition_plan)
    db.commit()
    db.refresh(nutrition_plan)
    return _build_plan_response(nutrition_plan)


@router.get("/current")
def get_current_nutrition(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the user's currently active nutrition plan."""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()
    if not plan:
        return {"message": "No active nutrition plan. Please generate one!"}
    return _build_plan_response(plan)


# ─── Completion Tracking Endpoint ──────────────────────────────────────────

@router.post("/complete-meal")
def complete_meal(
    data: CompleteMealRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle a meal's completed state. Awards +2 streak points the first time
    a meal is completed. Re-completing after unchecking does not re-award.
    """
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active nutrition plan")

    completed = list(plan.completed_meals or [])
    awarded = list(plan.awarded_meals or [])
    is_completing = data.meal_key not in completed

    if is_completing:
        completed.append(data.meal_key)
        # Award points only on the very first completion
        if data.meal_key not in awarded:
            awarded.append(data.meal_key)
            old_donations = current_user.streak_points // 100
            current_user.streak_points += 2
            new_donations = current_user.streak_points // 100
            current_user.charity_donations += (new_donations - old_donations)
    else:
        completed.remove(data.meal_key)

    plan.completed_meals = completed
    plan.awarded_meals = awarded
    db.commit()

    return {
        "meal_key": data.meal_key,
        "is_completed": is_completing,
        "streak_points": current_user.streak_points,
    }


# ─── Discovery Endpoints ───────────────────────────────────────────────────

@router.get("/recipes")
def get_recipes(meal_type: str = "main course", current_user: User = Depends(get_current_user)):
    """Fetch recipes from Spoonacular matching the user's diet preference."""
    recipes = ai_agent.get_spoonacular_recipes(current_user.diet_preference or "vegetarian", 500, meal_type)
    return {"recipes": recipes}


@router.get("/videos/{meal_name}")
def get_meal_videos(meal_name: str, current_user: User = Depends(get_current_user)):
    """Fetch YouTube cooking tutorial videos for a given meal name."""
    videos = ai_agent.get_youtube_recipe_videos(meal_name)
    return {"videos": videos}
