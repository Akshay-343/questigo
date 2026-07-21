"""AI quest generation: PDF/text -> quest drafts (sequence, coding, or arena).

Generated quests land as PENDING_TEACHER_REVIEW; a teacher approves them before
students see them. Uses the configured LLM (Groq/OpenAI) when AI_API_KEY is set,
otherwise a deterministic offline stub so the demo always works.
"""
import io
import re
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.models.content import Quest
from app.models.user import User
from app.services import code_runner, llm_client

MAX_SOURCE_CHARS = 12000
XP_BY_DIFFICULTY = {"EASY": 80, "MEDIUM": 120, "HARD": 180}
# Countdown per arena question - harder rounds ask more of each read.
SECONDS_BY_DIFFICULTY = {"EASY": 15, "MEDIUM": 20, "HARD": 25}
DEFAULT_STARTER = "def solution(value):\n    # implement me\n    pass\n"

_SYSTEM_PROMPT = (
    "You are an instructional designer building 'Sequence Builder' quests for a "
    "gamified CS learning app. A Sequence Builder quest asks a student to arrange "
    "process steps into the correct order. From the provided study material, produce "
    "quests as STRICT JSON only, matching this schema exactly:\n"
    '{"quests": [{'
    '"title": str, '
    '"nodeLabel": str (<=40 chars, short skill-tree label), '
    '"topic": str, '
    '"difficulty": "EASY"|"MEDIUM"|"HARD", '
    '"brief": {"systemName": str, "story": str (1-2 sentence framing)}, '
    '"prompt": str (the task instruction), '
    '"tiles": [{"id": str, "label": str, "sub": str}]  (4-6 tiles, IN CORRECT ORDER), '
    '"distractors": [{"id": str, "label": str, "sub": str}] (1-3 plausible wrong steps), '
    '"linkExplanations": {"<fromId>-><toId>": str}  (one entry per consecutive correct pair, '
    "explaining why that step precedes the next)"
    "}]}\n"
    "Rules: tile ids are short slugs unique within a quest (e.g. 's1','s2'). "
    "linkExplanations keys MUST reference consecutive tile ids in order. "
    "Keep labels concise. Output ONLY the JSON object."
)

_CODING_SYSTEM_PROMPT = (
    "You are an instructional designer building 'Coding Challenge' quests for a "
    "gamified CS learning app. Each quest asks a student to implement a single "
    "Python function named `solution`. From the provided study material, produce "
    "coding challenges as STRICT JSON only, matching this schema exactly:\n"
    '{"quests": [{'
    '"title": str, '
    '"nodeLabel": str (<=40 chars, short skill-tree label), '
    '"topic": str, '
    '"difficulty": "EASY"|"MEDIUM"|"HARD", '
    '"brief": {"systemName": str, "story": str (1-2 sentence framing)}, '
    '"prompt": str (describe the task; state what solution(...) receives and returns; include a worked example), '
    '"starterCode": str (Python defining `def solution(...):` with a short comment and a pass body), '
    '"referenceSolution": str (Python: a CORRECT implementation of `def solution(...)`, used only to compute '
    "expected outputs — never shown to students), "
    '"testCases": [{"description": str, "input": str, "expectedOutput": str}]  (4-6 cases)'
    "}]}\n"
    "Rules: the function MUST be named `solution`. Each `input` is the literal argument "
    'expression passed to solution(...) — e.g. "[3, 1, 2]" or "\\"hello\\"" or, for '
    'multiple args, "2, 3". Outputs are compared as strings via str(result). Make '
    "referenceSolution and testCases mutually consistent. Base the challenge on the "
    "study material's concepts. Output ONLY the JSON object."
)


