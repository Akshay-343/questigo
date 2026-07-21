"""Database access for the User model."""
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.levels import level_for_xp
from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def create(db: Session, *, name: str, email: str, password_hash: str, role: str = "STUDENT") -> User:
    user = User(
        name=name.strip(),
        email=email.lower().strip(),
        password_hash=password_hash,
        role=role,
        xp=0,
        level=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def add_xp(db: Session, user: User, amount: int) -> User:
    """Add XP (never below zero) and recalculate the derived level. XP is additive per CLAUDE.md."""
    user.xp = max(0, user.xp + amount)
    user.level = level_for_xp(user.xp)
    db.commit()
    db.refresh(user)
    return user


def count_students(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == "STUDENT")) or 0


def list_students_ranked(db: Session, limit: int = 50) -> list[User]:
    """Students ordered by XP desc (then earliest signup) for the leaderboard."""
    return list(
        db.scalars(
            select(User)
            .where(User.role == "STUDENT")
            .order_by(User.xp.desc(), User.created_at.asc())
            .limit(limit)
        )
    )
