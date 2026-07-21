"""Teacher content pipeline routes: AI generation + draft review/approval."""
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.core.errors import AppError
from app.schemas.common import Envelope, ok
from app.schemas.content import QuestDetail
from app.schemas.teacher import (
    ArenaQuestCreate,
    ArenaQuestUpdate,
    CodingQuestCreate,
    CodingQuestUpdate,
    GenerateResponse,
    QuestCreate,
    QuestStructureUpdate,
    QuestUpdate,
    TeacherOverview,
    TeacherQuestSummary,
    TeacherStudentRow,
)
from app.services import generation_service, teacher_service

router = APIRouter(prefix="/teacher", tags=["teacher"])

_VALID_STATUS = {"PENDING_TEACHER_REVIEW", "PUBLISHED", "REJECTED"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/generate", response_model=Envelope[GenerateResponse])
async def generate(
    subject: str = Form(..., description="Subject/track title; matched or created by slug."),
    count: int = Form(2, ge=1, le=4),
    kind: str = Form("SEQUENCE", description="Quest type to generate: SEQUENCE, CODING, or ARENA."),
    text: str | None = Form(None, description="Pasted source material (alternative to a file)."),
    file: UploadFile | None = File(None, description="PDF of learning material."),
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Generate quest drafts from an uploaded PDF or pasted text. Drafts land as PENDING_TEACHER_REVIEW."""
    if kind not in {"SEQUENCE", "CODING", "ARENA"}:
        raise AppError("kind must be SEQUENCE, CODING, or ARENA.", status_code=400)
    source_text = (text or "").strip()
    source_name = None

    if file is not None and file.filename:
        if not file.filename.lower().endswith(".pdf"):
            raise AppError("Only PDF files are supported.", status_code=400)
        data = await file.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise AppError("File exceeds the 10 MB limit.", status_code=400)
        source_text = generation_service.extract_pdf_text(data)
        source_name = file.filename

    if not source_text:
        raise AppError("Provide a PDF file or pasted text to generate from.", status_code=400)

    return ok(teacher_service.generate(
        db, current,
        subject_title=subject,
        source_text=source_text,
        source_name=source_name,
        count=count,
        kind=kind,
    ))


@router.get("/overview", response_model=Envelope[TeacherOverview])
def overview(current=Depends(require_role("TEACHER")), db: Session = Depends(get_db)):
    """Teacher dashboard summary: subject/quest/student counts + the subject list."""
    return ok(teacher_service.get_overview(db))


@router.get("/students", response_model=Envelope[list[TeacherStudentRow]])
def students(current=Depends(require_role("TEACHER")), db: Session = Depends(get_db)):
    """Roster of all students ranked by XP, with completed-quest + achievement counts."""
    return ok(teacher_service.list_students(db))


@router.post("/quests", response_model=Envelope[QuestDetail], status_code=201)
def create_quest(
    payload: QuestCreate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Hand-author a new quest draft from scratch (lands PENDING_TEACHER_REVIEW)."""
    return ok(teacher_service.create_quest(db, current, payload))


@router.post("/coding-quests", response_model=Envelope[QuestDetail], status_code=201)
def create_coding_quest(
    payload: CodingQuestCreate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Hand-author a new coding-challenge quest from scratch (lands PENDING_TEACHER_REVIEW)."""
    return ok(teacher_service.create_coding_quest(db, current, payload))


@router.put("/coding-quests/{slug}", response_model=Envelope[QuestDetail])
def update_coding_quest(
    slug: str,
    payload: CodingQuestUpdate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Replace a coding quest's challenge (prompt/starter/test cases) + display fields."""
    return ok(teacher_service.replace_coding_challenge(db, slug, payload))


@router.post("/arena-quests", response_model=Envelope[QuestDetail], status_code=201)
def create_arena_quest(
    payload: ArenaQuestCreate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Hand-author a new rapid-arena quest from scratch (lands PENDING_TEACHER_REVIEW)."""
    return ok(teacher_service.create_arena_quest(db, current, payload))


@router.put("/arena-quests/{slug}", response_model=Envelope[QuestDetail])
def update_arena_quest(
    slug: str,
    payload: ArenaQuestUpdate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Replace an arena quest's round (questions/timer/intro) + display fields."""
    return ok(teacher_service.replace_arena_round(db, slug, payload))


@router.get("/quests", response_model=Envelope[list[TeacherQuestSummary]])
def list_quests(
    status: str | None = None,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """List quests for review. Optional ?status= filter (defaults to all)."""
    if status is not None and status not in _VALID_STATUS:
        raise AppError("Invalid status filter.", status_code=400)
    return ok(teacher_service.list_quests(db, status))


@router.get("/quests/{slug}", response_model=Envelope[QuestDetail])
def get_quest(slug: str, current=Depends(require_role("TEACHER")), db: Session = Depends(get_db)):
    """Full draft payload for preview (any status)."""
    return ok(teacher_service.get_draft_detail(db, slug))


@router.patch("/quests/{slug}", response_model=Envelope[QuestDetail])
def update_quest(
    slug: str,
    payload: QuestUpdate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Edit a quest's display text (title, difficulty, XP, story, tile labels, explanations)."""
    return ok(teacher_service.update_draft(db, slug, payload))


@router.put("/quests/{slug}/structure", response_model=Envelope[QuestDetail])
def replace_structure(
    slug: str,
    payload: QuestStructureUpdate,
    current=Depends(require_role("TEACHER")),
    db: Session = Depends(get_db),
):
    """Structurally replace a Sequence quest: add/remove/reorder tiles + edit all fields."""
    return ok(teacher_service.replace_structure(db, slug, payload))


@router.post("/quests/{slug}/approve", response_model=Envelope[TeacherQuestSummary])
def approve_quest(slug: str, current=Depends(require_role("TEACHER")), db: Session = Depends(get_db)):
    """Publish a draft so it appears in the student skill tree."""
    return ok(teacher_service.set_status(db, slug, "PUBLISHED"))


@router.post("/quests/{slug}/reject", response_model=Envelope[TeacherQuestSummary])
def reject_quest(slug: str, current=Depends(require_role("TEACHER")), db: Session = Depends(get_db)):
    """Reject a draft; it stays out of the student flow."""
    return ok(teacher_service.set_status(db, slug, "REJECTED"))
