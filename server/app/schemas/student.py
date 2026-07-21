"""Request/response schemas for student progression and the leaderboard."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserOut


class AwardXpRequest(BaseModel):
    amount: int = Field(gt=0, le=10000, description="XP to add to the current student.")
    source: str | None = Field(default=None, max_length=120, description="Optional label, e.g. a mission id.")


class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    id: uuid.UUID
    name: str
    xp: int
    level: int


class CompletedQuestOut(BaseModel):
    """A quest the student has finished, for the profile history list."""
    id: str  # quest slug
    title: str
    node: str
    subject: str  # subject title
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    xpReward: int
    isBoss: bool
    cleanBuild: bool
    completedAt: datetime | None = None


class AchievementOut(BaseModel):
    key: str
    title: str
    description: str
    icon: str  # Lucide icon name the frontend maps to a component
    unlocked: bool
    unlockedAt: datetime | None = None


class ProfileStats(BaseModel):
    completedCount: int
    cleanBuilds: int
    bossesDefeated: int
    achievementsUnlocked: int


class ProfileOut(BaseModel):
    user: UserOut
    completedQuests: list[CompletedQuestOut]
    achievements: list[AchievementOut]
    stats: ProfileStats
