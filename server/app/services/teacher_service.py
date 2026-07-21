"""Teacher content pipeline: hand-author, list drafts, preview, edit, approve/reject."""
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.crud import achievement as achievement_crud
from app.crud import content as content_crud
from app.crud import user as user_crud
from app.models.content import Quest, Subject
from app.models.user import User
from app.schemas.coding import CodingChallengeAuthor, CodingTestCaseFull
from app.schemas.content import QuestBrief, QuestDetail, TileOut
from app.schemas.arena import ArenaQuestionAuthor, ArenaRoundAuthor
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
    TeacherOverviewStats,
    TeacherQuestSummary,
    TeacherStudentRow,
    TeacherSubjectSummary,
)
from app.services import generation_service
from app.services.generation_service import XP_BY_DIFFICULTY, slugify

DEFAULT_PROMPT = "Arrange the steps in the correct order."
DEFAULT_ARENA_PROMPT = "Answer before the timer runs out. Keep your streak alive."


def _summary(quest: Quest, subject: Subject, tile_count: int) -> TeacherQuestSummary:
    return TeacherQuestSummary(
        id=quest.slug,
        title=quest.title,
        nodeLabel=quest.node_label,
        topic=quest.topic,
        difficulty=quest.difficulty,
        xpReward=quest.xp_reward,
        status=quest.status,
        kind=quest.kind,
        subject=subject.title,
        subjectSlug=subject.slug,
        tileCount=tile_count,
        sourceName=quest.source_name,
        createdAt=quest.created_at,
    )


def generate(
    db: Session,
    teacher: User,
    *,
    subject_title: str,
    source_text: str,
    source_name: str | None,
    count: int,
    kind: str = "SEQUENCE",
) -> GenerateResponse:
    quests = generation_service.generate_quests(
        db, teacher,
        subject_title=subject_title,
        source_text=source_text,
        source_name=source_name,
        count=count,
        kind=kind,
    )
    rows = {q.id: tc for q, _s, tc in content_crud.list_quests(db)}
    subject = quests[0].subject
    return GenerateResponse(
        subject=subject.title,
        subjectSlug=subject.slug,
        aiProvider=(settings.ai_provider if settings.ai_enabled else "stub"),
        created=[_summary(q, q.subject, rows.get(q.id, 0)) for q in quests],
    )


def list_quests(db: Session, status: str | None) -> list[TeacherQuestSummary]:
    return [_summary(q, s, tc) for q, s, tc in content_crud.list_quests(db, status)]


def get_overview(db: Session) -> TeacherOverview:
    """Dashboard summary: content counts + the subject list (all statuses)."""
    subjects = content_crud.list_subjects(db)  # eager-loads each subject's quests
    summaries = [
        TeacherSubjectSummary(
            id=s.slug,
            title=s.title,
            description=s.description,
            questCount=len(s.quests),
        )
        for s in subjects
    ]
    return TeacherOverview(
        stats=TeacherOverviewStats(
            subjects=len(subjects),
            quests=sum(len(s.quests) for s in subjects),
            students=user_crud.count_students(db),
        ),
        subjects=summaries,
    )


def list_students(db: Session) -> list[TeacherStudentRow]:
    """Roster of all students ranked by XP, annotated with progress counts."""
    students = user_crud.list_students_ranked(db, limit=500)
    completed = content_crud.completed_counts(db)
    achievements = achievement_crud.unlocked_counts(db)
    return [
        TeacherStudentRow(
            rank=i + 1,
            id=s.id,
            name=s.name,
            email=s.email,
            xp=s.xp,
            level=s.level,
            completedCount=completed.get(s.id, 0),
            achievementsCount=achievements.get(s.id, 0),
            joinedAt=s.created_at,
        )
        for i, s in enumerate(students)
    ]