_ARENA_SYSTEM_PROMPT = (
    "You are an instructional designer building 'Rapid Arena' rounds for a gamified "
    "CS learning app. An arena round is a fast multiple-choice run: the student sees "
    "one question at a time against a countdown, keeping a streak alive. From the "
    "provided study material, produce rounds as STRICT JSON only, matching this "
    "schema exactly:\n"
    '{"rounds": [{'
    '"title": str, '
    '"nodeLabel": str (<=40 chars, short skill-tree label), '
    '"topic": str, '
    '"difficulty": "EASY"|"MEDIUM"|"HARD", '
    '"brief": {"systemName": str, "story": str (1-2 sentence framing)}, '
    '"intro": str (one line of hype shown on the countdown before question 1), '
    '"questions": [{'
    '"prompt": str (the question), '
    '"options": [str, str, str, str] (exactly 4 choices, all plausible), '
    '"answer": int (0-based index of the correct choice), '
    '"explain": str (one sentence on why that answer is right)'
    "}]  (exactly 6 questions, ORDERED easy->hard)"
    "}]}\n"
    "Rules: every question MUST be answerable from the study material and have exactly "
    "one defensible correct option. Keep prompts under 140 characters and options short "
    "enough to read in a few seconds - this is a timed game. Vary which index is correct; "
    "do not always use 0. Wrong options should be plausible misconceptions, not filler. "
    "Output ONLY the JSON object."
)


def extract_pdf_text(data: bytes) -> str:
    """Extract text from a PDF byte stream. Raises AppError on unreadable files."""
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as exc:
        raise AppError(f"Could not read the PDF: {exc}", status_code=400)
    text = text.strip()
    if not text:
        raise AppError("No extractable text found in the PDF (is it a scanned image?).", status_code=400)
    return text


def slugify(value: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return s or "item"


def generate_quests(
    db: Session,
    teacher: User,
    *,
    subject_title: str,
    source_text: str,
    source_name: str | None,
    count: int = 2,
    kind: str = "SEQUENCE",
) -> list[Quest]:
    """Generate `count` quest drafts from source material and persist them as PENDING.

    `kind` selects the quest type: "SEQUENCE" (ordered steps), "CODING" (implement a
    Python `solution`), or "ARENA" (timed multiple choice). All land as
    PENDING_TEACHER_REVIEW for the teacher to approve.
    """
    subject_title = subject_title.strip()
    if not subject_title:
        raise AppError("A subject title is required.", status_code=400)
    source_text = (source_text or "").strip()
    if len(source_text) < 30:
        raise AppError("Source material is too short to generate quests from.", status_code=400)

    count = max(1, min(count, 4))
    snippet = source_text[:MAX_SOURCE_CHARS]

    if kind == "CODING":
        return _generate_coding_quests(db, teacher, subject_title, snippet, source_name, count)

    if kind == "ARENA":
        return _generate_arena_quests(db, teacher, subject_title, snippet, source_name, count)

    if settings.ai_enabled:
        raw = llm_client.generate_json(
            _SYSTEM_PROMPT,
            f"Subject: {subject_title}\nGenerate {count} quest(s).\n\nStudy material:\n{snippet}",
        )
        quests_data = raw.get("quests") if isinstance(raw, dict) else None
        if not isinstance(quests_data, list) or not quests_data:
            raise AppError("AI did not return any quests.", status_code=502)
    else:
        quests_data = _stub_quests(subject_title, snippet, count)

    from app.crud import content as content_crud

    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)

    created: list[Quest] = []
    for data in quests_data[:count]:
        tiles, distractors, links, meta = _normalize_quest(data)
        slug = _unique_slug(db, content_crud, meta["title"])
        position = content_crud.next_quest_position(db, subject.id)
        quest = content_crud.create_quest_draft(
            db,
            subject=subject,
            slug=slug,
            position=position,
            node_label=meta["nodeLabel"],
            title=meta["title"],
            topic=meta["topic"],
            difficulty=meta["difficulty"],
            xp_reward=XP_BY_DIFFICULTY[meta["difficulty"]],
            brief_system_name=meta["systemName"],
            brief_story=meta["story"],
            prompt=meta["prompt"],
            created_by=teacher.id,
            source_name=source_name,
            tiles=tiles,
            distractors=distractors,
            links=links,
        )
        created.append(quest)

    db.commit()
    for q in created:
        db.refresh(q)
    return created


