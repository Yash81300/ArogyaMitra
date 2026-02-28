# ─── Chat Session Model ────────────────────────────────────────────────────
# Stores the full conversation history between a user and AROMI AI Coach.
# One session per user; messages are appended and capped at the last 50 to
# control token usage when building the AI context window.

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ── Conversation History ───────────────────────────────────────────────
    # List of {"role": "user"|"assistant", "content": str, "timestamp": str}
    # Capped at last 50 messages on each write.
    messages = Column(JSON, default=list)

    # ── Session Context ────────────────────────────────────────────────────
    # Arbitrary key-value context passed alongside messages to the AI
    # (e.g. {"user_status": "traveling"}).
    context = Column(JSON)

    # ── Timestamps ─────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="chat_sessions")
