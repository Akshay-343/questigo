"""Achievement ORM models: a static catalogue + per-user unlock records."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base


class Achievement(Base):
    """Display metadata for an achievement. Unlock predicates live in achievement_service."""
    __tablename__ = "achievements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(60), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    icon: Mapped[str] = mapped_column(String(60), nullable=False)  # Lucide icon name
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    unlocks: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement", cascade="all, delete-orphan"
    )


class UserAchievement(Base):
    """A single student's unlock of a single achievement (with timestamp)."""
    __tablename__ = "user_achievements"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    achievement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    achievement: Mapped["Achievement"] = relationship(back_populates="unlocks")
