"""Student progression business logic: XP awards, leaderboard, and profile."""
from sqlalchemy.orm import Session

from app.crud import content as content_crud
from app.crud import user as user_crud
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.student import (
    AwardXpRequest,
    CompletedQuestOut,
    LeaderboardEntry,
    ProfileOut,
    ProfileStats,
)
from app.services import achievement_service


def award_xp(db: Session, user: User, payload: AwardXpRequest) -> User:
    """Add XP to a student and recalculate their level. Returns the updated user."""
    return user_crud.add_xp(db, user, payload.amount)


def get_leaderboard(db: Session, limit: int = 50) -> list[LeaderboardEntry]:
    students = user_crud.list_students_ranked(db, limit)
    return [
        LeaderboardEntry(rank=i + 1, id=s.id, name=s.name, xp=s.xp, level=s.level)
        for i, s in enumerate(students)
    ]


def get_profile(db: Session, user: User) -> ProfileOut:
    """Assemble the student's profile: completed quests, persisted achievements, and stats."""
    rows = content_crud.completed_quests_for_user(db, user.id)

    completed_quests = [
        CompletedQuestOut(
            id=quest.slug,
            title=quest.title,
            node=quest.node_label,
            subject=subject.title,
            difficulty=quest.difficulty,
            xpReward=quest.xp_reward,
            isBoss=quest.is_boss,
            cleanBuild=attempt.clean_build,
            completedAt=attempt.completed_at,
        )
        for attempt, quest, subject in rows
    ]

    clean = sum(1 for q in completed_quests if q.cleanBuild)
    bosses = sum(1 for q in completed_quests if q.isBoss)

    # Achievements are persisted (unlocked at quest completion). Back-fill on view
    # so any now-eligible achievement (e.g. a level reached via seeded XP, before
    # this feature existed) is recorded; then read unlock state from the table.
    achievement_service.check_and_unlock(db, user)
    achievements = achievement_service.list_for_user(db, user)

    return ProfileOut(
        user=UserOut.model_validate(user),
        completedQuests=completed_quests,
        achievements=achievements,
        stats=ProfileStats(
            completedCount=len(completed_quests),
            cleanBuilds=clean,
            bossesDefeated=bosses,
            achievementsUnlocked=sum(1 for a in achievements if a.unlocked),
        ),
    )
