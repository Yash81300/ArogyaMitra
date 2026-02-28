# ─── Users Router ──────────────────────────────────────────────────────────
# General user management endpoints (profile read, account deletion).
# Most profile mutations live in auth.py (/api/auth/me) — this router
# handles admin-level user listing and self-service account deletion.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user, user_to_dict

router = APIRouter()


@router.get("/")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all users. Admin access only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = db.query(User).all()
    return [user_to_dict(u) for u in users]


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return user_to_dict(current_user)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user account. Admins can delete any account;
    regular users can only delete their own.
    """
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
