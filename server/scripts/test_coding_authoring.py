"""End-to-end check for teacher coding-challenge authoring.

Run against the local dev DB (Postgres must be running):
    cd server && ./.venv/Scripts/python.exe scripts/test_coding_authoring.py

Creates a throwaway CODING quest in a throwaway subject, exercises the full
teacher->student loop, then cleans up (quest/subject removed, Alice's XP restored).
Demo data is left untouched.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.levels import level_for_xp
from app.main import app
from app.models.attempt import QuestAttempt
from app.models.content import Quest, Subject
from app.models.user import User

c = TestClient(app)


def login(email: str, pw: str) -> str:
    r = c.post("/api/v1/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


def main() -> None:
    th = {"Authorization": f"Bearer {login('teacher@questigo.dev', 'demo1234')}"}
    sh = {"Authorization": f"Bearer {login('alice@student.dev', 'student123')}"}

    payload = {
        "subject": "ZZ Test Track",
        "title": "ZZ Reverse a String",
        "nodeLabel": "Reverse",
        "difficulty": "EASY",
        "prompt": "Implement solution(s) returning the reversed string.",
        "starterCode": "def solution(s):\n    pass\n",
        "language": "python",
        "testCases": [
            {"description": "reverses hello", "input": "'hello'", "expectedOutput": "olleh"},
            {"description": "empty string", "input": "''", "expectedOutput": ""},
        ],
    }

    r = c.post("/api/v1/teacher/coding-quests", json=payload, headers=th)
    assert r.status_code == 201, r.text
    d = r.json()["data"]
    slug = d["id"]
    assert d["kind"] == "CODING", d
    assert d["codingFull"]["testCases"][0]["id"] == "tc1", d["codingFull"]
    assert d["xpReward"] == 80, d  # EASY default
    print("CREATE ok:", slug, "xp", d["xpReward"], "tests", len(d["codingFull"]["testCases"]))

    # draft is hidden from students
    assert c.get(f"/api/v1/quests/{slug}", headers=sh).status_code == 404
    print("student gating (draft hidden) ok")

    # edit: HARD + xp 250 + a third test
    upd = {k: v for k, v in payload.items() if k != "subject"}
    upd.update(difficulty="HARD", xpReward=250)
    upd["testCases"] = payload["testCases"] + [
        {"description": "single char", "input": "'a'", "expectedOutput": "a"}
    ]
    r = c.put(f"/api/v1/teacher/coding-quests/{slug}", json=upd, headers=th)
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["xpReward"] == 250 and len(d["codingFull"]["testCases"]) == 3, d
    print("UPDATE ok: xp", d["xpReward"], "tests", len(d["codingFull"]["testCases"]))

    # a structural (sequence) edit on a coding quest must 400
    r = c.put(
        f"/api/v1/teacher/quests/{slug}/structure",
        json={"title": "x", "nodeLabel": "x", "difficulty": "EASY",
              "tiles": [{"label": "a"}, {"label": "b"}, {"label": "c"}],
              "distractors": [], "explanations": []},
        headers=th,
    )
    assert r.status_code == 400, (r.status_code, r.text)
    print("structure-edit-on-coding 400 ok")

    assert c.post(f"/api/v1/teacher/quests/{slug}/approve", headers=th).status_code == 200
    print("APPROVE ok")

    # student detail: coding payload present, no input/expected leak, no codingFull
    qd = c.get(f"/api/v1/quests/{slug}", headers=sh).json()["data"]
    assert qd["kind"] == "CODING" and qd["coding"], qd
    tc0 = qd["coding"]["testCases"][0]
    assert "input" not in tc0 and "expectedOutput" not in tc0, ("LEAK!", tc0)
    assert qd.get("codingFull") is None, ("codingFull must not reach students", qd.get("codingFull"))
    print("student detail ok (no leak):", list(tc0.keys()))

    # run correct code -> all pass
    r = c.post(f"/api/v1/student/challenges/{slug}/run",
               json={"code": "def solution(s):\n    return s[::-1]\n"}, headers=sh)
    assert r.status_code == 200 and r.json()["data"]["allPassed"], r.text
    print("RUN allPassed ok")

    # wrong code on complete -> 400
    r = c.post(f"/api/v1/student/quests/{slug}/complete",
               json={"code": "def solution(s):\n    return s\n"}, headers=sh)
    assert r.status_code == 400, (r.status_code, r.text)
    print("complete wrong-code 400 ok")

    db = SessionLocal()
    try:
        xp_before = db.scalar(select(User).where(User.email == "alice@student.dev")).xp
    finally:
        db.close()

    # correct complete -> XP awarded (HARD 250 + clean bonus 30)
    r = c.post(f"/api/v1/student/quests/{slug}/complete",
               json={"code": "def solution(s):\n    return s[::-1]\n", "clean": True}, headers=sh)
    assert r.status_code == 200, r.text
    cr = r.json()["data"]
    assert cr["xpAwarded"] == 280, cr
    print("COMPLETE ok: xpAwarded", cr["xpAwarded"], "newLevel", cr["newLevel"])

    # cleanup: drop the throwaway quest/subject + restore Alice's XP/level
    db = SessionLocal()
    try:
        q = db.scalar(select(Quest).where(Quest.slug == slug))
        db.query(QuestAttempt).filter(QuestAttempt.quest_id == q.id).delete()
        db.delete(q)  # cascades coding_challenge
        subj = db.scalar(select(Subject).where(Subject.slug == "zz-test-track"))
        if subj and not subj.quests:
            db.delete(subj)
        u = db.scalar(select(User).where(User.email == "alice@student.dev"))
        u.xp = xp_before
        u.level = level_for_xp(xp_before)
        db.commit()
        print("CLEANUP ok: Alice xp restored to", xp_before)
    finally:
        db.close()

    print("\nALL PASSED")


if __name__ == "__main__":
    main()
