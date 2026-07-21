"""Database access for subjects, quests, and quest attempts."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.attempt import QuestAttempt
from app.models.content import ArenaRound, CodingChallenge, Quest, QuestLink, QuestTile, Subject

PUBLISHED = "PUBLISHED"


def list_subjects(db: Session) -> list[Subject]:
    return list(
        db.scalars(
            select(Subject).order_by(Subject.position).options(selectinload(Subject.quests))
        )
    )


def get_subject_by_slug(db: Session, slug: str) -> Subject | None:
    return db.scalar(
        select(Subject).where(Subject.slug == slug).options(selectinload(Subject.quests))
    )


def get_quest_by_slug(db: Session, slug: str) -> Quest | None:
    return db.scalar(
        select(Quest)
        .where(Quest.slug == slug)
        .options(
            selectinload(Quest.tiles),
            selectinload(Quest.links),
            selectinload(Quest.coding_challenge),
            selectinload(Quest.arena_round),
        )
    )


def next_quest_in_subject(db: Session, subject_id: uuid.UUID, position: int) -> Quest | None:
    """Next PUBLISHED quest after `position` — drafts never appear in the student flow."""
    return db.scalar(
        select(Quest)
        .where(
            Quest.subject_id == subject_id,
            Quest.position > position,
            Quest.status == PUBLISHED,
        )
        .order_by(Quest.position)
        .limit(1)
    )


def get_or_create_subject(db: Session, *, slug: str, title: str) -> Subject:
    """Find a subject by slug, or create a new track. Caller commits."""
    subject = db.scalar(select(Subject).where(Subject.slug == slug))
    if subject is None:
        position = db.scalar(select(func.coalesce(func.max(Subject.position), 0))) + 1
        subject = Subject(slug=slug, title=title, position=position)
        db.add(subject)
        db.flush()
    return subject


def slug_exists(db: Session, slug: str) -> bool:
    return db.scalar(select(Quest.id).where(Quest.slug == slug)) is not None


def next_quest_position(db: Session, subject_id: uuid.UUID) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(Quest.position), 0)).where(Quest.subject_id == subject_id)
    )
    return int(current) + 1


def create_quest_draft(
    db: Session,
    *,
    subject: Subject,
    slug: str,
    position: int,
    node_label: str,
    title: str,
    topic: str | None,
    difficulty: str,
    xp_reward: int,
    brief_system_name: str | None,
    brief_story: str | None,
    prompt: str | None,
    created_by: uuid.UUID | None,
    source_name: str | None,
    tiles: list[dict],
    distractors: list[dict],
    links: list[dict],
) -> Quest:
    """Persist a quest (status PENDING_TEACHER_REVIEW) with its tiles + links. Caller commits."""
    quest = Quest(
        subject_id=subject.id,
        slug=slug,
        position=position,
        node_label=node_label,
        title=title,
        topic=topic,
        difficulty=difficulty,
        xp_reward=xp_reward,
        is_boss=False,
        brief_system_name=brief_system_name,
        brief_story=brief_story,
        prompt=prompt,
        status="PENDING_TEACHER_REVIEW",
        created_by=created_by,
        source_name=source_name,
    )
    db.add(quest)
    db.flush()  # assign quest.id

    for pos, t in enumerate(tiles):
        db.add(QuestTile(quest_id=quest.id, tile_key=t["id"], label=t["label"], sub=t.get("sub"),
                         position=pos, is_distractor=False))
    for pos, t in enumerate(distractors):
        db.add(QuestTile(quest_id=quest.id, tile_key=t["id"], label=t["label"], sub=t.get("sub"),
                         position=pos, is_distractor=True))
    for link in links:
        db.add(QuestLink(quest_id=quest.id, from_key=link["from"], to_key=link["to"],
                         explanation=link["explanation"]))
    return quest


def create_coding_quest_draft(
    db: Session,
    *,
    subject: Subject,
    slug: str,
    position: int,
    node_label: str,
    title: str,
    topic: str | None,
    difficulty: str,
    xp_reward: int,
    brief_system_name: str | None,
    brief_story: str | None,
    prompt: str | None,
    created_by: uuid.UUID | None,
    coding_prompt: str,
    starter_code: str,
    language: str,
    test_cases: list[dict],
    source_name: str | None = None,
) -> Quest:
    """Persist a CODING quest (status PENDING_TEACHER_REVIEW) + its challenge. Caller commits."""
    quest = Quest(
        subject_id=subject.id,
        slug=slug,
        position=position,
        node_label=node_label,
        title=title,
        topic=topic,
        difficulty=difficulty,
        xp_reward=xp_reward,
        is_boss=False,
        kind="CODING",
        brief_system_name=brief_system_name,
        brief_story=brief_story,
        prompt=prompt,
        status="PENDING_TEACHER_REVIEW",
        created_by=created_by,
        source_name=source_name,
    )
    db.add(quest)
    db.flush()  # assign quest.id
    db.add(CodingChallenge(
        quest_id=quest.id, prompt=coding_prompt, starter_code=starter_code,
        language=language, test_cases=test_cases,
    ))
    return quest


def create_arena_quest_draft(
    db: Session,
    *,
    subject: Subject,
    slug: str,
    position: int,
    node_label: str,
    title: str,
    topic: str | None,
    difficulty: str,
    xp_reward: int,
    brief_system_name: str | None,
    brief_story: str | None,
    prompt: str | None,
    created_by: uuid.UUID | None,
    intro: str,
    seconds_per_question: int,
    questions: list[dict],
    source_name: str | None = None,
) -> Quest:
    """Persist an ARENA quest (status PENDING_TEACHER_REVIEW) + its round. Caller commits."""
    quest = Quest(
        subject_id=subject.id,
        slug=slug,
        position=position,
        node_label=node_label,
        title=title,
        topic=topic,
        difficulty=difficulty,
        xp_reward=xp_reward,
        is_boss=False,
        kind="ARENA",
        brief_system_name=brief_system_name,
        brief_story=brief_story,
        prompt=prompt,
        status="PENDING_TEACHER_REVIEW",
        created_by=created_by,
        source_name=source_name,
    )
    db.add(quest)
    db.flush()  # assign quest.id
    db.add(ArenaRound(
        quest_id=quest.id, intro=intro, seconds_per_question=seconds_per_question,
        questions=questions,
    ))
    return quest


def replace_arena_round(
    db: Session,
    quest: Quest,
    *,
    fields: dict,
    intro: str,
    seconds_per_question: int,
    questions: list[dict],
) -> Quest:
    """Apply scalar field updates and replace the quest's arena round in full."""
    for column, value in fields.items():
        setattr(quest, column, value)

    ar = quest.arena_round
    if ar is None:
        ar = ArenaRound(quest_id=quest.id)
        db.add(ar)
    ar.intro = intro
    ar.seconds_per_question = seconds_per_question
    ar.questions = questions

    db.commit()
    db.refresh(quest)
    return quest


