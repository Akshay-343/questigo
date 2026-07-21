# Questigo — External Examiner Q&A Preparation

Likely viva questions with grounded, report-accurate answers. Organized by theme. Answer in your own words — these are the *facts and framing* to hit, not a script to memorize verbatim.

---

## 1. Motivation & Problem Statement

**Q: What problem does this project actually solve?**
Most e-learning platforms teach programming/CS concepts through passive video + multiple-choice quizzes, which test recognition ("which option is correct?") rather than understanding ("can you reconstruct the process?"). Questigo replaces recognition-based assessment with construction-based assessment for two of its three mechanics — students rebuild a process or write real code — while also cutting teacher authoring effort via an AI pipeline with a mandatory human approval gate.

**Q: Isn't this just "gamification," which is already common?**
Most gamified platforms (Kahoot, Duolingo) apply game elements — points, streaks, levels — on top of an *unchanged* quiz. That's "structural gamification." Questigo goes further: the activity itself is redesigned as a construction task (Sequence Builder) or a real coding exercise (Code Forge), not just decorated with a progress bar. The RPG layer (XP/levels/achievements/leaderboard) is shared across all three mechanics, not built once per mechanic.

**Q: Why did you pick this specific idea for an MCA major project?**
It combines the breadth the degree is meant to demonstrate — full-stack web development, relational DB design, authentication/authorization, and applied generative AI — around one original, defensible idea: assessment by construction rather than recognition. It's also honestly scoped: one architecture proven end-to-end, not a shallow feature list.

---

## 2. The "isn't Arena just another MCQ?" question — expect this

**Q: You criticize MCQs, but Rapid Arena is literally a timed multiple-choice quiz. Isn't that a contradiction?**
The report never claims all MCQ-format assessment is worthless — it claims a platform that is *only* MCQs tests recognition and nothing else. Questigo's three mechanics deliberately test three different kinds of thinking: Sequence Builder tests **procedural** understanding (can you reconstruct an ordered process, with every connection checked individually), Code Forge tests **practical** ability (can you write real, executable code), and Rapid Arena tests **recall speed under pressure** — a real and legitimate thing to assess, just not the *only* thing. Two of the three mechanics are genuinely construction-based; Arena is the recall complement, not the core of the platform.

**Q: So why include Arena at all, if it's the "weaker" mechanic pedagogically?**
Honestly: partly pedagogical (recall-under-pressure is a real skill, and it's a strong engagement/retention mechanic — hearts, streaks, and a countdown create urgency the other two mechanics don't), and partly a documented engineering trade-off. A fourth mechanic, Data Detective (a SQL-sandbox investigation game), was prototyped first and would have been more construction-heavy than Arena — but it required a teacher to hand-author a database schema, seed data, and expected queries per case, which was a far heavier authoring burden than any other mechanic. That directly conflicted with the project's own objective of *reducing* teacher effort, so it was retired in favour of Arena, which teachers can already author fluently (they've all written MCQs before). This is documented as a considered design decision in Section 5.12, not hidden.

**Q: Doesn't retiring a mechanic mid-project look like you couldn't finish it?**
The opposite framing is the correct one, and it's how the report presents it: a mechanic that was *built, evaluated against a real project objective, and consciously removed* is stronger evidence of engineering judgement than a mechanic that was never attempted. It shows the trade-off was measured, not guessed at.

---

## 3. Literature Survey

**Q: What gap in the literature does this project actually fill?**
Twenty papers were reviewed across three areas: foundational motivation/flow/gamification theory, gamification in programming education specifically, and AI-assisted content generation. The consistent gap: gamified tools almost always gamify *recognition*-based assessment (MCQs) rather than replacing it; programming serious games are typically single-purpose, non-extensible, and don't share a progression engine across assessment types; and AI-generation research rarely pairs generation with an *independent, executable* re-verification step. No reviewed system combines construction-based per-step-validated assessment, real code execution, and a teacher-verification-gated AI pipeline in one extensible platform.

**Q: Which theories specifically influenced your design?**
Papert's constructionism (understanding via building, not recognizing) directly motivates Sequence Builder. Csikszentmihalyi's flow theory and Malone's intrinsic-motivation framework motivate the immediate per-link/per-test feedback in Sequence Builder and Code Forge. Deci & Ryan's Self-Determination Theory (autonomy/competence/relatedness) motivates the achievement and leaderboard systems. Ji et al.'s 2023 survey on LLMs being "fluent but factually wrong" directly motivated the self-consistent test-case derivation safeguard — the platform's most distinctive engineering decision.

