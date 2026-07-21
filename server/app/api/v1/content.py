"""Content routes: subjects (skill trees) and quests."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.common import Envelope, ok
from app.schemas.content import QuestDetail, SubjectOut, SubjectWithQuests
from app.services import content_service

router = APIRouter(tags=["content"])


@router.get("/subjects", response_model=Envelope[list[SubjectOut]])
def list_subjects(current=Depends(require_role("STUDENT")), db: Session = Depends(get_db)):
    """All tracks with at least one published quest, annotated with this student's progress."""
    return ok(content_service.list_subjects(db, current))


@router.get("/subjects/{slug}", response_model=Envelope[SubjectWithQuests])
def get_subject(slug: str, current=Depends(require_role("STUDENT")), db: Session = Depends(get_db)):
    """Subject + its quests, annotated with this student's completion progress."""
    return ok(content_service.get_subject_with_quests(db, slug, current))


@router.get("/quests/{slug}", response_model=Envelope[QuestDetail])
def get_quest(slug: str, current=Depends(require_role("STUDENT")), db: Session = Depends(get_db)):
    return ok(content_service.get_quest_detail(db, slug, current))
