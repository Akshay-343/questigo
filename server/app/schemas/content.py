"""Schemas for subjects, quests, and quest completion.

The quest payloads deliberately match the frontend's `SequenceMission` shape
(client/src/lib/sequenceData.ts) so the existing gameplay components consume the
API with no transformation.
"""
from typing import Literal

from pydantic import BaseModel

from app.schemas.auth import UserOut
from app.schemas.coding import CodingChallengeAuthor, CodingChallengeOut
from app.schemas.arena import ArenaRoundAuthor, ArenaRoundOut
from app.schemas.student import AchievementOut


class TileOut(BaseModel):
    id: str
    label: str
    sub: str | None = None


class QuestSummary(BaseModel):
    """A node on the skill tree, with this student's progress flags."""
    id: str  # slug
    order: int
    node: str
    title: str
    topic: str | None = None
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    xpReward: int
    isBoss: bool = False
    kind: Literal["SEQUENCE", "CODING", "ARENA"] = "SEQUENCE"
    completed: bool = False
    cleanBuild: bool = False


class SubjectOut(BaseModel):
    id: str  # slug
    title: str
    subtitle: str | None = None
    description: str | None = None
    questCount: int = 0
    completedCount: int = 0


class SubjectWithQuests(SubjectOut):
    quests: list[QuestSummary]


class QuestBrief(BaseModel):
    systemName: str
    story: str


class QuestDetail(BaseModel):
    id: str  # slug
    order: int
    node: str
    title: str
    topic: str | None = None
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    xpReward: int
    isBoss: bool = False
    kind: Literal["SEQUENCE", "CODING", "ARENA"] = "SEQUENCE"
    brief: QuestBrief
    prompt: str
    tiles: list[TileOut]
    distractors: list[TileOut] = []
    linkExplanations: dict[str, str]
    coding: CodingChallengeOut | None = None
    arena: ArenaRoundOut | None = None
    # Teacher-authoring view of the coding challenge (inputs/expected included).
    # Only populated on the teacher preview path; always None for students.
    codingFull: CodingChallengeAuthor | None = None
    # Teacher-authoring view of the arena round (answer key + explanations).
    # Only populated on the teacher preview path; always None for students.
    arenaFull: ArenaRoundAuthor | None = None
    subjectSlug: str
    nextQuestSlug: str | None = None
    completed: bool = False
    cleanBuild: bool = False


class CompleteQuestRequest(BaseModel):
    clean: bool = False
    code: str | None = None  # required for CODING quests; re-verified server-side


class CompleteQuestResponse(BaseModel):
    user: UserOut
    xpAwarded: int
    alreadyCompleted: bool
    leveledUp: bool
    newLevel: int
    unlockedAchievements: list[AchievementOut] = []
