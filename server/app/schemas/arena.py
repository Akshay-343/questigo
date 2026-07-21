"""Schemas for Rapid Arena rounds — the timed multiple-choice quest kind.

The correct answer never reaches the browser ahead of time: students get
`ArenaQuestionOut` (prompt + options only) and grade one question at a time
through the answer endpoint, which returns the key for that question alone.
"""
from pydantic import BaseModel, Field


class ArenaQuestionOut(BaseModel):
    """Public question view — the answer index and explanation stay server-side."""
    id: str
    prompt: str
    options: list[str]


class ArenaRoundOut(BaseModel):
    intro: str
    secondsPerQuestion: int
    questions: list[ArenaQuestionOut]


class ArenaQuestionAuthor(BaseModel):
    """Teacher-authoring view — includes the answer key and explanation."""
    id: str
    prompt: str
    options: list[str]
    answer: int
    explain: str


class ArenaRoundAuthor(BaseModel):
    intro: str
    secondsPerQuestion: int
    questions: list[ArenaQuestionAuthor]


class ArenaAnswerRequest(BaseModel):
    questionId: str
    # -1 means the countdown expired without a pick.
    choice: int = Field(ge=-1, le=25)


class ArenaAnswerResponse(BaseModel):
    correct: bool
    answer: int  # the right option index, revealed once this question is answered
    explain: str