def _unique_slug(db: Session, title: str) -> str:
    base = slugify(title)[:90]
    slug = base
    while content_crud.slug_exists(db, slug):
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _build_structure(content: QuestCreate | QuestStructureUpdate) -> tuple[list[dict], list[dict], list[dict]]:
    """Turn authored tiles/distractors/explanations into DB-ready rows.

    Tile keys are assigned by position (s1..sN / d1..dM); links are derived from
    consecutive canonical tiles, explained by explanations[i] (blank -> auto-filled).
    """
    tiles = [
        {"id": f"s{i + 1}", "label": t.label.strip(), "sub": _clean(t.sub)}
        for i, t in enumerate(content.tiles)
    ]
    distractors = [
        {"id": f"d{i + 1}", "label": t.label.strip(), "sub": _clean(t.sub)}
        for i, t in enumerate(content.distractors)
    ]
    exps = content.explanations
    links: list[dict] = []
    for i, (a, b) in enumerate(zip(tiles, tiles[1:])):
        explanation = (exps[i].strip() if i < len(exps) and exps[i] and exps[i].strip() else "")
        if not explanation:
            explanation = f"“{a['label']}” must come before “{b['label']}”."
        links.append({"from": a["id"], "to": b["id"], "explanation": explanation[:1000]})
    return tiles, distractors, links


def _xp_for(content: QuestCreate | QuestStructureUpdate) -> int:
    return content.xpReward if content.xpReward is not None else XP_BY_DIFFICULTY[content.difficulty]


def create_quest(db: Session, teacher: User, payload: QuestCreate) -> QuestDetail:
    """Hand-author a brand-new quest draft (PENDING_TEACHER_REVIEW). Creates the subject if needed."""
    subject_title = payload.subject.strip()
    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)
    tiles, distractors, links = _build_structure(payload)
    title = payload.title.strip()
    quest = content_crud.create_quest_draft(
        db,
        subject=subject,
        slug=_unique_slug(db, title),
        position=content_crud.next_quest_position(db, subject.id),
        node_label=payload.nodeLabel.strip(),
        title=title,
        topic=_clean(payload.topic),
        difficulty=payload.difficulty,
        xp_reward=_xp_for(payload),
        brief_system_name=_clean(payload.briefSystemName) or title,
        brief_story=_clean(payload.briefStory),
        prompt=_clean(payload.prompt) or DEFAULT_PROMPT,
        created_by=teacher.id,
        source_name=None,
        tiles=tiles,
        distractors=distractors,
        links=links,
    )
    db.commit()
    db.refresh(quest)
    return _detail(quest)


def replace_structure(db: Session, slug: str, payload: QuestStructureUpdate) -> QuestDetail:
    """Fully replace a Sequence quest's tiles/links + display fields (add/remove/reorder)."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)
    if quest.kind == "CODING":
        raise AppError("Coding quests can't be edited as sequences.", status_code=400)

    tiles, distractors, links = _build_structure(payload)
    title = payload.title.strip()
    fields = {
        "title": title,
        "node_label": payload.nodeLabel.strip(),
        "topic": _clean(payload.topic),
        "difficulty": payload.difficulty,
        "xp_reward": _xp_for(payload),
        "brief_system_name": _clean(payload.briefSystemName) or title,
        "brief_story": _clean(payload.briefStory),
        "prompt": _clean(payload.prompt) or DEFAULT_PROMPT,
    }
    content_crud.replace_quest_structure(
        db, quest, fields=fields, tiles=tiles, distractors=distractors, links=links
    )
    return _detail(quest)


def _build_test_cases(cases) -> list[dict]:
    """Assign stable ids (tc1..tcN) and strip authored test cases into DB rows."""
    return [
        {
            "id": f"tc{i + 1}",
            "description": c.description.strip(),
            "input": c.input.strip(),
            "expectedOutput": c.expectedOutput,
        }
        for i, c in enumerate(cases)
    ]


def create_coding_quest(db: Session, teacher: User, payload: CodingQuestCreate) -> QuestDetail:
    """Hand-author a brand-new CODING quest draft. Creates the subject if needed."""
    subject_title = payload.subject.strip()
    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)
    title = payload.title.strip()
    prompt = payload.prompt.strip()
    quest = content_crud.create_coding_quest_draft(
        db,
        subject=subject,
        slug=_unique_slug(db, title),
        position=content_crud.next_quest_position(db, subject.id),
        node_label=payload.nodeLabel.strip(),
        title=title,
        topic=_clean(payload.topic),
        difficulty=payload.difficulty,
        xp_reward=payload.xpReward if payload.xpReward is not None else XP_BY_DIFFICULTY[payload.difficulty],
        brief_system_name=_clean(payload.briefSystemName) or title,
        brief_story=_clean(payload.briefStory),
        prompt=prompt,
        created_by=teacher.id,
        coding_prompt=prompt,
        starter_code=payload.starterCode,
        language=payload.language,
        test_cases=_build_test_cases(payload.testCases),
    )
    db.commit()
    db.refresh(quest)
    return _detail(quest)


def replace_coding_challenge(db: Session, slug: str, payload: CodingQuestUpdate) -> QuestDetail:
    """Replace a CODING quest's challenge (prompt/starter/test cases) + display fields."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)
    if quest.kind != "CODING":
        raise AppError("Sequence quests can't be edited as coding challenges.", status_code=400)

    title = payload.title.strip()
    prompt = payload.prompt.strip()
    fields = {
        "title": title,
        "node_label": payload.nodeLabel.strip(),
        "topic": _clean(payload.topic),
        "difficulty": payload.difficulty,
        "xp_reward": payload.xpReward if payload.xpReward is not None else XP_BY_DIFFICULTY[payload.difficulty],
        "brief_system_name": _clean(payload.briefSystemName) or title,
        "brief_story": _clean(payload.briefStory),
        "prompt": prompt,
    }
    content_crud.replace_coding_challenge(
        db, quest, fields=fields, coding_prompt=prompt, starter_code=payload.starterCode,
        language=payload.language, test_cases=_build_test_cases(payload.testCases),
    )
    return _detail(quest)


