"""Database access for the achievement catalogue and per-user unlocks."""
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.achievement import Achievement, UserAchievement


def list_catalogue(db: Session) -> list[Achievement]:
    """All achievements in display order."""
    return list(db.scalars(select(Achievement).order_by(Achievement.position)))


def get_by_key(db: Session, key: str) -> Achievement | None:
    return db.scalar(select(Achievement).where(Achievement.key == key))


def unlocked_map(db: Session, user_id: uuid.UUID) -> dict[uuid.UUID, datetime]:
    """Map of achievement_id -> unlocked_at for the given user."""
    rows = db.scalars(select(UserAchievement).where(UserAchievement.user_id == user_id))
    return {r.achievement_id: r.unlocked_at for r in rows}


def unlock(db: Session, user_id: uuid.UUID, achievement_id: uuid.UUID) -> None:
    """Insert an unlock row. Caller commits. Assumes it isn't already present."""
    db.add(UserAchievement(user_id=user_id, achievement_id=achievement_id))


def unlocked_counts(db: Session) -> dict[uuid.UUID, int]:
    """Map of user_id -> number of achievements unlocked (for the teacher roster)."""
    rows = db.execute(
        select(UserAchievement.user_id, func.count()).group_by(UserAchievement.user_id)
    ).all()
    return {r[0]: int(r[1]) for r in rows}