**Q: How does Questigo compare to LeetCode/HackerRank or Duolingo specifically?**
LeetCode/HackerRank verify code correctness excellently but offer no progression narrative and no construction-based conceptual assessment — they assume you already know what to write. Duolingo has very strong RPG mechanics (streaks, hearts, levels) but applies them to short, low-stakes recall drills, never to real code execution or multi-step structural validation. Questigo is the only one of the three that combines construction-based sequencing, real code execution, and RPG progression under one engine.

---

## 4. System Architecture & Design

**Q: Walk me through the architecture.**
Three-tier: a React 19 + TypeScript single-page frontend (Vite, Tailwind), a stateless FastAPI (Python) backend organized in layers — routes → services → CRUD → models — and a PostgreSQL database. An external LLM provider (Groq, OpenAI-compatible client) is consulted only for AI content generation. Every request carries a JWT in its Authorization header; every response uses a standard `{ data, error }` envelope.

**Q: Why FastAPI/Python over the originally-planned Node/Express/Prisma stack?**
Python's ecosystem strength for AI/LLM integration, and it lets the code-execution sandbox use the *same* language runtime being graded (`python -I` subprocess) without a cross-language bridge. FastAPI's auto-generated OpenAPI docs also materially sped up manual endpoint testing during development.

**Q: Why a monorepo, and why this specific folder structure?**
`client/`, `server/`, `docker/`, and `docs/` at the root. The backend enforces a strict one-way dependency: routes are thin (parse + delegate), services hold all business logic, CRUD isolates SQLAlchemy queries, models map to the canonical raw-SQL schema. The frontend is organized by feature (`features/auth`, `features/play`, `features/teacher`, …) rather than by file type, so each feature owns its own screens, components, and API calls.

**Q: What are the two main system workflows?**
(1) Teacher content workflow: author by hand or via AI upload → draft stored as `PENDING_TEACHER_REVIEW` → teacher approves/rejects → approved content becomes `PUBLISHED`. (2) Student learning workflow: login → browse Skill Tree → open an unlocked quest → play its mechanic → submit → server re-verifies and awards XP/level/achievements → next node unlocks.

---

## 5. Database Design

**Q: How did you model three structurally different game mechanics in one schema?**
One `quests` table with a `kind` enum (`SEQUENCE | CODING | ARENA`) as the discriminator. Each kind has its own child table(s): `quest_tiles` + `quest_links` for Sequence, `coding_challenges` (with `test_cases` as JSONB) for Coding, `arena_rounds` for Arena. Everything else — auth, the Skill Tree, XP/level math, achievements, leaderboard — is written once against the abstract idea of "a quest was completed" and needs zero changes when a new mechanic is added.

**Q: Why not one big polymorphic JSON blob for quest content instead of separate tables?**
Tiles and links are kept as real relational rows (not one JSON blob) specifically so the answer key can be validated, edited, and re-keyed by position safely at the database level, and so links can be derived automatically from tile order — a flexibility a JSON blob would make much harder to query, edit, or validate.

**Q: Why is `arena_rounds` a separate table rather than reusing `quest_tiles`?**
Timed multiple-choice rounds need to be independently orderable and re-gradable (one round at a time, server-side) without touching the Sequence-specific tables at all — keeping the two mechanics' data model fully decoupled even though they share the same parent `quests` row.

**Q: What stops a student's `level` field from getting out of sync with their `xp`?**
`level` is never stored independently as an editable value in the sense of being incremented directly — it's recomputed from total XP against a fixed threshold table (Level 1 = 0 XP … Level 10 = 8000 XP) after every single XP award. Because it's derived, not accumulated, it structurally cannot drift out of sync with XP.

**Q: How do you guarantee a student can't be awarded XP twice for the same quest?**
One `quest_attempts` row per `(user_id, quest_id)`. The completion service checks for an existing `COMPLETED` attempt before awarding anything; if one exists, it returns `0` XP awarded. This makes the operation idempotent by construction, not by a client-side check.

---

## 6. The Three Game Mechanics

**Q: Explain Sequence Builder's validation logic.**
It doesn't grade the whole answer as one right/wrong outcome. Each adjacent pair of placed tiles is checked independently against the canonical order; a wrong link surfaces a pre-authored teaching explanation for what *should* connect there instead of a bare "incorrect." Client-side validation runs first for instant feedback, but the server re-derives correctness independently before any XP is granted.

