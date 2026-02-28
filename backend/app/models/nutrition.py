# ─── Nutrition Models ──────────────────────────────────────────────────────
# NutritionPlan — AI-generated meal plan assigned to a user.
# Meal          — Catalogue of individual meal definitions (not yet linked to plans).

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="My Nutrition Plan")

    # ── Daily Macro Targets ────────────────────────────────────────────────
    calories_target = Column(Integer)
    protein_target = Column(Float)   # grams
    carbs_target = Column(Float)     # grams
    fat_target = Column(Float)       # grams

    # ── AI-Generated Content ───────────────────────────────────────────────
    plan_data = Column(JSON)         # Full plan object returned by the AI agent
    grocery_list = Column(JSON)      # Flat list of ingredients across all meals

    # ── Completion Tracking ────────────────────────────────────────────────
    # completed_meals: ["day|meal_type|name", ...] — UI checkbox state
    completed_meals = Column(JSON, default=list)
    # awarded_meals: ["day|meal_type|name", ...] — meals that have already
    # been awarded streak points; prevents double-awarding on re-check.
    awarded_meals = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="nutrition_plans")


class Meal(Base):
    """Catalogue table for individual meal definitions."""
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)

    # ── Nutritional Info ───────────────────────────────────────────────────
    calories = Column(Integer)
    protein = Column(Float)   # grams
    carbs = Column(Float)     # grams
    fat = Column(Float)       # grams

    # ── Recipe Details ─────────────────────────────────────────────────────
    ingredients = Column(JSON)
    recipe_url = Column(String)
    image_url = Column(String)
    meal_type = Column(String)   # breakfast | lunch | dinner | snack
