"""Business logic for subjects, quests, and quest completion."""
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.crud import content as content_crud
from app.crud import user as user_crud
from app.models.content import Quest
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.coding import (
    CodingChallengeOut,
    CodingTestCaseOut,
    RunResponse,
)
from app.schemas.arena import (
    ArenaAnswerResponse,
    ArenaQuestionOut,
    ArenaRoundOut,
)
from app.schemas.content import (
    CompleteQuestRequest,
    CompleteQuestResponse,
    QuestBrief,
    QuestDetail,
    QuestSummary,
    SubjectOut,
    SubjectWithQuests,
    TileOut,
)
from app.services import achievement_service, arena_service, code_runner

CLEAN_BUILD_BONUS = 30


def list_subjects(db: Session, user: User) -> list[SubjectOut]:
    """Subjects that have at least one PUBLISHED quest, annotated with the
    student's progress (so the dashboard/index can show per-track completion)."""
    attempts = content_crud.attempts_for_user(db, user.id)
    out: list[SubjectOut] = []
    for s in content_crud.list_subjects(db):
        published = [q for q in s.quests if q.status == "PUBLISHED"]
        if not published:
            continue  # hide tracks with nothing live for students yet
        completed = sum(1 for q in published if _is_completed(attempts.get(q.id)))
        out.append(
            SubjectOut(
                id=s.slug,
                title=s.title,
                subtitle=s.subtitle,
                description=s.description,
                questCount=len(published),
                completedCount=completed,
            )
        )
    return out


def get_subject_with_quests(db: Session, slug: str, user: User) -> SubjectWithQuests:
    subject = content_crud.get_subject_by_slug(db, slug)
    if subject is None:
        raise AppError("Subject not found.", status_code=404)

    attempts = content_crud.attempts_for_user(db, user.id)
    quests = [
        QuestSummary(
            id=q.slug,
            order=q.position,
            node=q.node_label,
            title=q.title,
            topic=q.topic,
            difficulty=q.difficulty,
            xpReward=q.xp_reward,
            isBoss=q.is_boss,
            kind=q.kind,
            completed=_is_completed(attempts.get(q.id)),
            cleanBuild=bool(attempts.get(q.id) and attempts[q.id].clean_build),
        )
        for q in subject.quests
        if q.status == "PUBLISHED"  # drafts/rejected never reach students
    ]
    return SubjectWithQuests(
        id=subject.slug,
        title=subject.title,
        subtitle=subject.subtitle,
        description=subject.description,
        quests=quests,
    )


def get_quest_detail(db: Session, slug: str, user: User) -> QuestDetail:
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None or quest.status != "PUBLISHED":
        raise AppError("Quest not found.", status_code=404)

    attempt = content_crud.get_attempt(db, user.id, quest.id)
    nxt = content_crud.next_quest_in_subject(db, quest.subject_id, quest.position)

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
        coding=_coding_out(quest),
        arena=_arena_out(quest),
        subjectSlug=quest.subject.slug,
        nextQuestSlug=nxt.slug if nxt else None,
        completed=_is_completed(attempt),
        cleanBuild=bool(attempt and attempt.clean_build),
    )


def _coding_out(quest: Quest) -> CodingChallengeOut | None:
    """Public coding payload — test descriptions only (inputs/expected stay server-side)."""
    cc = quest.coding_challenge
    if cc is None:
        return None
    return CodingChallengeOut(
        prompt=cc.prompt,
        starterCode=cc.starter_code,
        language=cc.language,
        testCases=[
            CodingTestCaseOut(id=tc["id"], description=tc.get("description", ""))
            for tc in cc.test_cases
        ],
    )


def _arena_out(quest: Quest) -> ArenaRoundOut | None:
    """Public arena payload — the answer key and explanations stay server-side."""
    ar = quest.arena_round
    if ar is None:
        return None
    return ArenaRoundOut(
        intro=ar.intro,
        secondsPerQuestion=ar.seconds_per_question,
        questions=[
            ArenaQuestionOut(id=q["id"], prompt=q["prompt"], options=list(q.get("options", [])))
            for q in ar.questions
        ],
    )