**Q: How does the Code Forge sandbox actually isolate student code?**
Submissions run in an isolated Python subprocess (`python -I`, which disables user site-packages and current-directory imports) with a hard 5-second wall-clock timeout. Each test case calls the student's `solution(...)` and compares printed output to an expected string; compile errors, exceptions, and timeouts are all captured and surfaced as failed tests rather than crashing the request.

**Q: Is that sandbox actually secure enough for production?**
No, and the report says so explicitly — it's an MVP-grade isolation boundary (process isolation + timeout), suitable for a supervised local/classroom demo, not a hardened, resource- and syscall-isolated judge. A production deployment would replace it with a container-based judge like Judge0 or gVisor. This is stated as a known limitation, not discovered by an examiner.

**Q: How does Rapid Arena prevent a student from just looking up the answer key in the browser's network tab?**
The answer key never reaches the client ahead of time. Each round ships to the browser as a prompt + options only; the chosen option *index* is sent to the server, which grades it against the stored `correct_index` one round at a time. On completion, the whole run is re-graded server-side and the "clean" (no wrong answers) flag is recomputed from the server's own record — never trusted from the client.

**Q: What's the "clean build" bonus and why does it exist?**
A flat +30 XP bonus for completing a quest with zero incorrect attempts, applied identically across all three mechanics. It rewards precision, not just completion, without needing a different scoring scheme per mechanic — deterministic and mechanic-agnostic by design.

---

## 7. AI Content Generation

**Q: How does a teacher actually generate content with AI?**
They upload a PDF or paste text, pick a quest kind, and the server extracts raw text (via `pypdf` for PDFs), sends it to the configured LLM (Groq by default, through an OpenAI-compatible client so the provider is swappable) with a strict JSON-mode prompt for that kind, and normalizes the response into the same row shape a hand-authored quest would use — inserted as `PENDING_TEACHER_REVIEW`, invisible to students until approved.

**Q: LLMs hallucinate. How do you know a generated coding challenge's test cases are actually correct?**
This is the platform's most distinctive engineering decision. The server doesn't trust the model's *reported* expected output — it takes the model's own proposed reference solution and *executes* it through the exact same sandboxed runner used to grade students, and stores that real, executed output as the ground truth. The reference solution is then discarded and never shown to anyone. So a generated test case is provably solvable by construction, not merely plausible-sounding.

**Q: What happens if the Groq API key isn't configured, or the service is down?**
The pipeline falls back to a deterministic, extractive offline stub, so the generate-review-approve workflow stays fully demonstrable with zero external dependency or cost — it fails safely rather than failing the request.

**Q: Why is teacher approval mandatory rather than optional?**
Because an AI-generated quest is treated as a *draft*, not a fact. No AI-authored content is ever visible to students until a teacher explicitly reviews and approves it — this is the platform's primary defence against a wrong or nonsensical AI-generated quest reaching a real student, and it's enforced server-side (an unapproved draft returns 404 to a student, not just hidden in the UI).

---

## 8. Security & Integrity

**Q: What stops a student from editing the client and giving themselves XP?**
Every reward-affecting action is re-verified on the server before anything is persisted: code is re-executed server-side, Arena answers are graded server-side round-by-round, and Sequence links are re-checked server-side. The client's role is presentation and instant feedback only — it is never the source of truth for a reward.

**Q: How is authentication implemented?**
JWTs signed and issued on login/register, carrying `{ userId, role, exp }`, verified on every protected request. Passwords are bcrypt-hashed (salted) before storage. Role checks (`STUDENT` / `TEACHER`) are enforced server-side on every protected endpoint, not just hidden via the frontend router.

**Q: What happens if a student calls a teacher-only endpoint directly?**
HTTP 403 Forbidden — verified in testing. And an unapproved (PENDING) draft quest returns HTTP 404 to a student, not a 403 — it's genuinely invisible, not merely access-restricted.

**Q: Are coding-challenge test inputs/expected outputs ever exposed to students?**
No — the student-facing API only ever returns a human-readable test *description* and pass/fail; the actual input values and expected outputs never leave the server, verified explicitly as a requirement and re-checked in testing.

---

## 9. Development Process & Challenges