def _generate_coding_quests(
    db: Session,
    teacher: User,
    subject_title: str,
    snippet: str,
    source_name: str | None,
    count: int,
) -> list[Quest]:
    """AI (or stub) coding-challenge generation: persist `count` CODING drafts."""
    if settings.ai_enabled:
        raw = llm_client.generate_json(
            _CODING_SYSTEM_PROMPT,
            f"Subject: {subject_title}\nGenerate {count} coding challenge(s).\n\nStudy material:\n{snippet}",
        )
        quests_data = raw.get("quests") if isinstance(raw, dict) else None
        if not isinstance(quests_data, list) or not quests_data:
            raise AppError("AI did not return any coding challenges.", status_code=502)
    else:
        quests_data = _stub_coding_quests(subject_title, count)

    from app.crud import content as content_crud

    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)

    created: list[Quest] = []
    for data in quests_data[:count]:
        meta, test_cases = _normalize_coding_quest(data)
        slug = _unique_slug(db, content_crud, meta["title"])
        position = content_crud.next_quest_position(db, subject.id)
        quest = content_crud.create_coding_quest_draft(
            db,
            subject=subject,
            slug=slug,
            position=position,
            node_label=meta["nodeLabel"],
            title=meta["title"],
            topic=meta["topic"],
            difficulty=meta["difficulty"],
            xp_reward=XP_BY_DIFFICULTY[meta["difficulty"]],
            brief_system_name=meta["systemName"],
            brief_story=meta["story"],
            prompt=meta["prompt"],
            created_by=teacher.id,
            coding_prompt=meta["prompt"],
            starter_code=meta["starterCode"],
            language="python",
            test_cases=test_cases,
            source_name=source_name,
        )
        created.append(quest)

    db.commit()
    for q in created:
        db.refresh(q)
    return created


def _generate_arena_quests(
    db: Session,
    teacher: User,
    subject_title: str,
    snippet: str,
    source_name: str | None,
    count: int,
) -> list[Quest]:
    """AI (or stub) arena generation: persist `count` ARENA drafts."""
    if settings.ai_enabled:
        raw = llm_client.generate_json(
            _ARENA_SYSTEM_PROMPT,
            f"Subject: {subject_title}\nGenerate {count} arena round(s).\n\nStudy material:\n{snippet}",
        )
        rounds_data = raw.get("rounds") if isinstance(raw, dict) else None
        if not isinstance(rounds_data, list) or not rounds_data:
            raise AppError("AI did not return any arena rounds.", status_code=502)
    else:
        rounds_data = _stub_arena_rounds(subject_title, count)

    from app.crud import content as content_crud

    subject = content_crud.get_or_create_subject(db, slug=slugify(subject_title), title=subject_title)

    created: list[Quest] = []
    errors: list[str] = []
    for data in rounds_data[:count]:
        try:
            meta, questions = _normalize_arena_round(data)
        except AppError as e:
            errors.append(str(getattr(e, "detail", e)))
            continue
        slug = _unique_slug(db, content_crud, meta["title"])
        position = content_crud.next_quest_position(db, subject.id)
        quest = content_crud.create_arena_quest_draft(
            db,
            subject=subject,
            slug=slug,
            position=position,
            node_label=meta["nodeLabel"],
            title=meta["title"],
            topic=meta["topic"],
            difficulty=meta["difficulty"],
            xp_reward=XP_BY_DIFFICULTY[meta["difficulty"]],
            brief_system_name=meta["systemName"],
            brief_story=meta["story"],
            prompt=meta["prompt"],
            created_by=teacher.id,
            intro=meta["intro"],
            seconds_per_question=meta["secondsPerQuestion"],
            questions=questions,
            source_name=source_name,
        )
        created.append(quest)

    if not created:
        detail = "; ".join(errors) if errors else "no valid rounds produced"
        raise AppError(f"AI could not produce a playable arena round ({detail}).", status_code=502)

    db.commit()
    for q in created:
        db.refresh(q)
    return created


