# Questigo — Progress Log

> A running record of what has been built, what's mocked, and what's next.
> Keep newest entries at the top. Update after each meaningful work session.

---

## Status Snapshot (as of 2026-07-21) — **DEVELOPMENT LOCKED**

> Feature work is closed as of 2026-07-21. The remaining timeline is documentation,
> report finalisation, and binding — see **Remaining Timeline** near the end of this file.
> Do not start new features; log any new idea under Future Scope in `goal.md` instead.

| Area | State |
|---|---|
| Project scaffolding (Vite + React 19 + TS + Tailwind v4) | ✅ Done |
| Design system (dark theme, shadcn-style primitives) | ✅ Done |
| Landing page | ✅ Done |
| Auth UI (Login / Register / Teacher login) — **mocked** | ✅ Done |
| Student dashboard | ✅ Done |
| Teacher dashboard + layout/sidebar | ✅ Done |
| **Teacher dashboard backend-driven** (`GET /teacher/overview`); **all mock data removed** | ✅ Done |
| **Structural content authoring** (hand-author quests from scratch + add/remove/reorder tiles) | ✅ Done |
| **Live Groq AI generation** (real key set; verified end-to-end) | ✅ Done |
| **Teacher Students roster** (`GET /teacher/students`) | ✅ Done |
| **Error boundaries** (route-level + app-level fallback) + dashboard loading/error states | ✅ Done |
| Teacher Upload / Generate / Approve screens — **UI mock** | ✅ Done |
| **Skill Tree progression (DBMS track)** | ✅ Done |
| **Sequence Builder gameplay (first playable)** | ✅ Done |
| XP + level system + persistence | ✅ Done |
| Achievements (Clean Build, Level Up toasts) | ✅ Basic |
| **Persisted achievements** (catalogue + per-user unlocks in DB; unlock toasts on quest completion) | ✅ Done |
| **Backend (FastAPI + SQLAlchemy + PostgreSQL)** — auth slice | ✅ Done |
| **Real JWT authentication + bcrypt** (backend) | ✅ Done |
| **SQL schema + seed scripts** | ✅ Done (run against local `questigo_dev`) |
| **Frontend ↔ backend auth integration** (login/register/JWT) | ✅ Done |
| **Server-persisted XP + level** (`POST /student/xp`) | ✅ Done |
| **Leaderboard** (backend endpoint + page) | ✅ Done |
| **Subjects/Quests/tiles/links persisted in DB + served via API** | ✅ Done |
| **Quest completion + attempts persisted server-side** (`QuestAttempt`) | ✅ Done |
| **Student profile page** (server-driven: completed quests + achievements + stats) | ✅ Done |
| **AI quest generation from PDF/text** (Groq primary, OpenAI-compatible; offline stub fallback) | ✅ Done |
| **Teacher review/approval workflow** (drafts → PENDING → approve/reject; student gating) | ✅ Done |
| **Multi-track discovery** (student subjects index; dashboard + skill tree dynamic by slug) | ✅ Done |
| **Teacher content editing** (edit draft/published quest text before/after approval) | ✅ Done |
| **Coding-challenge node type** (Monaco editor + Python test-case runner, server-verified XP) | ✅ Done |
| **Teacher authoring of coding challenges** (hand-author + edit prompt/starter/test cases) | ✅ Done (live DB test passed) |
| **AI generation of CODING quests** (Groq + offline stub; reference-computed expected outputs) | ✅ Done (live + stub tests passed) |
| **Full MVP browser verification + viva deliverables** (pitch, code explanation, slide deck) | ✅ Done (2026-07-04) |
| **Docker stack** (3 containers: db / backend / frontend+nginx; snapshot auto-load) | ✅ Done (2026-07-16) |
| ~~**Data Detective node type** (SQL sandbox whodunit)~~ | ❌ **Scrapped 2026-07-21** — too heavy for teachers to author |
| **Rapid Arena node type** (timed MCQ: hearts, streak multiplier, speed scoring) | ✅ Done (2026-07-21, browser-verified) |
| **AI generation of ARENA quests** (Groq + offline stub) | ✅ Done (2026-07-21, live test passed) |
| **Zero-argument coding challenges** (`solution()` with no parameters) | ✅ Fixed (2026-07-21) |

**Overall:** The whole student vertical slice is now server-driven. Auth, XP, level, the DBMS skill tree, quest content (tiles/distractors/per-link explanations), quest completion + attempts, achievements (catalogue + per-user unlocks), and the leaderboard all live in PostgreSQL and flow through the FastAPI API. The frontend no longer ships gameplay content or progress in localStorage, and **no mock data anywhere**. Teachers can hand-author and structurally edit Sequence quests, **hand-author and edit coding challenges**, and **AI-generate any of the three quest types** (Groq, with an offline stub).

**Final shape (2026-07-21):** three playable node types ship — **Sequence Builder** (order the steps), **Code Forge** (write a Python `solution`), and **Rapid Arena** (timed multiple choice). A fourth, *Data Detective*, was built on 2026-07-16 and **deliberately cut on 2026-07-21**: adding content to it required a teacher to hand-write a SQLite schema, seed data, and expected queries, which was far heavier than every other authoring path in the app. Rapid Arena replaced it because MCQ is the format teachers already write. The whole stack also runs under Docker. **Feature development is now closed** — the remaining work is documentation and binding.

---

## Changelog

### 2026-07-21 — Rapid Arena in, Data Detective out, zero-arg coding fix ✅ **(final feature session — development locked)**

The last development session before documentation. Three pieces of scope, agreed up front: fix the code editor's empty-parameter limitation, scrap the SQL/Detective feature, and add one game that reads instantly as a game.

**1. Zero-argument coding challenges — fixed.**
`schemas/teacher.py` declared `input: str = Field(min_length=1)`, and `generation_service` dropped any test case with a falsy input. The *runner* had always handled `solution()` correctly — validation was the blocker. The consequence was visible in the seeded data: the Hello World quest had been authored with the literal string `"None"` as its test input and `def solution(arg1)` as its starter, forcing students to declare and ignore a parameter just to return a greeting. Empty inputs are now accepted (an empty string produces a plain `solution()` call), and `sql/14_hello_world_zero_arg.sql` rewrites any single-test challenge still using the `"None"` placeholder. Verified in the browser: **All tests passed**. One-argument challenges regression-tested and unaffected.

**2. Data Detective — scrapped.** See the note under *Overall* for the reasoning. Deleted `sql_sandbox.py`, `schemas/detective.py`, `DetectiveCase.tsx`, the detective ORM model, CRUD, route, AI path, and every UI branch. **Left in place deliberately:** the `'DETECTIVE'` value in the `quest_kind` enum and the now-empty `detective_cases` table — Postgres cannot drop an enum value without recreating the type and rewriting every dependent column, and the value is simply unreachable. `sql/13_retire_detective.sql` removes the seeded content.

**3. Rapid Arena — new node type.** A Kahoot/Duolingo-style timed multiple-choice run: 3-2-1 countdown → one question at a time against a countdown bar → 3 hearts (a wrong answer *or* a timeout costs one) → streak multiplier (1 + 0.25 per hit, capped 3×) → points = (100 base + up to 100 speed bonus) × multiplier → running out of hearts ends the run with **no XP** → finishing shows score / best streak / hearts remaining and a Claim XP button. A flawless run earns the clean bonus.