def answer_arena(db: Session, user: User, slug: str, question_id: str, choice: int) -> ArenaAnswerResponse:
    """Grade a single arena question mid-run so the UI can react instantly.

    Returns the key for this question only — the rest of the round stays hidden.
    Awards nothing; XP is settled by `complete_quest`, which re-grades the run.
    """
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None or quest.status != "PUBLISHED" or quest.kind != "ARENA":
        raise AppError("Arena round not found.", status_code=404)
    ar = quest.arena_round
    if ar is None:
        raise AppError("This quest has no arena round.", status_code=404)

    question = arena_service.find_question(ar.questions, question_id)
    if question is None:
        raise AppError("Unknown question.", status_code=400)

    return ArenaAnswerResponse(
        correct=arena_service.grade_one(question, choice),
        answer=int(question.get("answer", -1)),
        explain=str(question.get("explain", "")),
    )


def run_challenge(db: Session, user: User, slug: str, code: str) -> RunResponse:
    """Dry run: execute the student's code against the challenge's test cases. No XP, no attempt."""
    quest = content_crud.get_quest_by_slug(db, slug)
    if quest is None or quest.status != "PUBLISHED" or quest.kind != "CODING":
        raise AppError("Coding challenge not found.", status_code=404)
    cc = quest.coding_challenge
    if cc is None:
        raise AppError("This quest has no coding challenge.", status_code=404)

    results, all_passed, error = code_runner.run_tests(cc.language, code, cc.test_cases)
    return RunResponse(results=results, allPassed=all_passed, error=error)


def complete_quest(db: Session, user: User, slug: str, payload: CompleteQuestRequest) -> CompleteQuestResponse:
    quest: Quest | None = content_crud.get_quest_by_slug(db, slug)
    if quest is None or quest.status != "PUBLISHED":
        raise AppError("Quest not found.", status_code=404)

    # CODING quests are re-verified server-side before any XP is awarded (anti-spoof).
    if quest.kind == "CODING":
        cc = quest.coding_challenge
        if cc is None:
            raise AppError("This quest has no coding challenge.", status_code=404)
        if not payload.code or not payload.code.strip():
            raise AppError("Submit your code to complete this challenge.", status_code=400)
        _, all_passed, error = code_runner.run_tests(cc.language, payload.code, cc.test_cases)
        if not all_passed:
            raise AppError(error or "Your code did not pass every test case.", status_code=400)

    # ARENA quests re-grade the whole submitted run server-side (anti-spoof).
    # `clean` is recomputed here too, so a perfect-run bonus can't be claimed by
    # a client that simply asks for one.
    if quest.kind == "ARENA":
        ar = quest.arena_round
        if ar is None or not ar.questions:
            raise AppError("This quest has no arena round.", status_code=404)
        answers = arena_service.parse_answers(payload.code)
        if answers is None:
            raise AppError("Submit your answers to finish the round.", status_code=400)
        _correct, _total, passed, clean = arena_service.grade_submission(ar.questions, answers)
        if not passed:
            raise AppError("You ran out of hearts — start the round again.", status_code=400)
        payload.clean = clean

    existing = content_crud.get_attempt(db, user.id, quest.id)
    already_completed = _is_completed(existing)
    level_before = user.level

    # XP (with clean-build bonus) is awarded only on the first completion.
    award = 0 if already_completed else quest.xp_reward + (CLEAN_BUILD_BONUS if payload.clean else 0)

    content_crud.complete_attempt(db, user.id, quest.id, payload.clean)

    if award > 0:
        user_crud.add_xp(db, user, award)  # commits + refreshes user
    else:
        db.commit()
        db.refresh(user)

    # The attempt + XP are now persisted, so achievement predicates see fresh state.
    # Runs even when already completed so it back-fills achievements earned earlier.
    newly_unlocked = achievement_service.check_and_unlock(db, user)

    return CompleteQuestResponse(
        user=UserOut.model_validate(user),
        xpAwarded=award,
        alreadyCompleted=already_completed,
        leveledUp=user.level > level_before,
        newLevel=user.level,
        unlockedAchievements=[achievement_service.to_out(a) for a in newly_unlocked],
    )


def _is_completed(attempt) -> bool:
    return attempt is not None and attempt.status == "COMPLETED"