def replace_coding_challenge(
    db: Session,
    quest: Quest,
    *,
    fields: dict,
    coding_prompt: str,
    starter_code: str,
    language: str,
    test_cases: list[dict],
) -> Quest:
    """Apply scalar field updates and replace the quest's coding challenge in full."""
    for column, value in fields.items():
        setattr(quest, column, value)

    cc = quest.coding_challenge
    if cc is None:
        cc = CodingChallenge(quest_id=quest.id)
        db.add(cc)
    cc.prompt = coding_prompt
    cc.starter_code = starter_code
    cc.language = language
    cc.test_cases = test_cases

    db.commit()
    db.refresh(quest)
    return quest


def list_quests(db: Session, status: str | None = None) -> list[tuple[Quest, Subject, int]]:
    """Quests joined with their subject and tile count, newest first. Optional status filter."""
    tile_count = (
        select(QuestTile.quest_id, func.count().label("n"))
        .group_by(QuestTile.quest_id)
        .subquery()
    )
    stmt = (
        select(Quest, Subject, func.coalesce(tile_count.c.n, 0))
        .join(Subject, Subject.id == Quest.subject_id)
        .join(tile_count, tile_count.c.quest_id == Quest.id, isouter=True)
        .order_by(Quest.created_at.desc())
    )
    if status:
        stmt = stmt.where(Quest.status == status)
    rows = db.execute(stmt).all()
    return [(r[0], r[1], int(r[2])) for r in rows]


