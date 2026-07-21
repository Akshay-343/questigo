"""Schemas for the coding-challenge node type: payload, run requests, results."""
from pydantic import BaseModel, Field


class CodingTestCaseOut(BaseModel):
    """A test case as shown to the student before running — description only."""
    id: str
    description: str


class CodingChallengeOut(BaseModel):
    prompt: str
    starterCode: str
    language: str
    testCases: list[CodingTestCaseOut]


class CodingTestCaseFull(BaseModel):
    """A test case with its input/expected output — teacher authoring view only."""
    id: str
    description: str
    input: str
    expectedOutput: str


class CodingChallengeAuthor(BaseModel):
    """Full coding-challenge payload (incl. test inputs/expected) for teacher editing.

    Never returned to students — inputs/expected stay server-side everywhere else.
    """
    prompt: str
    starterCode: str
    language: str
    testCases: list[CodingTestCaseFull]


class RunRequest(BaseModel):
    code: str = Field(min_length=1, max_length=10000)


class TestResult(BaseModel):
    id: str
    description: str
    passed: bool
    actual: str | None = None
    expected: str | None = None


class RunResponse(BaseModel):
    results: list[TestResult]
    allPassed: bool
    error: str | None = None  # compile/setup error that blocked every test
