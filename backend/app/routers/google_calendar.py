from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import json
import os
from datetime import datetime, timedelta

# Required for OAuth over plain HTTP on localhost
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.models.nutrition import NutritionPlan
from app.routers.auth import get_current_user
from app.utils.config import settings

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
FRONTEND_URL = "http://localhost:3001"


def _make_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CALENDAR_CLIENT_ID,
                "client_secret": settings.GOOGLE_CALENDAR_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_CALENDAR_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_CALENDAR_REDIRECT_URI,
    )


def _get_credentials(user: User) -> Credentials | None:
    if not user.google_calendar_token:
        return None
    try:
        data = json.loads(user.google_calendar_token)
        creds = Credentials(
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CALENDAR_CLIENT_ID,
            client_secret=settings.GOOGLE_CALENDAR_CLIENT_SECRET,
            scopes=SCOPES,
        )
        return creds
    except Exception:
        return None


def _save_credentials(user: User, creds: Credentials, db: Session):
    user.google_calendar_token = json.dumps({
        "token": creds.token,
        "refresh_token": creds.refresh_token,
    })
    db.commit()


def _get_calendar_service(user: User, db: Session):
    creds = _get_credentials(user)
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar not connected")
    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        _save_credentials(user, creds, db)
    return build("calendar", "v3", credentials=creds)


# ── OAuth endpoints ──────────────────────────────────────────────────────────

@router.get("/authorize")
def authorize(current_user: User = Depends(get_current_user)):
    """Returns the Google OAuth URL for the frontend to redirect to."""
    if not settings.GOOGLE_CALENDAR_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google Calendar not configured. Add GOOGLE_CALENDAR_CLIENT_ID to .env")
    flow = _make_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=current_user.username,  # use username as state to identify user on callback
    )
    return {"auth_url": auth_url}


@router.get("/callback")
def callback(code: str, state: str, db: Session = Depends(get_db)):
    """Google redirects here after user grants permission."""
    user = db.query(User).filter(User.username == state).first()
    if not user:
        print(f"Google Calendar callback: no user found for state={state}")
        return RedirectResponse(f"{FRONTEND_URL}/profile?calendar=error")
    try:
        flow = _make_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials
        _save_credentials(user, creds, db)
        print(f"Google Calendar connected for user: {user.username}")
        return RedirectResponse(f"{FRONTEND_URL}/profile?calendar=connected")
    except Exception as e:
        print(f"Google Calendar callback error for user {state}: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/profile?calendar=error")


@router.get("/status")
def get_status(current_user: User = Depends(get_current_user)):
    """Check if user has connected Google Calendar."""
    connected = bool(current_user.google_calendar_token)
    return {"connected": connected}


@router.delete("/disconnect")
def disconnect(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove stored Google Calendar token."""
    current_user.google_calendar_token = None
    db.commit()
    return {"message": "Google Calendar disconnected"}


# ── Calendar sync endpoints ──────────────────────────────────────────────────

@router.post("/sync-workout")
def sync_workout_to_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add all workout days from the active plan to Google Calendar."""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan found")

    service = _get_calendar_service(current_user, db)
    days = plan.plan_data.get("days", [])

    # Start scheduling from next Monday
    today = datetime.now().date()
    days_until_monday = (7 - today.weekday()) % 7 or 7
    start_date = today + timedelta(days=days_until_monday)

    created_events = []
    now_time = datetime.now().strftime("%H:%M:%S")  # current time when user pressed sync

    for i, day in enumerate(days):
        # Skip rest days
        if day.get("total_duration_minutes", 0) == 0:
            continue

        event_date = start_date + timedelta(days=i)
        exercises = day.get("exercises", [])
        exercise_list = "\n".join([
            f"• {ex['name']}: {ex.get('sets')} sets × {ex.get('reps')} reps"
            for ex in exercises[:8]
        ])

        event = {
            "summary": f"💪 {day.get('name', f'Day {i+1}')} — ArogyaMitra",
            "description": (
                f"🎯 Focus: {day.get('focus', '')}\n"
                f"⏱ Duration: {day.get('total_duration_minutes')} min\n"
                f"🔥 ~{day.get('total_calories')} calories\n\n"
                f"Exercises:\n{exercise_list}\n\n"
                f"Generated by ArogyaMitra AI"
            ),
            "start": {
                "dateTime": f"{event_date.isoformat()}T{now_time}",
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": f"{(event_date + timedelta(days=1)).isoformat()}T00:00:00",
                "timeZone": "Asia/Kolkata",
            },
            "colorId": "2",  # Green
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 30},
                ],
            },
        }

        result = service.events().insert(calendarId="primary", body=event).execute()
        created_events.append(result.get("htmlLink"))

    return {
        "message": f"✅ Synced {len(created_events)} workout days to Google Calendar",
        "events_created": len(created_events),
        "week_starting": start_date.isoformat(),
    }


@router.post("/sync-nutrition")
def sync_nutrition_to_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add meal reminders from the active nutrition plan to Google Calendar."""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(status_code=404, detail="No active nutrition plan found")

    service = _get_calendar_service(current_user, db)

    # Meal times
    MEAL_TIMES = {
        "breakfast": ("07:30", "08:00"),
        "lunch": ("12:30", "13:00"),
        "snack": ("16:00", "16:30"),
        "dinner": ("19:30", "20:00"),
    }

    MEAL_COLORS = {
        "breakfast": "5",   # Yellow
        "lunch": "6",       # Tangerine
        "snack": "2",       # Sage
        "dinner": "1",      # Lavender
    }

    today = datetime.now().date()
    days_until_monday = (7 - today.weekday()) % 7 or 7
    start_date = today + timedelta(days=days_until_monday)

    days_data = plan.plan_data.get("days", [])
    created_events = []

    for i, day_data in enumerate(days_data):
        event_date = start_date + timedelta(days=i)
        for meal in day_data.get("meals", []):
            meal_type = meal.get("meal_type", "meal").lower()
            times = MEAL_TIMES.get(meal_type, ("12:00", "12:30"))
            color = MEAL_COLORS.get(meal_type, "1")

            start_dt = f"{event_date.isoformat()}T{times[0]}:00"
            end_dt = f"{event_date.isoformat()}T{times[1]}:00"

            event = {
                "summary": f"🥗 {meal_type.capitalize()}: {meal.get('name', '')}",
                "description": (
                    f"{meal.get('description', '')}\n\n"
                    f"🔥 {meal.get('calories')} cal | "
                    f"P: {meal.get('protein')}g | "
                    f"C: {meal.get('carbs')}g | "
                    f"F: {meal.get('fat')}g\n"
                    f"⏱ Prep: {meal.get('prep_time', 'N/A')}\n\n"
                    f"Generated by ArogyaMitra AI"
                ),
                "start": {"dateTime": start_dt, "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": end_dt, "timeZone": "Asia/Kolkata"},
                "colorId": color,
                "reminders": {
                    "useDefault": False,
                    "overrides": [{"method": "popup", "minutes": 15}],
                },
            }
            result = service.events().insert(calendarId="primary", body=event).execute()
            created_events.append(result.get("htmlLink"))

    return {
        "message": f"✅ Synced {len(created_events)} meal reminders to Google Calendar",
        "events_created": len(created_events),
        "week_starting": start_date.isoformat(),
    }