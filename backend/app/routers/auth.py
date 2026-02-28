# ─── Auth Router ───────────────────────────────────────────────────────────
# Handles user registration, login, JWT token issuance and validation,
# profile photo uploads (via Cloudinary), and the Google Calendar OAuth callback proxy.
#
# All other routers import `get_current_user` from here to protect endpoints.

import cloudinary
import cloudinary.uploader
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, validator

from app.database import get_db
from app.models.user import User, FitnessGoal, WorkoutPreference, DietPreference
from app.utils.config import settings


# ─── Cloudinary Configuration ──────────────────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


# ─── Router & Security Utilities ───────────────────────────────────────────

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Pydantic Schemas ──────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None   # cm
    weight: Optional[float] = None   # kg
    fitness_level: Optional[str] = "beginner"
    fitness_goal: Optional[str] = FitnessGoal.MAINTENANCE
    workout_preference: Optional[str] = WorkoutPreference.HOME
    diet_preference: Optional[str] = DietPreference.VEGETARIAN

    @validator("password")
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("age")
    def age_bounds(cls, v):
        if v is not None and not (5 <= v <= 120):
            raise ValueError("Age must be between 5 and 120")
        return v

    @validator("height")
    def height_bounds(cls, v):
        if v is not None and not (50 <= v <= 300):
            raise ValueError("Height must be between 50 and 300 cm")
        return v

    @validator("weight")
    def weight_bounds(cls, v):
        if v is not None and not (10 <= v <= 500):
            raise ValueError("Weight must be between 10 and 500 kg")
        return v


class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    fitness_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    workout_preference: Optional[str] = None
    diet_preference: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

    @validator("age")
    def age_bounds(cls, v):
        if v is not None and not (5 <= v <= 120):
            raise ValueError("Age must be between 5 and 120")
        return v

    @validator("height")
    def height_bounds(cls, v):
        if v is not None and not (50 <= v <= 300):
            raise ValueError("Height must be between 50 and 300 cm")
        return v

    @validator("weight")
    def weight_bounds(cls, v):
        if v is not None and not (10 <= v <= 500):
            raise ValueError("Weight must be between 10 and 500 kg")
        return v


# ─── Helper Functions ──────────────────────────────────────────────────────

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Encode a JWT with an expiry. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """FastAPI dependency — decode JWT and return the authenticated User row."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def user_to_dict(user: User):
    """Serialise a User ORM object to a plain dict safe for JSON responses."""
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "age": user.age,
        "gender": user.gender,
        "height": user.height,
        "weight": user.weight,
        "fitness_level": user.fitness_level,
        "fitness_goal": user.fitness_goal,
        "workout_preference": user.workout_preference,
        "diet_preference": user.diet_preference,
        "role": user.role,
        "is_active": user.is_active,
        "streak_points": user.streak_points,
        "total_workouts": user.total_workouts,
        "charity_donations": user.charity_donations,
        "phone": user.phone,
        "bio": user.bio,
        "profile_photo_url": user.profile_photo_url,
        "created_at": str(user.created_at) if user.created_at else None,
    }


# ─── Auth Endpoints ────────────────────────────────────────────────────────

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        age=user_data.age,
        gender=user_data.gender,
        height=user_data.height,
        weight=user_data.weight,
        fitness_level=user_data.fitness_level,
        fitness_goal=user_data.fitness_goal,
        workout_preference=user_data.workout_preference,
        diet_preference=user_data.diet_preference,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": user_to_dict(user)}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Accepts username or email in the username field for flexibility."""
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": user_to_dict(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.put("/me")
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in update_data.dict(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return user_to_dict(current_user)


# ─── Profile Photo Endpoints ───────────────────────────────────────────────

@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or replace the current user's profile photo via Cloudinary."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {MAX_SIZE_MB}MB")

    # Delete old photo from Cloudinary if one exists
    if current_user.profile_photo_url and "cloudinary.com" in current_user.profile_photo_url:
        try:
            # Extract public_id from the URL (last part before extension)
            public_id = current_user.profile_photo_url.split("/")[-1].rsplit(".", 1)[0]
            cloudinary.uploader.destroy(f"arogyamitra/profiles/{public_id}")
        except Exception:
            pass  # Don't block upload if deletion fails

    # Upload new photo to Cloudinary
    try:
        result = cloudinary.uploader.upload(
            contents,
            folder="arogyamitra/profiles",
            public_id=f"user_{current_user.id}",
            overwrite=True,
            resource_type="image",
            transformation=[{"width": 400, "height": 400, "crop": "fill", "gravity": "face"}]
        )
        photo_url = result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

    current_user.profile_photo_url = photo_url
    db.commit()
    db.refresh(current_user)
    return user_to_dict(current_user)


@router.delete("/photo")
def delete_photo(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove the current user's profile photo from Cloudinary and the database."""
    if current_user.profile_photo_url:
        if "cloudinary.com" in current_user.profile_photo_url:
            try:
                public_id = f"arogyamitra/profiles/user_{current_user.id}"
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass  # Don't block deletion if Cloudinary call fails
        current_user.profile_photo_url = None
        db.commit()
    return user_to_dict(current_user)


# ─── Google Calendar OAuth Proxy ───────────────────────────────────────────

@router.get("/google/callback")
def google_callback_proxy(code: str = None, state: str = None, error: str = None, db: Session = Depends(get_db)):
    """
    Google redirects here after OAuth consent. Proxies to the calendar router's
    callback handler so both /api/auth/google/callback and /api/calendar/callback
    resolve correctly regardless of which redirect URI is registered.
    """
    from fastapi.responses import RedirectResponse
    from app.routers.google_calendar import callback as calendar_callback, FRONTEND_URL
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/profile?calendar=error")
    return calendar_callback(code=code, state=state, db=db)