- **Backend:** `sql/11_arena.sql` adds the `ARENA` enum value + `arena_rounds` table (`intro`, `seconds_per_question`, `questions` JSONB). `sql/12_arena_seed.sql` seeds two rounds. New `services/arena_service.py` owns all grading.
- **The answer key never ships to the browser up front.** `_arena_out` sends prompt + options only; the client grades one question at a time via `POST /student/arena/{slug}/answer`, which reveals the key for *that question alone*. A choice of `-1` means the timer expired.
- **Anti-spoof:** `complete_quest` re-grades the entire run server-side from `{"answers": {questionId: choiceIndex}}` (reusing the same `code` field CODING uses). Unanswered questions count as wrong, and the server **recomputes `clean` itself** — confirmed by test that it awards the clean bonus even when the client sends `clean: false`, so the bonus can't be claimed by asking for it.
- **Frontend:** `components/ArenaGame.tsx`, lazy-loaded. Two timer bugs found and fixed during the build — (a) remaining time is mirrored in a ref so `submitAnswer` doesn't depend on `msLeft`, which had been tearing down and rebuilding the countdown interval every 50 ms tick; (b) the interval only decrements and a separate effect fires the timeout, because calling a side effect inside a `setState` updater double-fires under StrictMode. The prompt and options animate as **one keyed block** — animating the heading alone left the previous question sitting above the next question's answers for ~250 ms.
- **AI generation works live on Groq.** Required raising `max_tokens` in `llm_client.py` (new `MAX_COMPLETION_TOKENS = 8000`): arena rounds are a larger payload than the other kinds, and with no explicit ceiling the provider truncated the completion mid-JSON, failing JSON-mode validation with `json_validate_failed`. This also benefits SEQUENCE and CODING generation.

**Verified:** played a full round in the browser — hearts decremented, streak reached 5×, score screen read 5/6 and 1,664 points, XP persisted, "Level Up — Level 7" toast fired, zero console errors. Live Groq generation produced 8 grounded questions with correct answer keys. `tsc -b --force` and `npm run build` both clean. Also verified through the **Docker stack** end-to-end (arena play + zero-arg coding via the nginx proxy).

**Two corrections worth recording.** (a) An earlier claim in this session that the typecheck was clean was **wrong**: `npx tsc --noEmit` against the root `tsconfig.json` checks *nothing*, because that file is a solution file with `"files": []`. The correct command is **`tsc -b`**, which caught a syntax error the other had missed. (b) The seed files were first written against local-dev slugs and silently no-oped on the Docker snapshot, which uses `python-core` (not `core-python`) and `test` (not `hello-world`). Both files are now environment-agnostic — `12_arena_seed.sql` matches either Python subject slug and computes its position as `MAX(position)+1`; `14_hello_world_zero_arg.sql` targets the `"None"` placeholder rather than a slug. That second fix caught a **second instance of the same hello-world bug** living in the Docker snapshot.

---

### 2026-07-16 — Data Detective node type + Docker stack ✅ *(detective later scrapped — see 2026-07-21)*

Added a third quest kind, **DETECTIVE** — a read-only SQL sandbox where the student solved a whodunit by writing real SQL against seeded evidence tables, with ordered clue checkpoints and result-set grading (any correct query passed, not SQL text matching). Seeded case: `the-vanished-marks` on the DBMS track. AI generation included a safety gate that built the schema and ran every expected query before a case could reach the review queue.

**Cut on 2026-07-21.** Retained here for the record because the report's *Results / Design Decisions* section is stronger for showing a feature that was built, evaluated against real usability criteria, and deliberately removed. Implementation details are recoverable from this repo's history.

Also landed the **Docker stack** (`docker-compose.yml` + `docs/DOCKER.md`): three containers — `postgres:17` on host port 5433, FastAPI backend on 8000, and the Vite build served by nginx on 5173 with `/api` proxied to the backend (so the browser stays same-origin and needs no CORS config). The DB snapshot in `docker/postgres/initdb/` auto-loads onto an empty volume, making `docker compose down -v && docker compose up -d` a one-command reset to known-good demo data.

---

### 2026-07-04 — Full MVP browser verification + viva deliverables ✅

End-to-end verification of the complete MVP in a real browser, plus the assessment deliverables.

**Verified:** landing → student login → dashboard → skill tree (completed / available / locked + boss node) → mission brief → Sequence Builder with per-link validation → Clean Build achievement toast → XP animating and **persisting server-side** → profile → leaderboard. Teacher side: dashboard → **live Groq AI generation** from pasted text → approval queue (drafts confirmed never to reach students) → coding runner grading correctly. Zero console errors.

**Deliverables created:** `pitch.md` (10-minute demo runbook + Q&A) and `code-explanation.md` (stack, per-file roles, extensibility) at the repo root, plus `docs/Questigo_Final_Presentation.pptx` — a 21-slide deck covering the university notice's required sections, embedding real application screenshots.

---

### 2026-06-23 — AI generation of CODING quests ✅
Completed the rest of **Next Up #1**: the generation pipeline can now emit **coding challenges**, not just Sequence Builder quests. A teacher picks the quest type on the upload screen; the rest of the PDF/text → draft → review → publish flow is unchanged.

**Backend:**
- `POST /api/v1/teacher/generate` gained a `kind` form field (`SEQUENCE` default | `CODING`); 400s on anything else. Threaded through `teacher_service.generate` → `generation_service.generate_quests(..., kind=...)`.
- `generation_service`: new `_CODING_SYSTEM_PROMPT` (asks for `title/nodeLabel/topic/difficulty/brief/prompt/starterCode/referenceSolution/testCases`), `_generate_coding_quests` (persists CODING drafts via `crud.create_coding_quest_draft`, now accepting `source_name`), and `_normalize_coding_quest`.
- **Self-consistent test cases:** the model also returns a `referenceSolution`; `_expected_from_reference` runs it through the existing `code_runner` to **compute each expected output**, so the seeded tests are guaranteed solvable (a correct student `solution` passes). `referenceSolution` is used only to compute expected — never stored or shown. Falls back to the model's `expectedOutput` if the reference can't run.
- Offline stub `_stub_coding_quests`: a deterministic "sum a list" challenge with Python-computed expected outputs, so the demo works with no AI key.

**Frontend:**
- `UploadPage` gained a **Sequence Builder / Coding Challenge** type picker; `teacherApi.generateQuests` sends `kind`. Page copy de-specialized ("quest drafts" not "Sequence Builder quests").

**Verified:** backend imports clean · `tsc -b` + `vite build` clean (no bundle change — teacher area stays Monaco-free) · live DB test (`scripts/test_coding_generation.py`, throwaway subjects, cleaned up): **stub path** → 2 CODING drafts whose stored test cases a correct `def solution(nums): return sum(nums)` passes via the real runner (self-consistent); **live Groq path** → generated "Sum Aggregator" with 5 test cases, all expected outputs populated from the reference solution. Demo data untouched.

**Next:** Next Up #1 is fully closed (teacher authoring + AI generation of coding challenges both done). Remaining work is demo polish / stretch items.

### 2026-06-23 — Teacher authoring of coding challenges ✅ (static checks; live DB test pending)
Closed **Next Up #1** (the held item): teachers can now **hand-author and edit CODING quests** from the UI — previously coding challenges existed only via SQL seed. The student-facing coding flow (Monaco + Python runner + server-verified XP) was already complete; this adds the missing authoring half.

