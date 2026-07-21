"""Schemas for the teacher content pipeline: generation + review/approval."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TeacherQuestSummary(BaseModel):
    """A quest row for the teacher review list."""
    id: str  # slug
    title: str
    nodeLabel: str
    topic: str | None = None
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    xpReward: int
    status: Literal["PENDING_TEACHER_REVIEW", "PUBLISHED", "REJECTED"]
    kind: Literal["SEQUENCE", "CODING", "ARENA"] = "SEQUENCE"
    subject: str  # subject title
    subjectSlug: str
    tileCount: int
    sourceName: str | None = None
    createdAt: datetime


class TeacherSubjectSummary(BaseModel):
    """A subject row for the teacher dashboard (counts cover all statuses)."""
    id: str  # slug
    title: str
    description: str | None = None
    questCount: int


class TeacherOverviewStats(BaseModel):
    subjects: int
    quests: int
    students: int


class TeacherOverview(BaseModel):
    stats: TeacherOverviewStats
    subjects: list[TeacherSubjectSummary]


class TeacherStudentRow(BaseModel):
    """A student in the teacher's roster, ranked by XP (rank 1 = highest)."""
    model_config = ConfigDict(from_attributes=True)

    rank: int
    id: uuid.UUID
    name: str
    email: str
    xp: int
    level: int
    completedCount: int
    achievementsCount: int
    joinedAt: datetime


class GenerateResponse(BaseModel):
    subject: str
    subjectSlug: str
    aiProvider: str  # "groq" / "openai" / "stub"
    created: list[TeacherQuestSummary]


class TileEdit(BaseModel):
    """A tile's editable display text. Matched to an existing tile by `id` (tile_key)."""
    id: str
    label: str = Field(min_length=1)
    sub: str | None = None


class AuthorTile(BaseModel):
    """A tile as authored in the structural builder. Keys are assigned server-side by position."""
    label: str = Field(min_length=1, max_length=120)
    sub: str | None = Field(default=None, max_length=200)


class _QuestContent(BaseModel):
    """Shared body for hand-authoring / structurally replacing a Sequence quest.

    `tiles` are the canonical order; links are derived from consecutive pairs and
    explained by `explanations[i]` (tiles[i] -> tiles[i+1]). Missing/blank
    explanations are auto-filled server-side, so the field is best-effort.
    """
    title: str = Field(min_length=1, max_length=160)
    nodeLabel: str = Field(min_length=1, max_length=120)
    topic: str | None = Field(default=None, max_length=120)
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"
    xpReward: int | None = Field(default=None, ge=0, le=10000, description="Omit to derive from difficulty.")
    briefSystemName: str | None = Field(default=None, max_length=160)
    briefStory: str | None = None
    prompt: str | None = None
    tiles: list[AuthorTile] = Field(min_length=3, description="Canonical sequence, in correct order.")
    distractors: list[AuthorTile] = Field(default_factory=list)
    explanations: list[str] = Field(default_factory=list, description="Per consecutive pair; index i = tiles[i]->tiles[i+1].")


class QuestCreate(_QuestContent):
    """Hand-author a brand-new quest draft. The subject is matched or created by slug."""
    subject: str = Field(min_length=1, max_length=120)


class QuestStructureUpdate(_QuestContent):
    """Structurally replace an existing quest's tiles/links + display fields (subject unchanged)."""


class CodingTestCaseInput(BaseModel):
    """A test case as authored by a teacher. The id is assigned server-side by position."""
    description: str = Field(min_length=1, max_length=200)
    # Empty is allowed and meaningful: it calls solution() with no arguments, which
    # is what a "print/return Hello, World" style challenge needs.
    input: str = Field(default="", max_length=2000, description="Argument expression passed to solution(...), e.g. '[3, 1, 2]'. Empty means solution().")
    expectedOutput: str = Field(max_length=2000, description="Expected str(solution(input)).")