def _normalize_arena_round(data: dict) -> tuple[dict, list[dict]]:
    """Validate + coerce one model-produced arena round into DB-ready structures.

    Drops any question that isn't playable (blank prompt, too few options, answer
    index out of range) and rejects the round if too few survive. Question ids are
    assigned q1..qN.
    """
    if not isinstance(data, dict):
        raise AppError("AI returned an invalid arena round.", status_code=502)

    questions: list[dict] = []
    for q in data.get("questions") or []:
        if not isinstance(q, dict):
            continue
        prompt = str(q.get("prompt") or "").strip()
        options = [str(o).strip() for o in (q.get("options") or []) if str(o).strip()]
        if not prompt or len(options) < 2:
            continue
        try:
            answer = int(q.get("answer"))
        except (TypeError, ValueError):
            continue
        if not 0 <= answer < len(options):
            continue
        questions.append({
            "id": f"q{len(questions) + 1}",
            "prompt": prompt[:500],
            "options": [o[:200] for o in options[:6]],
            "answer": answer,
            "explain": str(q.get("explain") or "")[:400],
        })

    if len(questions) < 3:
        raise AppError("round has too few usable questions", status_code=502)

    difficulty = str(data.get("difficulty", "MEDIUM")).upper()
    if difficulty not in XP_BY_DIFFICULTY:
        difficulty = "MEDIUM"

    brief = data.get("brief") or {}
    title = str(data.get("title") or "Untitled Round").strip()[:160]
    meta = {
        "title": title,
        "nodeLabel": str(data.get("nodeLabel") or title).strip()[:120],
        "topic": (str(data.get("topic")).strip()[:120] if data.get("topic") else None),
        "difficulty": difficulty,
        "systemName": (str(brief.get("systemName")).strip()[:160] if brief.get("systemName") else title),
        "story": (str(brief.get("story")).strip() if brief.get("story") else None),
        "intro": (str(data.get("intro")).strip()[:400] if data.get("intro")
                  else "Answer fast. Keep the streak alive."),
        "secondsPerQuestion": SECONDS_BY_DIFFICULTY[difficulty],
        "prompt": (str(data.get("prompt")).strip() if data.get("prompt")
                   else "Answer before the timer runs out. Keep your streak alive."),
    }
    return meta, questions


def _stub_arena_rounds(subject_title: str, count: int) -> list[dict]:
    """Deterministic offline arena generator (no AI key), so the flow always demos."""
    base = [
        {
            "prompt": "Which structure gives O(1) average lookup by key?",
            "options": ["Linked list", "Hash table", "Binary heap", "Queue"],
            "answer": 1,
            "explain": "Hashing maps a key straight to a bucket, so lookups avoid scanning.",
        },
        {
            "prompt": "What does a primary key guarantee?",
            "options": ["Sorted rows", "Unique, non-null identity", "Faster inserts", "Encrypted values"],
            "answer": 1,
            "explain": "A primary key uniquely identifies a row and can never be null.",
        },
        {
            "prompt": "Which traversal visits a node before its children?",
            "options": ["Post-order", "In-order", "Pre-order", "Level-order"],
            "answer": 2,
            "explain": "Pre-order handles the node first, then descends into its subtrees.",
        },
        {
            "prompt": "Binary search requires the input to be...",
            "options": ["Sorted", "Unique", "Numeric", "Small"],
            "answer": 0,
            "explain": "Halving the range only works when order tells you which half to keep.",
        },
        {
            "prompt": "What is the worst-case time of quicksort?",
            "options": ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
            "answer": 2,
            "explain": "Repeatedly picking the worst pivot degrades it to quadratic time.",
        },
        {
            "prompt": "Normalization primarily reduces...",
            "options": ["Query count", "Redundancy", "Index size", "Join cost"],
            "answer": 1,
            "explain": "Splitting tables removes duplicated data and the anomalies it causes.",
        },
    ]
    return [
        {
            "title": f"{subject_title}: Rapid Round {i + 1}",
            "nodeLabel": f"{subject_title[:18]} Arena #{i + 1}",
            "topic": subject_title,
            "difficulty": ["EASY", "MEDIUM", "HARD"][i % 3],
            "brief": {
                "systemName": f"{subject_title} Arena",
                "story": "The clock is running. Answer fast, keep the streak, don't burn your hearts.",
            },
            "intro": "Six questions. Three hearts. Go.",
            "questions": base,
        }
        for i in range(count)
    ]


