"""Student progression routes: XP award and leaderboard."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.schemas.auth import UserOut
from app.schemas.coding import RunRequest, RunResponse
from app.schemas.common import Envelope, ok
from app.schemas.arena import ArenaAnswerRequest, ArenaAnswerResponse
from app.schemas.content import CompleteQuestRequest, CompleteQuestResponse
from app.schemas.student import AwardXpRequest, LeaderboardEntry, ProfileOut
from app.services import content_service, student_service

# Student-scoped actions.
router = APIRouter(prefix="/student", tags=["student"])


@router.get("/profile", response_model=Envelope[ProfileOut])
def profile(
    current=Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    """Return the authenticated student's profile: completed quests, achievements, and stats."""
    return ok(student_service.get_profile(db, current))


@router.post("/xp", response_model=Envelope[UserOut])
def award_xp(
    payload: AwardXpRequest,
    current=Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    """Award XP to the authenticated student and recalculate their level."""
    user = student_service.award_xp(db, current, payload)
    return ok(UserOut.model_validate(user))


@router.post("/challenges/{slug}/run", response_model=Envelope[RunResponse])
def run_challenge(
    slug: str,
    payload: RunRequest,
    current=Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    """Dry-run a coding challenge: returns per-test pass/fail. Does not award XP."""
    return ok(content_service.run_challenge(db, current, slug, payload.code))


@router.post("/arena/{slug}/answer", response_model=Envelope[ArenaAnswerResponse])
def answer_arena(
    slug: str,
    payload: ArenaAnswerRequest,
    current=Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    """Grade one arena question mid-run: returns whether it was right, plus that
    question's answer and explanation. Does not award XP."""
    return ok(content_service.answer_arena(db, current, slug, payload.questionId, payload.choice))


@router.post("/quests/{slug}/complete", response_model=Envelope[CompleteQuestResponse])
def complete_quest(
    slug: str,
    payload: CompleteQuestRequest,
    current=Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    """Mark a quest completed for the student: records the attempt and awards XP (first time only)."""
    return ok(content_service.complete_quest(db, current, slug, payload))


# Leaderboard is readable by any authenticated user (students and teachers).
leaderboard_router = APIRouter(tags=["leaderboard"])


@leaderboard_router.get("/leaderboard", response_model=Envelope[list[LeaderboardEntry]])
def leaderboard(_current=Depends(get_current_user), db: Session = Depends(get_db)):
    return ok(student_service.get_leaderboard(db))