class _CodingContent(BaseModel):
    """Shared body for hand-authoring / replacing a CODING quest.

    The student implements `solution(...)`; each test calls `solution(<input>)` and
    compares `str(result)` to `expectedOutput`. `xpReward` is derived from difficulty
    when omitted. At least one test case is required.
    """
    title: str = Field(min_length=1, max_length=160)
    nodeLabel: str = Field(min_length=1, max_length=120)
    topic: str | None = Field(default=None, max_length=120)
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"
    xpReward: int | None = Field(default=None, ge=0, le=10000, description="Omit to derive from difficulty.")
    briefSystemName: str | None = Field(default=None, max_length=160)
    briefStory: str | None = None
    prompt: str = Field(min_length=1, description="The coding task description shown in the editor panel.")
    starterCode: str = Field(default="", max_length=10000)
    language: Literal["python"] = "python"
    testCases: list[CodingTestCaseInput] = Field(min_length=1, description="At least one test case.")


class CodingQuestCreate(_CodingContent):
    """Hand-author a brand-new CODING quest draft. The subject is matched or created by slug."""
    subject: str = Field(min_length=1, max_length=120)


class CodingQuestUpdate(_CodingContent):
    """Replace an existing CODING quest's challenge + display fields (subject unchanged)."""


class ArenaQuestionInput(BaseModel):
    """One authored arena question. The id is assigned server-side by position."""
    prompt: str = Field(min_length=1, max_length=500)
    options: list[str] = Field(min_length=2, max_length=6, description="2-6 answer choices.")
    answer: int = Field(ge=0, description="0-based index into `options`; validated against its length.")
    explain: str = Field(default="", max_length=400, description="Shown after the question is answered.")

    @model_validator(mode="after")
    def _answer_in_range(self):
        if self.answer >= len(self.options):
            raise ValueError("answer must be an index into options")
        if any(not o.strip() for o in self.options):
            raise ValueError("options cannot be blank")
        return self


class _ArenaContent(BaseModel):
    """Shared body for hand-authoring / replacing an ARENA quest.

    The student answers each question against a countdown; `xpReward` is derived
    from difficulty when omitted.
    """
    title: str = Field(min_length=1, max_length=160)
    nodeLabel: str = Field(min_length=1, max_length=120)
    topic: str | None = Field(default=None, max_length=120)
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"
    xpReward: int | None = Field(default=None, ge=0, le=10000, description="Omit to derive from difficulty.")
    briefSystemName: str | None = Field(default=None, max_length=160)
    briefStory: str | None = None
    prompt: str | None = None
    intro: str = Field(default="", max_length=400)
    secondsPerQuestion: int = Field(default=15, ge=5, le=120)
    questions: list[ArenaQuestionInput] = Field(min_length=3, description="At least 3 questions.")


class ArenaQuestCreate(_ArenaContent):
    """Hand-author a brand-new ARENA quest draft. The subject is matched or created by slug."""
    subject: str = Field(min_length=1, max_length=120)


class ArenaQuestUpdate(_ArenaContent):
    """Replace an existing ARENA quest's round + display fields (subject unchanged)."""


class QuestUpdate(BaseModel):
    """Partial edit of a quest draft. Every field is optional; only provided fields change.

    Editing is limited to display text — tile/link *keys* stay stable, so reordering,
    adding, or removing tiles is intentionally out of scope (it would invalidate link keys).
    """
    title: str | None = Field(default=None, min_length=1)
    nodeLabel: str | None = Field(default=None, min_length=1)
    topic: str | None = None
    difficulty: Literal["EASY", "MEDIUM", "HARD"] | None = None
    xpReward: int | None = Field(default=None, ge=0, le=10000)
    briefSystemName: str | None = None
    briefStory: str | None = None
    prompt: str | None = None
    tiles: list[TileEdit] | None = None
    distractors: list[TileEdit] | None = None
    linkExplanations: dict[str, str] | None = None