def update_quest(
    db: Session,
    quest: Quest,
    *,
    fields: dict,
    tile_edits: dict[str, dict] | None = None,
    link_edits: dict[str, str] | None = None,
) -> Quest:
    """Apply scalar field updates plus optional tile-text / link-explanation edits.

    `tile_edits` maps tile_key -> {"label", "sub"} (covers both tiles and distractors).
    `link_edits` maps "from->to" -> explanation. Unknown keys are ignored.
    """
    for column, value in fields.items():
        setattr(quest, column, value)

    if tile_edits:
        for tile in quest.tiles:
            edit = tile_edits.get(tile.tile_key)
            if edit is not None:
                tile.label = edit["label"]
                tile.sub = edit.get("sub")

    if link_edits:
        for link in quest.links:
            key = f"{link.from_key}->{link.to_key}"
            if key in link_edits:
                link.explanation = link_edits[key]

    db.commit()
    db.refresh(quest)
    return quest


def replace_quest_structure(
    db: Session,
    quest: Quest,
    *,
    fields: dict,
    tiles: list[dict],
    distractors: list[dict],
    links: list[dict],
) -> Quest:
    """Apply scalar field updates and fully replace the quest's tiles + links.

    Used by structural editing (add/remove/reorder). Tile keys are caller-assigned
    by position (e.g. s1..sN, d1..dM), so old keys/links are dropped wholesale.
    """
    for column, value in fields.items():
        setattr(quest, column, value)

    db.query(QuestTile).filter(QuestTile.quest_id == quest.id).delete(synchronize_session=False)
    db.query(QuestLink).filter(QuestLink.quest_id == quest.id).delete(synchronize_session=False)
    db.flush()

    for pos, t in enumerate(tiles):
        db.add(QuestTile(quest_id=quest.id, tile_key=t["id"], label=t["label"], sub=t.get("sub"),
                         position=pos, is_distractor=False))
    for pos, t in enumerate(distractors):
        db.add(QuestTile(quest_id=quest.id, tile_key=t["id"], label=t["label"], sub=t.get("sub"),
                         position=pos, is_distractor=True))
    for link in links:
        db.add(QuestLink(quest_id=quest.id, from_key=link["from"], to_key=link["to"],
                         explanation=link["explanation"]))

    db.commit()
    db.refresh(quest)
    return quest


def set_quest_status(db: Session, quest: Quest, status: str) -> Quest:
    quest.status = status
    db.commit()
    db.refresh(quest)
    return quest


def attempts_for_user(db: Session, user_id: uuid.UUID) -> dict[uuid.UUID, QuestAttempt]:
    """Map of quest_id -> attempt for the given user."""
    rows = db.scalars(select(QuestAttempt).where(QuestAttempt.user_id == user_id))
    return {a.quest_id: a for a in rows}


def completed_counts(db: Session) -> dict[uuid.UUID, int]:
    """Map of user_id -> number of COMPLETED quest attempts (for the teacher roster)."""
    rows = db.execute(
        select(QuestAttempt.user_id, func.count())
        .where(QuestAttempt.status == "COMPLETED")
        .group_by(QuestAttempt.user_id)
    ).all()
    return {r[0]: int(r[1]) for r in rows}


def completed_quests_for_user(db: Session, user_id: uuid.UUID) -> list[tuple[QuestAttempt, Quest, Subject]]:
    """Completed attempts joined with their quest + subject, newest completion first."""
    rows = db.execute(
        select(QuestAttempt, Quest, Subject)
        .join(Quest, Quest.id == QuestAttempt.quest_id)
        .join(Subject, Subject.id == Quest.subject_id)
        .where(QuestAttempt.user_id == user_id, QuestAttempt.status == "COMPLETED")
        .order_by(QuestAttempt.completed_at.desc().nullslast())
    ).all()
    return [(r[0], r[1], r[2]) for r in rows]


def get_attempt(db: Session, user_id: uuid.UUID, quest_id: uuid.UUID) -> QuestAttempt | None:
    return db.scalar(
        select(QuestAttempt).where(
            QuestAttempt.user_id == user_id, QuestAttempt.quest_id == quest_id
        )
    )


def complete_attempt(db: Session, user_id: uuid.UUID, quest_id: uuid.UUID, clean: bool) -> QuestAttempt:
    """Create or update the attempt as COMPLETED. clean is sticky (once clean, stays clean)."""
    attempt = get_attempt(db, user_id, quest_id)
    if attempt is None:
        attempt = QuestAttempt(user_id=user_id, quest_id=quest_id)
        db.add(attempt)
    attempt.status = "COMPLETED"
    attempt.clean_build = attempt.clean_build or clean
    if attempt.completed_at is None:
        attempt.completed_at = datetime.now(timezone.utc)
    return attempt