def _build_questions(questions) -> list[dict]:
    """Assign stable ids (q1..qN) and strip authored arena questions into DB rows."""
    return [
        {
            "id": f"q{i + 1}",
            "prompt": q.prompt.strip(),
            "options": [o.strip() for o in q.options],
            "answer": q.answer,
            "explain": q.explain.strip(),
        }
        for i, q in enumerate(questions)
    ]


def create_arena_quest(db: Session, teacher: User, payload: ArenaQuestCreate) -> QuestDetail:
    """Hand-author a brand-new ARENA quest draft. Creates the subject if needed."""
    subject_title = payload.subject.strip()
    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)
    title = payload.title.strip()
    quest = content_crud.create_arena_quest_draft(
        db,
        subject=subject,
        slug=_unique_slug(db, title),
        position=content_crud.next_quest_position(db, subject.id),
        node_label=payload.nodeLabel.strip(),
        title=title,
        topic=_clean(payload.topic),
        difficulty=payload.difficulty,
        xp_reward=payload.xpReward if payload.xpReward is not None else XP_BY_DIFFICULTY[payload.difficulty],
        brief_system_name=_clean(payload.briefSystemName) or title,
        brief_story=_clean(payload.briefStory),
        prompt=_clean(payload.prompt) or DEFAULT_ARENA_PROMPT,
        created_by=teacher.id,
        intro=payload.intro.strip(),
        seconds_per_question=payload.secondsPerQuestion,
        questions=_build_questions(payload.questions),
    )
    db.commit()
    db.refresh(quest)
    return _detail(quest)


