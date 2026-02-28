# ─── Database Configuration ────────────────────────────────────────────────
# Sets up the SQLAlchemy engine, session factory, and base model class.
# All models must inherit from `Base` to be picked up by `create_tables()`.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.utils.config import settings

# ─── Engine ────────────────────────────────────────────────────────────────
# check_same_thread=False is required for SQLite when used with FastAPI's
# async request handling (multiple threads may share the same connection).
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# ─── Session Factory ───────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Declarative Base ──────────────────────────────────────────────────────
Base = declarative_base()


# ─── Dependency ────────────────────────────────────────────────────────────
def get_db():
    """FastAPI dependency that yields a DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Table Initialisation ──────────────────────────────────────────────────
def create_tables():
    """Import all models then create any missing tables in the database."""
    from app.models import user, workout, nutrition, progress, health, chat
    Base.metadata.create_all(bind=engine)