**Backend:**
- `POST /api/v1/teacher/coding-quests` (TEACHER) — hand-author a new coding quest; subject matched/created by slug; lands `PENDING_TEACHER_REVIEW` with `kind=CODING`. `PUT /api/v1/teacher/coding-quests/{slug}` — replace the challenge (prompt/starter/test cases) + display fields; 400s on SEQUENCE quests (mirrors the structural-edit guard, which 400s on CODING).
- Schemas (`schemas/teacher.py`): `CodingTestCaseInput` + shared `_CodingContent` (`title/nodeLabel/topic/difficulty/xpReward/brief*/prompt/starterCode/language/testCases` min 1) → `CodingQuestCreate` (+subject) / `CodingQuestUpdate`. Test-case **ids are assigned server-side by position** (`tc1..tcN`), so reordering/removal needs no key handling. `xpReward` omitted → derived from difficulty (EASY/MEDIUM/HARD = 80/120/180).
- `teacher_service.create_coding_quest` / `replace_coding_challenge` + `_build_test_cases`; `crud.content.create_coding_quest_draft` / `replace_coding_challenge` (creates/updates the 1-to-1 `coding_challenges` row). Added `kind` to `TeacherQuestSummary` so the review list can branch.
- **No leak:** the teacher preview/edit path gets a new `codingFull` field on `QuestDetail` (`schemas/coding.CodingChallengeAuthor`, incl. test **inputs/expected**), populated only by `teacher_service._detail`. The student path (`content_service`) never sets it, so students still see test **descriptions only** (`coding`), inputs/expected stay server-side.

**Frontend:**
- New `features/teacher/CodingQuestBuilder.tsx` — create+edit form (details, brief, challenge prompt, Python starter code in a monospace textarea, and a test-case list with description / input expression / expected output, add-remove, min 1). Mirrors `QuestBuilder`'s mutation + cache-invalidation pattern. No Monaco in the teacher area (plain textarea) — keeps the teacher bundle light.
- `CreateQuestPage` now has a **Sequence Builder / Coding Challenge** type picker that swaps in the right builder. `ApprovePage` branches by `item.kind`: a **Code** badge + icon, edit opens `CodingQuestBuilder`, and a new `CodingPreview` (prompt + starter code + `solution(input) → expected` test list).
- `teacherApi`: `kind` on `TeacherQuest`, `codingFull` on `TeacherQuestDetail`, new `CodingTestCaseInput`/`CodingQuestInput` types + `createCodingQuest`/`updateCodingQuest`.

**Verified:** backend imports clean · both `/teacher/coding-quests` routes registered · `tsc -b` clean · `vite build` clean (main 731.58 kB; Monaco still its own lazy `CodingChallenge` chunk). **Live DB round-trip passed** (`scripts/test_coding_authoring.py`, throwaway data, cleaned up): create into a **new** subject → 201, EASY auto-XP 80, ids `tc1..`; draft hidden from students (404); edit → HARD/250 XP/3 tests; a structural (sequence) edit on the coding quest → 400; approve → student detail exposes `coding` (descriptions only, **no input/expected leak**, `codingFull` null); correct run → allPassed; wrong code on complete → 400; correct complete → **+280 XP** (HARD 250 + clean 30), leveled to 6. Alice's XP restored afterward; **demo data untouched**.