def replace_arena_round(db: Session, slug: str, payload: ArenaQuestUpdate) -> QuestDetail:
    """Replace an ARENA quest's round (questions/timer/intro) + display fields."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)
    if quest.kind != "ARENA":
        raise AppError("Only arena quests can be edited as arena rounds.", status_code=400)

    title = payload.title.strip()
    fields = {
        "title": title,
        "node_label": payload.nodeLabel.strip(),
        "topic": _clean(payload.topic),
        "difficulty": payload.difficulty,
        "xp_reward": payload.xpReward if payload.xpReward is not None else XP_BY_DIFFICULTY[payload.difficulty],
        "brief_system_name": _clean(payload.briefSystemName) or title,
        "brief_story": _clean(payload.briefStory),
        "prompt": _clean(payload.prompt) or DEFAULT_ARENA_PROMPT,
    }
    content_crud.replace_arena_round(
        db, quest, fields=fields, intro=payload.intro.strip(),
        seconds_per_question=payload.secondsPerQuestion,
        questions=_build_questions(payload.questions),
    )
    return _detail(quest)


def _coding_author(quest: Quest) -> CodingChallengeAuthor | None:
    """Full coding payload (incl. inputs/expected) for the teacher authoring view."""
    cc = quest.coding_challenge
    if cc is None:
        return None
    return CodingChallengeAuthor(
        prompt=cc.prompt,
        starterCode=cc.starter_code,
        language=cc.language,
        testCases=[
            CodingTestCaseFull(
                id=tc["id"],
                description=tc.get("description", ""),
                input=tc.get("input", ""),
                expectedOutput=str(tc.get("expectedOutput", "")),
            )
            for tc in cc.test_cases
        ],
    )


def _arena_author(quest: Quest) -> ArenaRoundAuthor | None:
    """Full arena payload (incl. answer key + explanations) for the teacher review view."""
    ar = quest.arena_round
    if ar is None:
        return None
    return ArenaRoundAuthor(
        intro=ar.intro,
        secondsPerQuestion=ar.seconds_per_question,
        questions=[
            ArenaQuestionAuthor(
                id=q["id"],
                prompt=q.get("prompt", ""),
                options=list(q.get("options", [])),
                answer=int(q.get("answer", 0)),
                explain=str(q.get("explain", "")),
            )
            for q in ar.questions
        ],
    )


def _detail(quest: Quest) -> QuestDetail:
    """Shape a quest into the full preview payload — any status, no student annotations."""
    tiles = [t for t in quest.tiles if not t.is_distractor]
    distractors = [t for t in quest.tiles if t.is_distractor]
    return QuestDetail(
        id=quest.slug,
        order=quest.position,
        node=quest.node_label,
        title=quest.title,
        topic=quest.topic,
        difficulty=quest.difficulty,
        xpReward=quest.xp_reward,
        isBoss=quest.is_boss,
        kind=quest.kind,
        brief=QuestBrief(systemName=quest.brief_system_name or "", story=quest.brief_story or ""),
        prompt=quest.prompt or "",
        tiles=[TileOut(id=t.tile_key, label=t.label, sub=t.sub) for t in tiles],
        distractors=[TileOut(id=t.tile_key, label=t.label, sub=t.sub) for t in distractors],
        linkExplanations={f"{l.from_key}->{l.to_key}": l.explanation for l in quest.links},
        codingFull=_coding_author(quest),
        arenaFull=_arena_author(quest),
        subjectSlug=quest.subject.slug,
        nextQuestSlug=None,
        completed=False,
        cleanBuild=False,
    )


def get_draft_detail(db: Session, slug: str) -> QuestDetail:
    """Full quest payload for teacher preview — any status, no student annotations."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)
    return _detail(quest)


# Maps QuestUpdate (camelCase) fields to their Quest ORM column names.
_SCALAR_COLUMNS = {
    "title": "title",
    "nodeLabel": "node_label",
    "topic": "topic",
    "difficulty": "difficulty",
    "xpReward": "xp_reward",
    "briefSystemName": "brief_system_name",
    "briefStory": "brief_story",
    "prompt": "prompt",
}


def update_draft(db: Session, slug: str, payload: QuestUpdate) -> QuestDetail:
    """Edit an existing quest's display text (any status). Returns the updated payload."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)

    provided = payload.model_dump(exclude_unset=True)
    fields = {
        column: provided[attr]
        for attr, column in _SCALAR_COLUMNS.items()
        if attr in provided
    }

    tile_edits: dict[str, dict] = {}
    for group in ("tiles", "distractors"):
        for t in getattr(payload, group) or []:
            tile_edits[t.id] = {"label": t.label, "sub": t.sub}

    content_crud.update_quest(
        db, quest,
        fields=fields,
        tile_edits=tile_edits or None,
        link_edits=payload.linkExplanations,
    )
    return _detail(quest)


def set_status(db: Session, slug: str, status: str) -> TeacherQuestSummary:
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None:
        raise AppError("Quest not found.", status_code=404)
    content_crud.set_quest_status(db, quest, status)
    tile_count = sum(1 for _ in quest.tiles)
    return _summary(quest, quest.subject, tile_count)
