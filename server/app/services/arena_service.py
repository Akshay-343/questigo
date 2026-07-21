"""Grading for Rapid Arena rounds.

Two entry points, mirroring how coding challenges work: `grade_one` backs the
live per-question endpoint, and `grade_submission` re-grades the whole run
server-side at completion so XP can't be claimed by a forged request.
"""
import json

# Wrong answers a student can afford before the run ends — one per heart.
HEARTS = 3


def find_question(questions: list[dict], question_id: str) -> dict | None:
    return next((q for q in questions if q.get("id") == question_id), None)


def grade_one(question: dict, choice: int) -> bool:
    """Was `choice` the right option? A choice of -1 (timeout) is always wrong."""
    return choice >= 0 and choice == int(question.get("answer", -1))


def parse_answers(raw: str | None) -> dict[str, int] | None:
    """Read the `{"answers": {questionId: choiceIndex}}` blob the client submits.

    Returns None when the payload is missing or malformed, so callers can raise
    a clean 400 rather than crashing on bad input.
    """
    if not raw or not raw.strip():
        return None
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return None
    answers = data.get("answers") if isinstance(data, dict) else None
    if not isinstance(answers, dict):
        return None
    out: dict[str, int] = {}
    for key, value in answers.items():
        try:
            out[str(key)] = int(value)
        except (ValueError, TypeError):
            return None
    return out


def grade_submission(questions: list[dict], answers: dict[str, int]) -> tuple[int, int, bool, bool]:
    """Re-grade a full run.

    Returns (correct, total, passed, clean). Unanswered questions count as wrong,
    so a partial submission can't sneak past the heart limit. `passed` mirrors the
    in-game rule — you survive while wrong answers stay under HEARTS — and `clean`
    means a flawless run, which earns the clean-build bonus.
    """
    total = len(questions)
    correct = sum(1 for q in questions if grade_one(q, answers.get(q.get("id", ""), -1)))
    wrong = total - correct
    return correct, total, wrong < HEARTS, wrong == 0
