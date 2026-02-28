# ─── AI Coach Router ───────────────────────────────────────────────────────
# Exposes the AROMI AI chat interface and dynamic plan adjustment endpoint.
#
# Chat history is stored in ChatSession.messages (capped at 50 messages) so
# AROMI retains context across page refreshes without needing a separate
# session store.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
import datetime

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Request Schemas ───────────────────────────────────────────────────────

class ArogyaCoachMessage(BaseModel):
    message: str
    # Context hint that lets AROMI adapt its advice
    # (e.g. "traveling", "recovering", "low_energy")
    user_status: Optional[str] = "normal"
    workout_plan: Optional[dict] = None
    nutrition_plan: Optional[dict] = None

class DynamicPlanAdjustmentRequest(BaseModel):
    reason: str        # "travel" | "time_constraint" | "health_issue" | etc.
    duration_days: int
    current_plan: dict
    user_data: dict


# ─── Chat Endpoints ────────────────────────────────────────────────────────

@router.post("/aromi-chat")
async def aromi_chat(
    request: ArogyaCoachMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to AROMI and receive an AI response.
    Creates a chat session for the user if one doesn't exist yet.
    History is trimmed to the last 50 messages to keep context manageable.
    """
    # Get or create the user's chat session
    session = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).first()

    if not session:
        session = ChatSession(user_id=current_user.id, messages=[], context={})
        db.add(session)
        db.commit()
        db.refresh(session)

    history = session.messages or []

    response = ai_agent.chat_with_aromi(
        message=request.message,
        user=current_user,
        history=history,
        context={"user_status": request.user_status}
    )

    # Append new messages to history
    timestamp = str(datetime.datetime.now())
    history.append({"role": "user",      "content": request.message, "timestamp": timestamp})
    history.append({"role": "assistant", "content": response,        "timestamp": timestamp})

    # Keep last 50 messages to bound storage and token usage
    session.messages = history[-50:]
    db.commit()

    return {"response": response, "session_id": session.id}


@router.post("/adjust-plan")
def adjust_plan(
    request: DynamicPlanAdjustmentRequest,
    current_user: User = Depends(get_current_user)
):
    """Ask the AI agent to modify an existing plan based on a reason (e.g. travel)."""
    adjusted = ai_agent.adjust_plan_dynamically(request.reason, request.current_plan, current_user)
    return {"adjusted_plan": adjusted}


# ─── History Endpoints ─────────────────────────────────────────────────────

@router.get("/chat-history")
def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the stored AROMI conversation history for the current user."""
    session = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).first()
    if not session:
        return {"messages": []}
    return {"messages": session.messages or []}


@router.delete("/chat-history")
def clear_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear the user's AROMI conversation history."""
    session = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).first()
    if session:
        session.messages = []
        db.commit()
    return {"message": "Chat history cleared"}
