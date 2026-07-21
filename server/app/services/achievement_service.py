"""Achievement unlock logic.

The *display metadata* (title/description/icon) lives in the `achievements` table
(seeded by sql/08_achievements.sql). The *unlock predicates* live here — one per
catalogue key — evaluated against a small context derived from the student's
completed quests and level. `check_and_unlock` is called after every quest
completion and persists any newly-satisfied achievements as `user_achievements`.
"""
from dataclasses import dataclass
from typing import Callable

from sqlalchemy.orm import Session

from app.crud import achievement as achievement_crud
from app.crud import content as content_crud
from app.models.achievement import Achievement
from app.models.user import User
from app.schemas.student import AchievementOut


@dataclass
class _Ctx:
    completed: int
    clean: int
    bosses: int
    level: int


# Predicate per achievement key. Keys MUST match the seeded `achievements.key`
# values in sql/08_achievements.sql.
_PREDICATES: dict[str, Callable[[_Ctx], bool]] = {
    "first-quest": lambda c: c.completed >= 1,
    "clean-architect": lambda c: c.clean >= 1,
    "boss-slayer": lambda c: c.bosses >= 1,
    "trifecta": lambda c: c.completed >= 3,
    "rising-star": lambda c: c.level >= 3,
    "perfectionist": lambda c: c.clean >= 3,
    "veteran": lambda c: c.level >= 5,
}


def _build_context(db: Session, user: User) -> _Ctx:
    rows = content_crud.completed_quests_for_user(db, user.id)
    completed = len(rows)
    clean = sum(1 for attempt, _q, _s in rows if attempt.clean_build)
    bosses = sum(1 for _a, quest, _s in rows if quest.is_boss)
    return _Ctx(completed=completed, clean=clean, bosses=bosses, level=user.level)


def check_and_unlock(db: Session, user: User) -> list[Achievement]:
    """Evaluate every predicate; persist + return achievements newly unlocked for this user.

    Idempotent: already-unlocked achievements are skipped, so this also back-fills
    achievements earned before the feature existed (on the student's next completion).
    Commits its own unlock rows.
    """
    ctx = _build_context(db, user)
    catalogue = achievement_crud.list_catalogue(db)
    already = achievement_crud.unlocked_map(db, user.id)

    newly: list[Achievement] = []
    for ach in catalogue:
        if ach.id in already:
            continue
        pred = _PREDICATES.get(ach.key)
        if pred and pred(ctx):
            achievement_crud.unlock(db, user.id, ach.id)
            newly.append(ach)

    if newly:
        db.commit()
    return newly


def list_for_user(db: Session, user: User) -> list[AchievementOut]:
    """The full catalogue annotated with this user's unlock state — for the profile page."""
    catalogue = achievement_crud.list_catalogue(db)
    unlocked = achievement_crud.unlocked_map(db, user.id)
    return [
        AchievementOut(
            key=ach.key,
            title=ach.title,
            description=ach.description,
            icon=ach.icon,
            unlocked=ach.id in unlocked,
            unlockedAt=unlocked.get(ach.id),
        )
        for ach in catalogue
    ]


def to_out(ach: Achievement) -> AchievementOut:
    """Shape a freshly-unlocked Achievement (always unlocked) for the API response."""
    return AchievementOut(
        key=ach.key,
        title=ach.title,
        description=ach.description,
        icon=ach.icon,
        unlocked=True,
        unlockedAt=None,
    )
