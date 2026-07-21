"""User ORM model."""
import uuid
from datetime import datetime

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime

from app.core.database import Base

# Matches the Postgres enum `user_role` created in sql/01_schema.sql.
USER_ROLE_ENUM = SAEnum("STUDENT", "TEACHER", name="user_role", create_type=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(USER_ROLE_ENUM, nullable=False, server_default="STUDENT")
    xp: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    level: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
