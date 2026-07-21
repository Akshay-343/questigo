"""QuestAttempt ORM model — one row per (user, quest)."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, UniqueConstraint, func
from sqlalchemy import Boolean
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime

from app.core.database import Base

# Matches the Postgres enum `attempt_status` from sql/03_content_schema.sql.
ATTEMPT_STATUS_ENUM = SAEnum("IN_PROGRESS", "COMPLETED", name="attempt_status", create_type=False)


class QuestAttempt(Base):
    __tablename__ = "quest_attempts"
    __table_args__ = (UniqueConstraint("user_id", "quest_id", name="quest_attempts_user_id_quest_id_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(ATTEMPT_STATUS_ENUM, nullable=False, server_default="IN_PROGRESS")
    clean_build: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