**Q: What methodology did you follow?**
Iterative, phase-based — closer to Agile than Waterfall, appropriate for a single-developer academic project with an evolving design space. Six phases (setup/auth → dashboards → subjects/topics/quests → coding challenge module → progression/leaderboards → demo polish), each a vertically complete, demonstrable slice rather than a horizontal layer. This let scope adapt mid-project — the Rapid Arena addition and the Data Detective retirement both happened *because* of what was learned building earlier phases, not despite it.

**Q: What was the hardest technical problem you ran into?**
A concrete one: large AI-generated Arena payloads were silently truncating mid-JSON and failing to parse, because the LLM client had no explicit `max_tokens` ceiling set — fixed by configuring an explicit, sufficiently large limit. More conceptually, trusting AI-generated coding test cases was the hardest *design* problem, resolved by the self-consistent test-case derivation approach (Section 5.10).

**Q: Why does the database still have a `DETECTIVE` value and an empty `detective_cases` table if that mechanic was retired?**
PostgreSQL cannot drop a single value from an enum type without recreating the whole type. Rather than do a risky enum-recreation migration for a demo project, this was left as a deliberate, explicitly documented retirement (Section 7.7) — stated openly as intentional rather than left as unexplained dead code.

**Q: How did you test this, given it's not a machine-learning project with accuracy metrics?**
Because Questigo is a software system, "evaluation" means correctness and integrity verification, not statistical scores: end-to-end behavioural testing against a live database (both local and the containerised Docker deployment), FastAPI TestClient integration tests, `tsc -b` static type-checking plus a full Vite production build on every phase, and manual browser testing at desktop and 375px mobile width. Ten representative pass/fail scenarios are documented in Section 7.5, covering XP idempotency, anti-spoof behaviour for both Coding and Arena, role isolation, and live AI generation.

---

## 10. Results, Limitations, Future Scope

**Q: What actually got delivered vs. the original MVP plan?**
Everything in the original scope, plus several things originally deferred to "future work": a third game mechanic (Rapid Arena), persisted achievements with predicate-based unlocking, structural quest editing in the teacher UI, and AI generation extended to all three quest kinds (not just one).

**Q: What are you not claiming this system does well?**
Stated plainly in the report: the code sandbox is process-isolation-plus-timeout, not a hardened judge, so it's not safe at production scale; the coding runner supports Python only; content breadth is limited to the seeded demo track (the project proves architectural completeness, not a full course library); and there's no adaptive difficulty, multiplayer, or LMS integration yet.

**Q: If you had another six months, what would you build next?**
In priority order per the report's future-scope table: a container-based judge (Judge0/gVisor) for safe multi-language execution; adaptive difficulty driven by attempt history; real-time multiplayer Sequence/Code Forge races; analytics dashboards with LTI/Google Classroom export; and — since the UI is already mobile-first — a React Native port.

**Q: Is this deployed anywhere real, or only local?**
Verified in two equivalent environments: local development (uvicorn + Vite dev server against a local PostgreSQL 17 instance) and a reproducible three-container Docker Compose stack (db/backend/frontend), confirming the same behaviour holds in a from-scratch, production-shaped environment — not just on the development machine.

---

## 11. Likely "gotcha" / meta questions

**Q: What would you say is the single most original contribution of this project?**
The self-consistent test-case derivation for AI-generated coding challenges — deriving expected outputs by *executing* the model's own reference solution through the same sandbox used to grade students, rather than trusting what the model claims the output should be. It converts a well-known, documented LLM failure mode (fluent but wrong) into an engineered guarantee, and it's not something the reviewed literature does.

**Q: This looks like a lot for one person to build — how much of this is really yours vs. scaffolded?**
Every layer is hand-designed and hand-implemented for this project: the schema, the three mechanics' validation logic, the anti-spoof server-side re-verification pattern, and the AI self-consistency pipeline are all project-specific engineering decisions, not defaults from a template. Standard, well-known third-party libraries (React, FastAPI, SQLAlchemy, Monaco) are used for their standard purposes — exactly as expected in any real-world build — but the architecture and its game-specific logic are original work.

**Q: Why should a student trust a leaderboard/XP system at all — doesn't gamification just create shallow motivation?**
The report doesn't claim gamification alone deepens learning — the RPG layer (XP/levels/achievements/leaderboard) is the *retention* mechanism, sitting on top of mechanics that are *already* pedagogically meaningful (construction and real code execution). The literature review (Sailer et al. 2017, Hamari et al. 2014) supports engagement gains specifically when game elements are applied to genuinely meaningful actions, not layered onto an unchanged quiz — which is exactly the design principle followed here.