**Next:** **AI generation emitting CODING quests** (the second half of Next Up #1 — generation currently only emits SEQUENCE).

### 2026-06-19 — Demo polish: error boundaries + dashboard states ✅
Hardened the app for live demos. The biggest gap was **no error boundaries** — a render error anywhere showed a blank screen; now it shows a branded fallback with **Try again** / **Go home**.

**Error handling:**
- New `components/ErrorBoundary.tsx` — a shared dark `ErrorScreen` plus two entry points: `RouteError` (wired as a single pathless-route `errorElement`, so every route's render errors are caught) and a class `ErrorBoundary` wrapping the whole app in `App.tsx` (final safety net for anything outside the router). Router restructured into one pathless layout route holding all routes.

**Query + state polish:**
- Global React Query default now also sets `refetchOnWindowFocus: false` (alongside the existing `staleTime: 30_000`) — no surprise refetch/flicker when alt-tabbing mid-demo.
- `StudentDashboard` gained the **loading skeleton + error state** it was missing for its tracks fetch, and its **Achievements stat now shows the real persisted count** (`profile.stats.achievementsUnlocked`) instead of reusing the completed-quest count.

**Already in good shape (audited, no change needed):** dark `index.html` body (no unstyled flash), Monaco lazy-loaded into its own chunk, and loading/empty/error states already present on SkillTree, Subjects, Leaderboard, Profile, Approve, Students, and the teacher dashboard.

**Verified:** `tsc -b` clean · `vite build` clean (719.36 kB) · live smoke test — backend `/health` 200, Vite dev server boots and **transforms every changed module (router, ErrorBoundary, App, dashboards, builder) with 200** (a transform error returns 500), confirming the router restructure renders. Servers stopped after. *Note: visual/responsive 375px and per-page console-error checks are best done in a browser click-through (not automated here).*

**Next:** teacher/AI authoring of **coding** challenges (on hold per request).

### 2026-06-19 — Live Groq AI verified + Teacher "Students" roster ✅
Two things: confirmed the **real AI pipeline works end-to-end** (a Groq key is now set in `server/.env`), and built the **teacher Students view**, replacing the last disabled placeholder in the teacher portal.

**Groq verified:** `AI_API_KEY` (Groq, `llama-3.3-70b-versatile`) is live. A connectivity probe + a full generation run from OS scheduling notes produced genuinely good quests — real titles ("Process Scheduling Steps", "Round Robin Scheduling"), correctly-ordered steps, sensible distractors ("Kill Process", "I/O Wait"), and meaningful per-link explanations — a clear step up from the extractive stub. `aiProvider` reported `groq`; generated drafts were cleaned up afterward.

**Students roster:**
- Backend: `GET /api/v1/teacher/students` (TEACHER-only) → all students ranked by XP, each annotated with `completedCount` + `achievementsCount` (two grouped-count queries, no N+1) and `joinedAt`. `teacher_service.list_students` + `crud.content.completed_counts` + `crud.achievement.unlocked_counts`; schema `TeacherStudentRow`.
- Frontend: `features/teacher/StudentsPage.tsx` at **`/teacher/students`** — ranked roster cards (rank/crown for top 3, initials avatar, name/email/joined, completed + achievement metrics, level badge + XP), with loading skeletons + error + empty states. Enabled the previously-disabled **Students** sidebar item and the dashboard's **View Students** quick action.

**Verified:** backend imports clean · `/teacher/students` registered · TestClient: teacher `200` (Alice #1 lvl 6 / 2300 XP, then Akshay), student `403` · `tsc -b` clean · `vite build` clean (715.89 kB). Demo data untouched.

**Next:** teacher/AI authoring of **coding** challenges (currently on hold per request).

### 2026-06-19 — Structural content authoring (hand-author + full edit) ✅
Teachers can now **create Sequence quests from scratch** and **structurally edit** any draft — add/remove/reorder steps, manage distractors, and edit every field — not just tweak text. This removes the dependency on AI generation for content creation and supersedes the text-only editor.

**Core model:** a Sequence quest = ordered canonical tiles + distractors + per-consecutive-pair explanations; **links are derived from consecutive tiles**. On every structural write the backend **re-assigns tile keys by position** (`s1..sN` / `d1..dM`) and rebuilds links, so reorder/add/remove needs no key-collision handling and never leaves dangling `from->to` links (the exact constraint that blocked structural edits before).

**Backend:**
- `POST /api/v1/teacher/quests` (TEACHER) — hand-author a new draft (`PENDING_TEACHER_REVIEW`); the subject is matched or **created** by slug, so naming a new track creates it. `PUT /api/v1/teacher/quests/{slug}/structure` — fully replace a Sequence quest's tiles/links + display fields. Both reject if `<3` tiles (422); the PUT 400s on CODING quests.
- Schemas `AuthorTile` / `QuestCreate` / `QuestStructureUpdate` (tiles min 3; `xpReward` optional → derived from difficulty; `explanations[i]` explains tiles[i]→tiles[i+1], blanks auto-filled). `teacher_service` gained `create_quest` / `replace_structure` + a shared `_build_structure` (keys, derived links, default explanations) reusing `XP_BY_DIFFICULTY`/`slugify` from generation. `crud.replace_quest_structure` swaps scalar fields + deletes & re-inserts tiles/links in one transaction.

**Frontend:**
- New `features/teacher/QuestBuilder.tsx` — one form for **create + edit** modes: details (title/node/topic/difficulty/XP with auto-from-difficulty), brief/prompt, an **ordered step list with up/down reorder, add, and remove (min 3)**, distractor add/remove, and per-gap "why this order" textareas whose labels track the live neighbours. `features/teacher/CreateQuestPage.tsx` at **`/teacher/quests/new`**.
- `teacherApi` gained `createQuest` / `updateQuestStructure` (+ `kind` on the detail type). `ApprovePage`'s edit action now opens the structural `QuestBuilder`. Entry points added: sidebar **Create Quest**, dashboard header **Create Quest** + subjects-card **New Quest** + empty-state link. Deleted the text-only `QuestEditor.tsx` (superseded; the `PATCH` endpoint remains as a partial-text API).

**Verified:** backend imports clean · `POST /teacher/quests` + `PUT .../structure` registered · TestClient (throwaway data, cleaned up): create into a **new** subject → 201, HARD auto-XP 180, links derived from order, explanation applied · structural edit (reorder Gamma→Alpha→Beta + add Delta + drop distractor) → keys reassigned `s1..s4`, XP override 250, links rebuilt · `<3` tiles → 422 · student → 403 · structural edit on the seeded CODING quest → 400 · `tsc -b` clean · `vite build` clean (712.72 kB). Demo data untouched.

**Next:** teacher/AI authoring of **coding** challenges (prompt/starter/test cases); then a teacher "Students" view.

### 2026-06-19 — Teacher dashboard wired to backend; all mock data removed ✅
Closed the last frontend↔backend gap: the Teacher Dashboard was the only screen still reading from `lib/mockData.ts`. It now pulls real data, and **`lib/mockData.ts` is deleted** — the app ships no mock data anywhere.

**Scope decision (per user):** the dashboard's **Topics stat card** and **Recent Activity feed** were **dropped** — neither maps to the real schema (there's no Topic table; Subject → Quest directly, and there's no activity log). The dashboard now shows **Subjects / Quests / Students** counts + the real subject list. "Create Subject" and "View Students" stay as inert placeholders (structural authoring is still pending).

**Backend:**
- `GET /api/v1/teacher/overview` (TEACHER-only) → `{ stats: { subjects, quests, students }, subjects: [{ id, title, description, questCount }] }`. Counts cover all statuses (teacher management view). `teacher_service.get_overview` reuses `content_crud.list_subjects` (already eager-loads quests) + new `user_crud.count_students`. Schemas `TeacherOverview`/`TeacherOverviewStats`/`TeacherSubjectSummary`.

**Frontend:**
- `teacherApi.fetchTeacherOverview()` + types. `TeacherDashboard` rewritten as a React Query screen (30s stale time) with loading skeletons, an error banner, and an empty state ("Generate your first track"). Subject rows link to Approve; stat grid trimmed to 3 cards.
- Deleted `lib/mockData.ts` (most of it was already dead code — only the dashboard consumed `MOCK_STATS`/`MOCK_SUBJECTS`/`MOCK_RECENT_ACTIVITY`).

**Verified:** backend imports clean · `/teacher/overview` registered · TestClient: teacher `200` with real counts (dbms: 1 subject / 4 quests / 2 students), student `403` · `tsc -b` clean · `vite build` clean (main bundle 706.34 kB, slightly smaller after removing the mock) · no remaining `mockData`/`MOCK_` references in the codebase. Demo data untouched.

**Next:** structural content authoring (reorder/add/remove tiles + hand-author quests); then teacher authoring of coding challenges.

### 2026-06-19 — Persisted achievements (Phase 5) ✅
Promoted the achievement catalogue from **derived-on-read** to **real database tables**, and added **in-game unlock toasts** at the moment a quest is completed. The 7-achievement catalogue (keys/titles/icons) is unchanged, so the profile UI and icon map are untouched — only the storage + unlock *moment* changed.

**Database (`server/sql/08_achievements.sql`, applied to `questigo_dev`):**
- `achievements` table — static catalogue (key, title, description, icon, position); seeded with the 7 existing achievements via idempotent `ON CONFLICT (key) DO UPDATE` (re-running refreshes display text without touching unlocks).
- `user_achievements` table — one row per (user, achievement) with `unlocked_at`; PK `(user_id, achievement_id)`, FK-cascaded. Models `Achievement`/`UserAchievement` (`models/achievement.py`) + `__init__` updated.

**Backend:**
- `services/achievement_service.py` is now the **single source of truth for unlock predicates** (moved out of `student_service`): `first-quest`, `clean-architect`, `boss-slayer`, `trifecta`, `rising-star`, `perfectionist`, `veteran`. `check_and_unlock(db, user)` builds a context (completed/clean/bosses/level) from the student's completed attempts + level, persists any newly-satisfied achievements, and returns them. `list_for_user` annotates the catalogue with unlock state + `unlockedAt`.
- `crud/achievement.py` — `list_catalogue`, `get_by_key`, `unlocked_map`, `unlock`.
- `complete_quest` calls `check_and_unlock` after XP is persisted and returns the **newly unlocked** list (`CompleteQuestResponse.unlockedAchievements`); runs even on re-completion so it **back-fills** achievements earned before the feature existed.
- `get_profile` no longer derives achievements — it **back-fills on view** (so seeded users like Alice, whose XP predates this feature, light up their level achievements when they open their profile) then reads unlock state from the table. `AchievementOut` gained `unlockedAt`.

**Frontend:**
- `playApi`: `CompleteQuestResult.unlockedAchievements` (+ `UnlockedAchievement` type). `profileApi.Achievement` gained `unlockedAt`.
- Shared `lib/achievementIcons.ts` (icon-name → Lucide component); `ProfilePage` now imports it (removed its local copy).
- `MissionPage` queues **stacked "Achievement Unlocked!" toasts** for each newly-unlocked achievement, spaced 500ms apart (after the Clean Build / Level Up toasts), each with its mapped icon.

**Verified:** migration applied + catalogue seeded (7 rows) · backend imports clean · all routes registered · `tsc -b` + `vite build` clean (main bundle unchanged 707.60 kB, Monaco still its own lazy chunk) · TestClient end-to-end on a throwaway student (cleaned up): profile@start 0 unlocked → complete clean → `first-quest`+`clean-architect` returned with null `unlockedAt`, +180 XP, leveled up → re-complete idempotent (0 XP, no new) → profile@end both unlocked with timestamps, stat=2 · level back-fill on profile view confirmed (xp 2300/lvl 6 → `rising-star`+`veteran`). **Demo data untouched.**

**Next:** structural content authoring (reorder/add/remove tiles + hand-author quests); then teacher authoring of coding challenges.

### 2026-06-19 — Coding-challenge node type (Phase 4) ✅
Added the platform's core differentiator as a **second quest kind**. A `CODING` quest drops the Sequence Builder for a **Monaco editor**: the student implements `solution(...)`, runs it against test cases, and earns XP only when all pass — re-verified server-side. Adapted from Phase 4 (which assumed Node/`vm`/JS) to the actual **FastAPI + Python** stack: challenges run **Python** via a sandboxed subprocess.

**Database (`server/sql/06_coding_challenge.sql` + `07_coding_seed.sql`, applied to `questigo_dev`):**
- `quest_kind` enum (`SEQUENCE` | `CODING`) + `quests.kind` (default `SEQUENCE`, so existing nodes are untouched). New `coding_challenges` table (1-to-1 with a quest): `prompt`, `starter_code`, `language` (default `python`), `test_cases` JSONB (`{id, description, input, expectedOutput}`). Models + `__init__` updated.
- Seed: one CODING node in the DBMS track — **"Build a Lookup Index"** (position 4, HARD, 200 XP): implement `solution(keys)` → sorted unique list, 5 test cases.

**Backend:**
- `services/code_runner.py` — runs student code in an **isolated (`-I`) Python subprocess** with a 5s wall-clock timeout; defines `solution`, calls `solution(<input>)` per test, compares `str(result)`. Compile errors / runtime exceptions / timeouts surface as failed tests; not a hardened sandbox (per Phase 4 out-of-scope).
- `POST /api/v1/student/challenges/{slug}/run` — dry run, returns per-test pass/fail (no XP, no attempt). `POST .../quests/{slug}/complete` now **re-runs CODING submissions server-side** and 400s unless every test passes before awarding XP (anti-spoof). Quest detail exposes `kind` + a `coding` payload (test **descriptions only** — inputs/expected stay server-side).

**Frontend:**
- `features/play/components/CodingChallenge.tsx` — two-panel layout (prompt + live test list | Monaco editor + Run/Submit), Reset-to-starter, per-test got/want on failure, error banner. **Monaco bundled locally** (`lib/monacoSetup.ts`, `loader.config({ monaco })` + base editor worker) so it works **offline**; loaded via `React.lazy` so the 3.8 MB chunk ships only when a challenge opens (main bundle unchanged at ~707 kB).
- `MissionPage` branches on `kind` (brief → CodingChallenge → SuccessScreen, which now shows "Challenge Solved" and hides the pipeline when there are no tiles). Skill-tree nodes show a **Code** badge/icon for coding quests. `playApi` gained `runChallenge`, `kind`/`coding` types, and a `code` arg on `completeQuest`.

**Verified:** migrations applied · backend imports clean · all routes registered · `tsc -b` + `vite build` clean (Monaco split into its own lazy chunk) · TestClient end-to-end: detail exposes `kind`/coding without leaking expected outputs · wrong code 3/5 + `complete` → 400 · correct code → allPassed → `complete` → +200 XP · runtime error reported as failed test · **Alice restored to xp 2300 / lvl 6, demo data untouched**.

**Next:** promote derived achievements to real tables; then structural content authoring (reorder/add/remove tiles, hand-author quests).

### 2026-06-19 — Teacher content editing (PATCH quest) ✅
Teachers can now **fix generated drafts** instead of only approve/reject — edit a title, difficulty, XP, story/prompt, tile labels (incl. distractors), and the per-link "why this order" explanations, then save before (or after) publishing.

**Scope decision:** editing is limited to **display text** — tile/link *keys* stay stable. Reordering, adding, or removing tiles is intentionally out (it would invalidate the `from->to` link keys). That keeps the slice safe and demo-ready; structural editing is a noted gap.

**Backend:**
- `PATCH /api/v1/teacher/quests/{slug}` (TEACHER-only). `QuestUpdate` schema — all fields optional, only provided fields change; `xpReward` bounded 0–10000, `title`/`nodeLabel`/tile labels min-length 1. Works on any status (typo fixes on live quests included).
- `crud.update_quest` applies scalar field updates + matches tile edits by `tile_key` and link edits by `from->to` key (unknown keys ignored). `teacher_service.update_draft` maps camelCase→ORM columns via `model_dump(exclude_unset=True)`; `_detail()` extracted so preview + update share one shaping path. Returns the updated `QuestDetail`.

**Frontend:**
- `teacherApi.updateQuest()` + `QuestEditInput`. New `features/teacher/QuestEditor.tsx` — inline edit form (details grid, story/prompt textareas, per-step label+note inputs, distractor inputs, per-link explanation textareas with from→to labels), seeded from the fetched detail, with validation and a save mutation that updates the `teacher-quest` cache and invalidates `teacher-quests` + the affected `subject`.
- `ApprovePage` quest cards gain a **pencil/Edit** action that swaps the preview for the editor; cancel/save returns to preview.

**Verified:** backend imports clean · PATCH route registered · `tsc -b` + `vite build` clean (2347 modules) · service round-trip (title/XP/tile label+sub/link explanation edit → restore) · TestClient: student `403`, teacher edit `200`, unknown slug `404`, XP>10000 `422`, restore confirmed. Demo data untouched.

**Next:** the coding-challenge node type; then promote derived achievements to real tables.

### 2026-06-19 — Multi-track discovery: generated tracks now reach students ✅
Closed the gap that made the AI pipeline invisible: the student UI was hardcoded to the `dbms` subject, so any generated+approved track (OS, Networks, …) never surfaced. The student side is now **subject-agnostic** — every subject with ≥1 published quest appears automatically.

**Backend:**
- `GET /api/v1/subjects` is now **STUDENT-only** (was any-auth) and **progress-annotated**: each `SubjectOut` carries `questCount` + `completedCount` (published quests only). Subjects with no published quest are hidden, so students never click into an empty tree.
- `content_service.list_subjects(db, user)` rewritten to filter + annotate; `crud.list_subjects` eager-loads quests (`selectinload`) to compute counts without N+1.

**Frontend:**
- New `features/play/SubjectsPage.tsx` at **`/play`** — a tracks index (cards with per-track progress bars, empty/loading/error states). `playApi.fetchSubjects()` + `SubjectSummary` type added.
- `SkillTreePage` reads `:subjectSlug` from the route; route changed `/play/dbms` → **`/play/:subjectSlug`** (defaults to `dbms`). `MissionPage` back/return links now use `mission.subjectSlug` instead of a hardcoded `/play/dbms`.
- `StudentDashboard` fetches the subjects list and renders **one card per track** (links to `/play/:slug`) plus a "View all tracks" link; stats now aggregate completion across all tracks. `ProfilePage` empty-state CTA points to `/play`.

**Verified:** backend imports clean · `tsc -b` + `vite build` clean (2346 modules) · service smoke (Alice → `dbms 0/3`, per the seeded-XP note) · TestClient role guard: student `200` (annotated), teacher `403`, anon `401`.

**Next:** teacher content CRUD (edit generated drafts); then the coding-challenge node type. With multi-track live, generating into a *new* subject (e.g. "OS") now surfaces to students on approval with no code changes.

### 2026-06-18 — AI quest generation + teacher approval workflow ✅
The core vision loop is live: **PDF/text → AI-generated Sequence Builder quests → teacher review → publish to students.** Generation uses Groq by default (free, OpenAI-compatible), with a one-line swap to OpenAI and an offline stub so the demo works with no key.

**Provider abstraction:** Groq and OpenAI share the OpenAI-compatible API, so a single `openai.OpenAI` client (`services/llm_client.py`) targets either via env — `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` (defaults to Groq `llama-3.3-70b-versatile`). Empty key → deterministic extractive **stub generator**.

**Database (`server/sql/05_quest_status.sql`, applied to `questigo_dev`):**
- `quest_status` enum (`PENDING_TEACHER_REVIEW` | `PUBLISHED` | `REJECTED`) + `quests.status` (default `PUBLISHED`, so existing seeded content stays live), `quests.created_by`, `quests.source_name`, status index. `Quest` model updated to match.

**Backend:**
- `services/generation_service.py` — `extract_pdf_text` (pypdf), prompt + JSON-mode call, strict `_normalize_quest` (validates tiles/distractors, auto-fills per-link explanations, derives XP by difficulty), find-or-create subject by slug, persists drafts as `PENDING_TEACHER_REVIEW`.
- `services/teacher_service.py` + `api/v1/teacher.py` (TEACHER-only): `POST /teacher/generate` (multipart: PDF file **or** pasted text, subject, count 1–4), `GET /teacher/quests[?status]`, `GET /teacher/quests/{slug}` (preview, any status), `POST /teacher/quests/{slug}/approve|reject`.
- **Student gating:** subject quests, quest detail, `next_quest_in_subject`, and quest completion now require `status == PUBLISHED` (drafts/rejected return 404 / are hidden).
- crud helpers: `get_or_create_subject`, `slug_exists`, `next_quest_position`, `create_quest_draft`, `list_quests`, `set_quest_status`. Deps: `python-multipart`, `pypdf`, `openai` (installed in `.venv`).

**Frontend:**
- `features/teacher/teacherApi.ts` (generate via FormData, list, preview, approve, reject).
- `UploadPage` rewritten: real PDF dropzone **or** paste-text, subject + quest-count, calls `/teacher/generate`, toasts, routes to Approve. `ApprovePage` rewritten: React Query list with Pending/Published/Rejected/All tabs, expandable **preview** (correct sequence, distractors, per-link "why this order"), approve/reject mutations with invalidation + toasts, loading/empty/error states.
- Removed the mock `GeneratePage` (Upload now does real generation); sidebar consolidated to **Generate Quests** + **Approve Content** (`/teacher/generate` redirects to upload).

**Verified:** backend imports clean · all 5 teacher routes registered · migration applied · `tsc -b` + `vite build` clean (2345 modules) · end-to-end TestClient run against `questigo_dev` (stub provider): generate→pending→approve/reject, role guard (student→teacher = 403), student gating (draft hidden, approved visible, rejected = 404), teacher preview any status. Created quests cleaned up; demo data untouched. **To use real AI:** paste a Groq key into `server/.env` `AI_API_KEY`.

**Next:** teacher content CRUD (manual subject/quest editing); more tracks (OS/Networks); then the coding-challenge node type.

### 2026-06-18 — Student profile page (server-driven) ✅
Built the student profile — the next-up item — fully backed by the API; no new DB tables (achievements are derived).

**Backend:**
- `GET /api/v1/student/profile` (STUDENT-only) → `{ user, completedQuests, achievements, stats }`.
- `crud.content.completed_quests_for_user` — joins `quest_attempts` → `quests` → `subjects` for COMPLETED attempts, newest first.
- `student_service.get_profile` — builds the completed-quest history and derives a **7-achievement catalogue** (`first-quest`, `clean-architect`, `boss-slayer`, `trifecta`, `rising-star`, `perfectionist`, `veteran`) from stats + level via predicates (no `Achievement`/`UserAchievement` tables for MVP). Stats: completed count, clean builds, bosses defeated, achievements unlocked.
- Schemas: `CompletedQuestOut`, `AchievementOut`, `ProfileStats`, `ProfileOut` in `schemas/student.py`.

**Frontend:**
- `features/profile/profileApi.ts` (`fetchProfile` + types) and `ProfilePage.tsx`: hero card (initials avatar, name, email, level badge, XP progress via `getLevelInfo`), 4-stat grid, achievements grid (unlocked vs locked/greyed with lock icon, Lucide icon name → component map), and the completed-quests history list (difficulty badge, clean-build sparkle, boss crown, +XP, date). Loading skeletons + error + empty states.
- Route `/profile` (STUDENT) added; **Profile** link added to the student dashboard nav.

**Verified:** backend imports clean · `/api/v1/student/profile` registered · `tsc -b` + `vite build` clean (2345 modules) · service smoke test against `questigo_dev`: Alice (xp 2300, lvl 6) → level achievements `rising-star`/`veteran` unlock, quest achievements locked (her seeded XP predates any `quest_attempts`, as previously noted); a temporary COMPLETED attempt (rolled back) confirmed the join, history shaping, and `first-quest`/`clean-architect` unlock. Demo data untouched.

**Next:** PDF → AI generation → teacher approval (drafts land `PENDING_TEACHER_REVIEW`); then teacher content CRUD; then the coding-challenge node type.

### 2026-06-17 — Content moved to the database: subjects/quests + server-side completion ✅
The DBMS skill tree and Sequence Builder content are now stored in PostgreSQL and served by the API; the frontend mock data (`lib/sequenceData.ts`) and the localStorage `progressStore` are gone.

**Database (`server/sql/`):**
- `03_content_schema.sql` — `subjects`, `quests`, `quest_tiles`, `quest_links`, `quest_attempts` tables + `difficulty` / `attempt_status` enums (relational, FK-cascaded; one attempt row per user+quest).
- `04_content_seed.sql` — the full DBMS track (1 subject, 3 quests, 18 tiles incl. distractors, 12 per-link explanations), mirroring the old `sequenceData.ts` exactly. Idempotent. **Both files were run against `questigo_dev`.**

**Backend:**
- ORM models `Subject`/`Quest`/`QuestTile`/`QuestLink` (`models/content.py`) and `QuestAttempt` (`models/attempt.py`); crud + service layers.
- `GET /api/v1/subjects`, `GET /api/v1/subjects/{slug}` (quests annotated with the student's `completed`/`cleanBuild`), `GET /api/v1/quests/{slug}` (full payload shaped to the frontend's `SequenceMission` + `nextQuestSlug`).
- `POST /api/v1/student/quests/{slug}/complete` — records/updates the attempt and awards XP **only on first completion** (incl. the +30 clean-build bonus), recalculates level, returns the updated user + `xpAwarded`/`alreadyCompleted`/`leveledUp`.

**Frontend:**
- `features/play/playApi.ts` (fetchSubject / fetchQuest / completeQuest) + React Query.
- `SkillTreePage`, `MissionPage`, `StudentDashboard` now read from the API (loading/error states added). `MissionPage` posts completion, updates the auth user via new `authStore.setUser`, and invalidates the `subject`/`leaderboard` queries.
- Removed: `progressStore.ts`, the mock arrays in `sequenceData.ts` (types kept), and the now-dead `authStore.addXp`.

**Verified:** schema+seed loaded · `import app.main` clean · full loop via curl (complete q1 → xp 850→1000, q1 `completed`, q2 unlockable, `nextQuestSlug=normalization`, leaderboard reorders) · idempotent re-complete awards 0 · `tsc -b` + `vite build` clean · both servers serve 200. Demo state reset afterward.

**Note:** Alice's seeded XP (2300) has no matching `quest_attempts` rows (her old progress lived in localStorage), so her tree shows 0 completed until she replays — cosmetic only.

**Next:** PDF → AI generation → teacher approval (drafts land `PENDING_TEACHER_REVIEW`); then the student profile page; then the coding-challenge node type.

### 2026-06-17 — Backend live + frontend integration: auth, XP persistence, leaderboard ✅
The backend is now running against the user's local **`questigo_dev`** Postgres 17 DB (user `qdevdbusr`), and the frontend talks to it for real.

**Environment / setup:**
- Created `server/.env` (DATABASE_URL → `questigo_dev`, JWT secret, CORS) and `client/.env` (`VITE_API_URL=http://localhost:8000/api/v1`); both are gitignored, with `.env.example` files tracked.
- Created a dedicated **`server/.venv`** and installed `requirements.txt` there (keeps Questigo isolated from other global Python projects).
- Verified DB connectivity and the seeded users (teacher + alice + bob) load.

**Frontend ↔ backend auth (the integration gap is closed):**
- `client/src/lib/api.ts` — axios instance: base URL from env, request interceptor attaches the JWT (read from the persisted store), response interceptor clears auth + redirects on 401; `extractApiError()` reads our `{ data, error }` envelope.
- `authStore` now calls real `POST /auth/login` and `POST /auth/register`; persists `token`; `MOCK_*` credential map removed.
- `RegisterPage` is now functional (validates, registers, redirects to dashboard); removed the "backend not connected" notice.

**Server-persisted progression:**
- Backend: `POST /api/v1/student/xp` (STUDENT-only) adds XP, recalculates level via the threshold table, persists, returns the updated user. Added `crud.user.add_xp` / `list_students_ranked`, `schemas/student.py`, `services/student_service.py`.
- Frontend: `authStore.addXp` is now async — posts to `/student/xp` and stores the server's authoritative user (falls back to local calc if offline). `MissionPage` awaits it. **XP now survives across browsers/accounts, closing the localStorage-only gap.**

**Leaderboard:**
- Backend: `GET /api/v1/leaderboard` (any authed user) — students ranked by XP desc, reads straight from `users`.
- Frontend: `features/leaderboard/LeaderboardPage.tsx` (React Query, loading skeleton + error + empty states, highlights "You"), route `/leaderboard`, and a Leaderboard link in the student dashboard nav.

**Verified:** backend imports clean · all 6 routes in OpenAPI · login/register/duplicate/bad-password/XP-award/leaderboard/401 all return correct envelopes via curl · `tsc -b` + `vite build` clean · Vite dev serves 200.

**Next:** persist Subjects/Topics/Quests/missions in the DB (currently frontend mock data) so content is server-driven; then PDF→AI generation→teacher approval; then student profile page.

### 2026-06-17 — Phase 1 backend: FastAPI auth + SQL seeders ✅
Implemented the Phase 1 backend in **Python/FastAPI** (stack decision: switched the planned backend from Node/Express/Prisma to **FastAPI + SQLAlchemy + PostgreSQL**). Backend is standalone — **not yet wired to the frontend** (integration is the next step).

**Built (`server/`):**
- FastAPI app with CORS, standard `{ data, error }` response envelope, and exception handlers
- **Auth endpoints:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, plus `GET /health`
- **JWT** (PyJWT, `{ sub, role, iat, exp }`) + **bcrypt** password hashing
- `User` SQLAlchemy model; thin routes → `auth_service` → `crud` layering
- Level derivation util mirroring the frontend threshold table
- Role guard dependency (`require_role`) and `get_current_user`

**Database (`server/sql/`):**
- `01_schema.sql` — `user_role` enum, `users` table, indexes, pgcrypto extension
- `02_seed.sql` — demo users with bcrypt hashes via pgcrypto (`crypt()/gen_salt('bf')`)
- `scripts/seed.py` — idempotent Python seeder alternative

**Integration-ready detail:** seeded the **same demo accounts the frontend already mocks** (`teacher@questigo.dev/demo1234`, `alice@student.dev/student123`) so the existing login screen will work unchanged once wired up.

**Docs:** `server/README.md` with full setup + API reference. Per request, **no build/lint runs** were executed on the backend yet.

**Next:** user seeds their local Postgres, then we wire the frontend `authStore` to the real `/api/v1/auth` endpoints.

### 2026-06-17 — Sequence Builder vertical slice ✅
Built the first fully playable student experience: **Sequence Builder** inside a **DBMS Skill Tree**, frontend-only with mocked data.

**Flow delivered:** Dashboard → DBMS Skill Tree → Mission Brief → Sequence Builder → per-link Validation → Success Screen (XP animation) → next node unlocks.

**Created:**
- `lib/levels.ts` — XP→Level threshold table + `getLevelInfo()`
- `lib/sequenceData.ts` — DBMS track: 3 missions (SQL Execution Order, Normalization, Transaction Lifecycle/Boss) with tiles, distractors, per-link explanations
- `store/progressStore.ts` — completed-missions + clean-build tracking (persisted)
- `features/play/SkillTreePage.tsx` — node tree with completed/available/locked states
- `features/play/MissionPage.tsx` — orchestrates brief → build → success, awards XP, toasts
- `features/play/components/MissionBrief.tsx`
- `features/play/components/SequenceBuilder.tsx` — staging → pipeline, tap-to-place, per-link validation
- `features/play/components/PipelineTile.tsx` — shared-layout animated tile
- `features/play/components/SuccessScreen.tsx` — pipeline-restored + XP bar animation

**Modified:**
- `features/dashboard/StudentDashboard.tsx` — real level math + DBMS track launch card
- `router/index.tsx` — added `/play/dbms` and `/play/mission/:missionId`
- `store/authStore.ts` — added `addXp()` (award XP + recalc level)
- `types/index.ts` — added `addXp` to `AuthState`

**Verified:** `tsc -b` clean · `npm run build` succeeds (2288 modules) · all routes serve · gameplay loop completes · responsive to 375px.

**Docs:** Organized all `.md` files into `docs/`; added `TECHNICAL_GUIDE.md` (demo reference) and this log. `CLAUDE.md` stays at repo root.

### Earlier — Phase 0 + gameplay design
- Phase 0 scaffolding complete (Vite 5 + Tailwind v4, shadcn primitives built manually, auth store, landing page).
- Gameplay direction decided: **Skill Tree** progression + **Sequence Builder** as first playable mechanic (design spec: `GAMEPLAY_SEQUENCE_BUILDER.md`).

---

## Remaining Timeline — documentation & binding

> **Development is locked as of 2026-07-21.** Every feature in the MVP scope is built and
> verified. Nothing below requires writing application code. If something *does* look like
> it needs a code change, weigh it against the binding deadline first — a documented
> limitation costs nothing, a late regression costs the demo.

### 1. Report — content to reconcile before writing
- [ ] **Update every mention of the quest types.** The report/deck must say **three**: Sequence Builder, Code Forge, Rapid Arena. Any surviving reference to *Data Detective* as a shipped feature is now wrong.
- [ ] **Use the Detective cut as a Results/Design-Decisions item**, not an omission — a feature built, evaluated for authoring burden, and deliberately removed is a stronger engineering narrative than one silently dropped.
- [ ] **Re-take screenshots** of anything showing the old node types, the old Hello World starter (`def solution(arg1)`), or a three-card quest-type picker containing "Data Detective".
- [ ] Refresh the ER/schema diagram: add `arena_rounds`; mark `detective_cases` as retired (it still exists in the DB — say so rather than hiding it).

### 2. Deliverables to refresh
- [ ] `docs/Questigo_Final_Presentation.pptx` — rebuild via the scratchpad `build_deck.py` toolchain; update the node-type slides and screenshots.
- [ ] `pitch.md` — the demo runbook should now route through **Rapid Arena** (it is the strongest 60-second moment) and the fixed Hello World.
- [ ] `code-explanation.md` — add `arena_service.py`, `ArenaGame.tsx`, `arena_rounds`; remove the detective entries.
- [ ] `docs/PROJECT_REPORT.html` — reconcile against this snapshot.

### 3. Pre-binding verification (do once, near the end)
- [ ] `cd client && npx tsc -b --force` → clean, and `npm run build` → succeeds. **Note:** `tsc --noEmit` on the root `tsconfig.json` checks nothing (solution file with `"files": []`) — always use `tsc -b`.
- [ ] `docker compose down -v && docker compose up -d --build` → confirm a from-scratch reset produces the full content tree (both arenas + the zero-arg Hello World). This exercises the `initdb` layering.
- [ ] Click through all three node types plus the teacher approve flow; confirm zero console errors.
- [ ] **Rotate or remove the Groq API key in `server/.env` before the repo is submitted, printed, or pushed anywhere** — it is a live credential.

### Completed (for the record)
- ~~Demo polish pass~~ — ✅ 2026-07-04 (full browser click-through, zero console errors).
- ~~Surface generated tracks to students~~ · ~~Teacher content editing~~ · ~~Coding-challenge node type~~ · ~~Persisted achievements~~ · ~~Structural content authoring~~ · ~~Teacher "Students" view~~ — all ✅ 2026-06-19.
- ~~AI generation of coding challenges~~ — ✅ 2026-06-23.

### Deliberately not done (state as Future Scope, don't attempt now)
- Hardened code sandbox (Judge0/containers) — the current runner is an isolated subprocess with a timeout, adequate for a local demo, explicitly not production-safe.
- Mixed-kind AI generation (model picks the quest type per quest).
- Real-time/multiplayer arena, adaptive difficulty, LMS integration, mobile app.

### Run instructions (local)
- **Backend:** `cd server` → `./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000` (reads `server/.env`). Can stay bound to `127.0.0.1` — the frontend proxy reaches it on the same host.
- **Frontend:** `cd client` → `npm run dev` (reads `client/.env`). `vite.config.ts` sets `server.host: true` (exposed on the LAN) and proxies `/api` → `http://localhost:8000`; `client/.env` uses a **relative** `VITE_API_URL=/api/v1`.
- **LAN access:** open `http://<host-LAN-IP>:5173` (e.g. `http://192.168.0.188:5173`) from any device — the browser only talks to `:5173` (same-origin) and Vite proxies the API server-side, so **no CORS setup is needed**. Verified end-to-end from the LAN IP (login + subjects + profile all 200, 0 console errors).
- Demo logins: `alice@student.dev`/`student123`, `bob@student.dev`/`student123`, `teacher@questigo.dev`/`demo1234`.

---

## Known Gaps / Notes

### Added 2026-07-21 (read these before writing the report)

- **Three node types ship, not four.** Sequence Builder, Code Forge, Rapid Arena. `DETECTIVE` remains as an unreachable value in the `quest_kind` enum and `detective_cases` survives as an empty table — both intentional, because Postgres cannot drop an enum value without recreating the type. Describe this as a documented retirement, not dead code left by accident.
- **Rapid Arena's answer key never reaches the browser ahead of time.** Questions ship as prompt + options; each answer is graded by the server one at a time; the full run is re-graded at completion and `clean` is recomputed server-side. Worth stating explicitly in the report — it is the same anti-spoof posture as the coding runner.
- **Arena XP is fixed per quest, not score-derived.** The in-game score/streak is presentation; XP is `quests.xp_reward` (+30 clean bonus for a flawless run), identical to the other node types. This keeps the leaderboard fair across kinds — a deliberate design decision, worth a sentence.
- **The AI provider needs an explicit `max_tokens`.** Without it, larger payloads (arena rounds) truncate mid-JSON and fail JSON-mode validation. Fixed at 8000 in `llm_client.py`.
- **`tsc --noEmit` on the root `tsconfig.json` verifies nothing** — it is a solution file with `"files": []`. Use `tsc -b`. Recorded because it produced a false "clean" result during development.
- **Local dev DB and the Docker snapshot have different content.** Local uses `core-python` / `hello-world`; the Docker snapshot uses `python-core` / `test`. The seed scripts now handle either. If a future snapshot is re-taken from the local DB, delete `initdb/11`–`14` at the same time — they will already be baked in (see `docker/postgres/initdb/README.md`).
- **A live Groq API key is committed in `server/.env`.** Fine locally; rotate it before the repository is submitted, printed, or pushed anywhere public.

### Earlier notes

- AI generation is **live on Groq** (`llama-3.3-70b-versatile`) — a key is set in `server/.env` and verified end-to-end. If the key is removed, it falls back to the deterministic extractive stub so the demo still works.
- **All mock data is gone** (`lib/mockData.ts` deleted). The Teacher Dashboard is now backend-driven via `GET /teacher/overview` (real subject/quest/student counts + subject list). The Topics stat card and Recent Activity feed were dropped (no Topic table; no activity log in the schema). "Create Subject" / "View Students" remain inert placeholders pending structural authoring.
- Generated+approved quests now surface to students automatically: the `/play` subjects index lists every subject with ≥1 published quest, and the skill tree is keyed by `:subjectSlug`. (A generated track only disappears from the index if all its quests are still pending/rejected.)
- Coding challenges run **Python in a subprocess with a 5s timeout** — an MVP runner, **not a hardened sandbox** (no resource/syscall isolation); fine for the local demo, replace with Judge0/containers before any real deployment. Students must implement a function named `solution`. Teachers can **hand-author/edit** coding quests (`POST/PUT /teacher/coding-quests`) **and AI-generate** them (`POST /teacher/generate` with `kind=CODING`); generated challenges get **reference-computed expected outputs** (the model's `referenceSolution` is run through `code_runner` to fill `expectedOutput`, then discarded) so they're solvable. Test inputs/expected are returned to the teacher (`codingFull`) for editing but **never to students** (`coding` is description-only).
- Teachers can now **hand-author Sequence quests** and **structurally edit** them (add/remove/reorder tiles, manage distractors, edit all fields) via the quest builder; links are derived from tile order so reordering is safe. The older text-only `PATCH /teacher/quests/{slug}` endpoint is retained as a partial-update API but the UI now uses the structural `PUT`. **Coding** quests still can't be authored in the UI (Next Up #1), and structural editing is **Sequence-only** (the builder refuses CODING quests).
- Achievements are now **persisted** (`achievements` catalogue + `user_achievements` unlocks) and unlocked server-side at quest completion, with stacked "Achievement Unlocked!" toasts. Unlock predicates live in `services/achievement_service.py`. The profile **back-fills on view**, so a seeded user's `unlocked_at` reflects first profile-open (not the historical moment) for achievements earned before this feature existed — cosmetic only.
- Seeded users whose XP predates the `quest_attempts` table (e.g. Alice) show 0 completed quests on their profile until they replay — cosmetic only.
