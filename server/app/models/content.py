"""Content ORM models: Subject -> Quest -> (QuestTile, QuestLink)."""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

# Matches the Postgres enum `difficulty` from sql/03_content_schema.sql.
DIFFICULTY_ENUM = SAEnum("EASY", "MEDIUM", "HARD", name="difficulty", create_type=False)

# Matches the Postgres enum `quest_status` from sql/05_quest_status.sql.
QUEST_STATUS_ENUM = SAEnum(
    "PENDING_TEACHER_REVIEW", "PUBLISHED", "REJECTED", name="quest_status", create_type=False
)

# Matches the Postgres enum `quest_kind` from sql/06_coding_challenge.sql + 11_arena.sql.
# DETECTIVE is a retired kind: the value stays in the DB enum (Postgres can't drop
# one without recreating the type) but nothing creates or plays it any more.
QUEST_KIND_ENUM = SAEnum("SEQUENCE", "CODING", "DETECTIVE", "ARENA", name="quest_kind", create_type=False)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    quests: Mapped[list["Quest"]] = relationship(
        back_populates="subject", order_by="Quest.position", cascade="all, delete-orphan"
    )


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    node_label: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    topic: Mapped[str | None] = mapped_column(String(120))
    difficulty: Mapped[str] = mapped_column(DIFFICULTY_ENUM, nullable=False, server_default="MEDIUM")
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, server_default="100")
    is_boss: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    kind: Mapped[str] = mapped_column(QUEST_KIND_ENUM, nullable=False, server_default="SEQUENCE")
    brief_system_name: Mapped[str | None] = mapped_column(String(160))
    brief_story: Mapped[str | None] = mapped_column(Text)
    prompt: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(QUEST_STATUS_ENUM, nullable=False, server_default="PUBLISHED")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    source_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    subject: Mapped["Subject"] = relationship(back_populates="quests")
    tiles: Mapped[list["QuestTile"]] = relationship(
        back_populates="quest", order_by="QuestTile.position", cascade="all, delete-orphan"
    )
    links: Mapped[list["QuestLink"]] = relationship(
        back_populates="quest", cascade="all, delete-orphan"
    )
    coding_challenge: Mapped["CodingChallenge | None"] = relationship(
        back_populates="quest", uselist=False, cascade="all, delete-orphan"
    )
    arena_round: Mapped["ArenaRound | None"] = relationship(
        back_populates="quest", uselist=False, cascade="all, delete-orphan"
    )


class QuestTile(Base):
    __tablename__ = "quest_tiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False
    )
    tile_key: Mapped[str] = mapped_column(String(60), nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    sub: Mapped[str | None] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_distractor: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    quest: Mapped["Quest"] = relationship(back_populates="tiles")


class CodingChallenge(Base):
    __tablename__ = "coding_challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    starter_code: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    language: Mapped[str] = mapped_column(String(40), nullable=False, server_default="python")
    # Array of { id, description, input, expectedOutput }.
    test_cases: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default="[]")

    quest: Mapped["Quest"] = relationship(back_populates="coding_challenge")


class ArenaRound(Base):
    __tablename__ = "arena_rounds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    intro: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    seconds_per_question: Mapped[int] = mapped_column(Integer, nullable=False, server_default="15")
    # [{ id, prompt, options: [str], answer: int, explain: str }] — `answer` and
    # `explain` never leave the server before that question has been answered.
    questions: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default="[]")

    quest: Mapped["Quest"] = relationship(back_populates="arena_round")


class QuestLink(Base):
    __tablename__ = "quest_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False
    )
    from_key: Mapped[str] = mapped_column(String(60), nullable=False)
    to_key: Mapped[str] = mapped_column(String(60), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    quest: Mapped["Quest"] = relationship(back_populates="links")