def _normalize_quest(data: dict) -> tuple[list[dict], list[dict], list[dict], dict]:
    """Validate + coerce one model-produced quest into DB-ready structures."""
    if not isinstance(data, dict):
        raise AppError("AI returned an invalid quest object.", status_code=502)

    tiles_in = data.get("tiles") or []
    tiles: list[dict] = []
    seen: set[str] = set()
    for i, t in enumerate(tiles_in):
        if not isinstance(t, dict) or not t.get("label"):
            continue
        tid = str(t.get("id") or f"s{i + 1}").strip()
        while tid in seen:
            tid = f"{tid}x"
        seen.add(tid)
        tiles.append({"id": tid, "label": str(t["label"])[:120], "sub": (str(t["sub"])[:200] if t.get("sub") else None)})
    if len(tiles) < 3:
        raise AppError("AI returned a quest with too few ordered steps.", status_code=502)

    distractors: list[dict] = []
    for i, t in enumerate(data.get("distractors") or []):
        if not isinstance(t, dict) or not t.get("label"):
            continue
        did = str(t.get("id") or f"d{i + 1}").strip()
        while did in seen:
            did = f"{did}x"
        seen.add(did)
        distractors.append({"id": did, "label": str(t["label"])[:120], "sub": (str(t["sub"])[:200] if t.get("sub") else None)})

    # Build explanations for every consecutive correct pair; fall back to a generic line.
    given = data.get("linkExplanations") or {}
    links: list[dict] = []
    for a, b in zip(tiles, tiles[1:]):
        key = f"{a['id']}->{b['id']}"
        explanation = given.get(key) if isinstance(given, dict) else None
        if not explanation:
            explanation = f"“{a['label']}” must come before “{b['label']}”."
        links.append({"from": a["id"], "to": b["id"], "explanation": str(explanation)[:1000]})

    difficulty = str(data.get("difficulty", "MEDIUM")).upper()
    if difficulty not in XP_BY_DIFFICULTY:
        difficulty = "MEDIUM"

    brief = data.get("brief") or {}
    title = str(data.get("title") or "Untitled Quest").strip()[:160]
    meta = {
        "title": title,
        "nodeLabel": str(data.get("nodeLabel") or title).strip()[:120],
        "topic": (str(data.get("topic")).strip()[:120] if data.get("topic") else None),
        "difficulty": difficulty,
        "systemName": (str(brief.get("systemName")).strip()[:160] if brief.get("systemName") else title),
        "story": (str(brief.get("story")).strip() if brief.get("story") else None),
        "prompt": (str(data.get("prompt")).strip() if data.get("prompt") else "Arrange the steps in the correct order."),
    }
    return tiles, distractors, links, meta


def _normalize_coding_quest(data: dict) -> tuple[dict, list[dict]]:
    """Validate + coerce one model-produced coding challenge into DB-ready structures.

    Returns (meta, test_cases). Test cases get ids tc1..tcN. When a `referenceSolution`
    is supplied we run it to compute each expected output (guaranteeing the seeded tests
    are self-consistent); otherwise we keep the model's `expectedOutput`.
    """
    if not isinstance(data, dict):
        raise AppError("AI returned an invalid coding challenge.", status_code=502)

    cases: list[dict] = []
    for t in data.get("testCases") or []:
        # An empty/absent input is legitimate - it calls solution() with no
        # arguments, which is what hello-world style challenges need.
        if not isinstance(t, dict):
            continue
        tid = f"tc{len(cases) + 1}"
        expected = t.get("expectedOutput")
        cases.append({
            "id": tid,
            "description": str(t.get("description") or f"Test {len(cases) + 1}")[:200],
            "input": str(t.get("input") or "").strip()[:2000],
            "expectedOutput": ("" if expected is None else str(expected)),
        })
    if not cases:
        raise AppError("AI returned a coding challenge with no usable test cases.", status_code=502)

    reference = data.get("referenceSolution")
    if isinstance(reference, str) and reference.strip():
        computed = _expected_from_reference(reference, cases)
        for c in cases:
            if c["id"] in computed:
                c["expectedOutput"] = computed[c["id"]]

    difficulty = str(data.get("difficulty", "MEDIUM")).upper()
    if difficulty not in XP_BY_DIFFICULTY:
        difficulty = "MEDIUM"

    brief = data.get("brief") or {}
    title = str(data.get("title") or "Untitled Challenge").strip()[:160]
    starter = str(data.get("starterCode") or "").strip()
    meta = {
        "title": title,
        "nodeLabel": str(data.get("nodeLabel") or title).strip()[:120],
        "topic": (str(data.get("topic")).strip()[:120] if data.get("topic") else None),
        "difficulty": difficulty,
        "systemName": (str(brief.get("systemName")).strip()[:160] if brief.get("systemName") else title),
        "story": (str(brief.get("story")).strip() if brief.get("story") else None),
        "prompt": (str(data.get("prompt")).strip() if data.get("prompt") else "Implement solution(...) as described."),
        "starterCode": (starter + "\n") if starter else DEFAULT_STARTER,
    }
    return meta, cases


