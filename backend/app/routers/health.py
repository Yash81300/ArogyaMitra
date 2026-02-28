# ─── Health Assessment Router ──────────────────────────────────────────────
# Handles submission and retrieval of health questionnaire data, and routes
# assessment answers to the AI agent for analysis.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.health import HealthAssessment
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Request Schemas ───────────────────────────────────────────────────────

class HealthAssessmentCreate(BaseModel):
    medical_history: Optional[list] = []
    allergies: Optional[list] = []
    injuries: Optional[list] = []
    medications: Optional[list] = []
    health_conditions: Optional[list] = []
    fitness_goals: Optional[list] = []
    answers: Optional[Dict[str, Any]] = {}  # Raw questionnaire answers
    bmi: Optional[str] = None


# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/assessment/submit")
def submit_assessment(
    data: HealthAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist a completed health questionnaire to the database."""
    assessment = HealthAssessment(
        user_id=current_user.id,
        medical_history=data.medical_history,
        allergies=data.allergies,
        injuries=data.injuries,
        medications=data.medications,
        health_conditions=data.health_conditions,
        fitness_goals=data.fitness_goals,
        bmi=data.bmi
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return {"id": assessment.id, "message": "✅ Health assessment completed successfully!"}


@router.post("/analysis/analyze")
def analyze_health(
    data: HealthAssessmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Send questionnaire data to the AI agent and return a health analysis."""
    health_data = data.dict()
    analysis = ai_agent.analyze_health(health_data, current_user)
    return {"analysis": analysis}


@router.get("/assessment/latest")
def get_latest_assessment(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the user's most recent health assessment."""
    assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()
    if not assessment:
        return {"message": "No health assessment found"}
    return {
        "id": assessment.id,
        "medical_history": assessment.medical_history,
        "allergies": assessment.allergies,
        "injuries": assessment.injuries,
        "bmi": assessment.bmi,
        "ai_analysis": assessment.ai_analysis,
        "created_at": str(assessment.created_at)
    }
