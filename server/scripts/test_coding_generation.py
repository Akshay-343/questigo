"""End-to-end check for AI/stub generation of CODING quests.

Run against the local dev DB (Postgres must be running):
    cd server && ./.venv/Scripts/python.exe scripts/test_coding_generation.py

Part 1 (deterministic): forces the offline stub and generates CODING quests, then
confirms the seeded test cases are self-consistent (a correct `solution` passes the
stored cases via the real runner).
Part 2 (only if AI_API_KEY is set): a live generation probe — checks structure and
that reference-computed expected outputs are populated.

Both parts create throwaway subjects/quests and delete them afterward.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.content import Quest, Subject
from app.models.user import User
from app.services import code_runner, generation_service

SOURCE = (
    "Aggregation in databases combines many rows into a single value. The SUM "
    "aggregate adds up a column of integers. Implement and test such routines."
)


def _cleanup(db, subject_slug: str) -> None:
    subj = db.scalar(select(Subject).where(Subject.slug == subject_slug))
    if subj is None:
        return
    for q in list(subj.quests):
        db.delete(q)  # cascades coding_challenge
    db.flush()
    db.refresh(subj)
    if not subj.quests:
        db.delete(subj)
    db.commit()


def run_stub_part(db, teacher) -> None:
    original_key = settings.ai_api_key
    settings.ai_api_key = ""  # force the offline stub
    try:
        assert not settings.ai_enabled
        quests = generation_service.generate_quests(
            db, teacher, subject_title="ZZ Gen Stub", source_text=SOURCE,
            source_name="probe.txt", count=2, kind="CODING",
        )
        assert len(quests) == 2, len(quests)
        for q in quests:
            assert q.kind == "CODING", q.kind
            assert q.status == "PENDING_TEACHER_REVIEW", q.status
            cc = q.coding_challenge
            assert cc is not None and len(cc.test_cases) >= 1, cc
            # the stub is a 'sum a list' challenge — a correct solution must pass every stored case
            results, all_passed, error = code_runner.run_tests(
                "python", "def solution(nums):\n    return sum(nums)\n", cc.test_cases
            )
            assert all_passed and not error, ("stub tests not self-consistent", error,
                                              [(r.id, r.actual, r.expected) for r in results])
        print(f"STUB ok: {len(quests)} CODING quests, test cases self-consistent")
    finally:
        settings.ai_api_key = original_key
        _cleanup(db, "zz-gen-stub")
        print("STUB cleanup ok")


def run_live_part(db, teacher) -> None:
    if not settings.ai_enabled:
        print("LIVE skipped: no AI_API_KEY set")
        return
    try:
        quests = generation_service.generate_quests(
            db, teacher, subject_title="ZZ Gen Live", source_text=SOURCE,
            source_name="probe.txt", count=1, kind="CODING",
        )
        assert quests, "no quests generated"
        for q in quests:
            cc = q.coding_challenge
            assert q.kind == "CODING" and cc and cc.test_cases, q
            assert all(tc.get("expectedOutput", "") != "" for tc in cc.test_cases), \
                ("some expected outputs empty", cc.test_cases)
            print(f"LIVE ok ({settings.ai_provider}): '{q.title}' "
                  f"with {len(cc.test_cases)} test cases, all expected populated")
    finally:
        _cleanup(db, "zz-gen-live")
        print("LIVE cleanup ok")


def main() -> None:
    db = SessionLocal()
    try:
        teacher = db.scalar(select(User).where(User.email == "teacher@questigo.dev"))
        assert teacher is not None, "seed teacher missing"
        run_stub_part(db, teacher)
        run_live_part(db, teacher)
    finally:
        db.close()
    print("\nALL PASSED")


if __name__ == "__main__":
    main()