def _expected_from_reference(reference: str, cases: list[dict]) -> dict[str, str]:
    """Run a reference `solution` against each test input to get its expected output.

    Returns id -> str(result). Empty if the reference can't even define `solution`
    (we then fall back to the model-provided expected outputs).
    """
    results, _all_passed, error = code_runner.run_tests(
        "python",
        reference,
        [{"id": c["id"], "input": c["input"], "expectedOutput": "", "description": c["description"]} for c in cases],
    )
    if error:
        return {}
    return {r.id: (r.actual or "") for r in results}


def _stub_coding_quests(subject_title: str, count: int) -> list[dict]:
    """Deterministic offline coding generator (no AI key). Self-consistent 'sum a list'.

    Expected outputs are computed in Python here, so a correct student `solution`
    passes — the teacher review flow is fully demoable without a provider.
    """
    sample_inputs = [[1, 2, 3], [], [10], [5, 5, 5], [7, 3]]
    quests: list[dict] = []
    for q in range(count):
        cases = [
            {"description": f"sum of {arr}", "input": repr(arr), "expectedOutput": str(sum(arr))}
            for arr in sample_inputs
        ]
        quests.append({
            "title": f"{subject_title}: Aggregate Challenge {q + 1}",
            "nodeLabel": f"{subject_title[:20]} Code #{q + 1}",
            "topic": subject_title,
            "difficulty": ["EASY", "MEDIUM", "HARD"][q % 3],
            "brief": {
                "systemName": f"{subject_title} Engine",
                "story": "The aggregation routine has crashed. Reimplement it so totals are correct again.",
            },
            "prompt": (
                "Implement `solution(nums)` so it returns the sum of the list of integers `nums`.\n\n"
                "Example: solution([1, 2, 3]) -> 6"
            ),
            "starterCode": "def solution(nums):\n    # return the sum of nums\n    pass\n",
            "testCases": cases,
        })
    return quests


def _unique_slug(db: Session, content_crud, title: str) -> str:
    base = slugify(title)[:90]
    slug = base
    while content_crud.slug_exists(db, slug):
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


def _stub_quests(subject_title: str, source_text: str, count: int) -> list[dict]:
    """Deterministic offline generator used when no AI key is configured.

    Extractive: turns the first meaningful lines of the source into ordered steps,
    so the teacher review flow is fully demoable without a provider.
    """
    lines = [ln.strip(" \t-*•.") for ln in re.split(r"[\n\r.]+", source_text)]
    lines = [ln for ln in lines if 8 <= len(ln) <= 100]
    quests: list[dict] = []
    for q in range(count):
        chunk = lines[q * 5 : q * 5 + 5]
        if len(chunk) < 4:
            chunk = [f"Step {i + 1} of {subject_title}" for i in range(5)]
        tiles = [{"id": f"s{i + 1}", "label": ln, "sub": None} for i, ln in enumerate(chunk[:5])]
        quests.append({
            "title": f"{subject_title}: Sequence {q + 1}",
            "nodeLabel": f"{subject_title[:24]} #{q + 1}",
            "topic": subject_title,
            "difficulty": ["EASY", "MEDIUM", "HARD"][q % 3],
            "brief": {
                "systemName": f"{subject_title} Pipeline",
                "story": "Restore the corrupted process by ordering its steps correctly.",
            },
            "prompt": "Arrange the steps into the correct order.",
            "tiles": tiles,
            "distractors": [{"id": "d1", "label": "Unrelated step (do not place)", "sub": None}],
            "linkExplanations": {},
        })
    return quests
