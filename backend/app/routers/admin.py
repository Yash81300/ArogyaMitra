# ─── Admin Router ──────────────────────────────────────────────────────────
# Admin-only endpoints for platform management.
# All routes are protected by `require_admin` which verifies role == "admin".

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.models.nutrition import NutritionPlan
from app.routers.auth import get_current_user

router = APIRouter()


# ─── Guard ─────────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency that raises 403 if the authenticated user is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Return high-level platform statistics (user counts, plan counts)."""
    return {
        "total_users": db.query(User).count(),
        "active_users": db.query(User).filter(User.is_active == True).count(),
        "total_workout_plans": db.query(WorkoutPlan).count(),
        "total_nutrition_plans": db.query(NutritionPlan).count(),
    }


@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Return a list of all registered users."""
    from app.routers.auth import user_to_dict
    users = db.query(User).all()
    return [user_to_dict(u) for u in users]
