# Questigo — Code & Architecture Explanation

> A guide to the tech stack, how the codebase is organised, what each file does, and — most importantly — **why the game design is flexible and easy to extend.**
> Written for the MCA Major Project viva. Pair this with `pitch.md` (the live-demo script).

---

## 1. What Questigo Is (one paragraph)

Questigo is a **gamified programming-learning platform**. Students progress through a **Skill Tree** of subjects by playing game "missions" — dragging concept tiles into the correct pipeline (**Sequence Builder**) or writing real code in an in-browser editor (**Coding Challenge**) — earning XP, levelling up, unlocking achievements, and climbing a leaderboard. Teachers manage content and can **upload PDF notes that an AI turns into playable quest drafts**, which the teacher reviews and approves before students ever see them.

---

## 2. Technology Stack

### Frontend — `client/`
| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | Component UI, fully typed. |
| **Vite 5** | Dev server + build tool (fast HMR, `rollup` build). |
| **Tailwind CSS v4** | Utility-first styling; design tokens defined in `index.css` via a `@theme` block. |
| **shadcn/ui-style primitives** | Reusable UI (Button, Card, Dialog…) built manually on **Radix UI** + **CVA**. |
| **React Router v7** | Client-side routing + role-based route guards. |
| **Zustand** | Global auth/user state, persisted to `localStorage`. |
| **TanStack React Query** | Server-state fetching, caching, loading/error states. |
| **Axios** | HTTP client with JWT-injecting interceptor. |
| **Framer Motion** | Meaningful animations (tile movement, XP-gain, level-up). |
| **Monaco Editor** | The VS Code editor engine, embedded for coding challenges. |
| **React Hook Form + Zod** | Form state + schema validation (login/register). |
| **Sonner** | Toast notifications (achievement unlocks). |
| **Lucide React** | Icon set. |

### Backend — `server/`
| Technology | Purpose |
|---|---|
| **Python 3 + FastAPI** | REST API framework; auto-generates OpenAPI/Swagger docs at `/docs`. |
| **SQLAlchemy 2.0** | ORM mapping Python classes to Postgres tables. |
| **PostgreSQL 17** | Relational database (`questigo_dev`). |
| **Pydantic v2** | Request/response schema validation and serialization. |
| **PyJWT** | JSON Web Token auth (`{sub, role, iat, exp}`). |
| **bcrypt** | Password hashing. |
| **OpenAI SDK (→ Groq)** | LLM client for AI quest generation, pointed at Groq's OpenAI-compatible API. |
| **pypdf** | Extract text from uploaded PDFs. |

> **Note on the stack decision:** the original `CLAUDE.md` handbook proposed Node/Express/Prisma. The project was deliberately built on **Python + FastAPI** instead — chosen for the AI ecosystem and FastAPI's automatic API documentation.

### Architecture at a glance — a classic **three-tier** design
```
  Browser (React SPA)                FastAPI (Python)                 PostgreSQL
 ┌───────────────────┐   HTTPS/    ┌────────────────────────┐       ┌──────────┐
 │ Components         │   JSON      │ routes → services →    │  SQL  │ tables   │
 │ Zustand + Query    │ ─────────▶ │ crud → SQLAlchemy models│ ────▶ │ (Postgres)│
 │ Axios (+JWT)       │  {data,     │  + JWT auth + AI client │       │          │
 └───────────────────┘   error}    └────────────────────────┘       └──────────┘
                                            │
                                            ▼  (for generation)
                                     Groq LLM (Llama 3.3 70B)
```
Every API response uses one **standard envelope**: `{ "data": ..., "error": null }` on success, `{ "data": null, "error": "message" }` on failure.

---

## 3. Repository Layout

```
questigo/
├── client/            # React + Vite frontend
│   └── src/
│       ├── components/     # Reusable UI (ui/), layout, ErrorBoundary
│       ├── features/       # One folder per product area (auth, dashboard, play, teacher…)
│       ├── lib/            # axios instance, level math, Monaco setup, helpers
│       ├── store/          # Zustand auth store
│       ├── router/         # Routes + ProtectedRoute guard
│       └── types/          # Shared TS types
├── server/            # FastAPI backend
│   ├── app/
│   │   ├── api/            # HTTP routers (thin controllers)
│   │   ├── services/       # Business logic (fat)
│   │   ├── crud/           # Database queries
│   │   ├── models/         # SQLAlchemy ORM tables
│   │   ├── schemas/        # Pydantic request/response shapes
│   │   └── core/           # config, database, security, error handling, level table
│   ├── sql/               # Raw SQL schema + seed (canonical source of the DB shape)
│   └── scripts/           # Seeder + test scripts
└── docs/              # Project reports, phase docs, gameplay design, progress log
```

**Layering rule (backend):** `route → service → crud → model`. Routes are thin (parse request, call a service). Services hold the logic. CRUD does the DB access. Models are the tables. This keeps each file single-responsibility.

---

## 4. Frontend — What Each Part Does

### Entry & routing
| File | Responsibility |
|---|---|
| `main.tsx` | App bootstrap: mounts React, wraps with React Query provider + Toaster. |
| `App.tsx` | Renders the router. |
| `router/index.tsx` | Declares **every route** and which component renders it. |
| `router/ProtectedRoute.tsx` | Guard component — redirects if not logged in or wrong role (`STUDENT` vs `TEACHER`). |
| `components/ErrorBoundary.tsx` | Friendly fallback UI so a render error never shows a blank white screen. |

### State & data layer
| File | Responsibility |
|---|---|
| `store/authStore.ts` | Zustand store: `user`, `token`, `login()`, `register()`, `logout()`, `setUser()`. Persisted to `localStorage`, so a refresh keeps you logged in. |
| `lib/api.ts` | The single Axios instance. Request interceptor attaches the JWT; response interceptor logs the user out and redirects on a 401. `extractApiError()` unwraps the `{data,error}` envelope. |
| `lib/levels.ts` | The XP→Level threshold table + `getLevelInfo()` (drives every XP bar). Mirrors the backend copy. |
| `lib/sequenceData.ts` | **Types only** for a Sequence mission (the actual data comes from the API). |
| `lib/monacoSetup.ts` | Configures the Monaco code editor. |
| `lib/utils.ts` | `cn()` class-name helper (Tailwind merge). |

### Feature folders (each owns its pages, components, and API calls)
| Folder | What's inside |
|---|---|
| `features/landing/` | `LandingPage.tsx` — the marketing front page. |
| `features/auth/` | `LoginPage`, `RegisterPage`, `TeacherLoginPage` — forms with validation. |
| `features/dashboard/` | `StudentDashboard` (XP bar, stats, continue-learning) and `TeacherDashboard` (subject/quest/student counts). |
| `features/play/` | **The gameplay core.** `SubjectsPage` (subject index), `SkillTreePage` (the node map), `MissionPage` (orchestrates a mission), `playApi.ts` (fetch quests / post completion), and `components/`: `MissionBrief`, `SequenceBuilder`, `PipelineTile`, `CodingChallenge`, `SuccessScreen`. |
| `features/leaderboard/` | `LeaderboardPage` + `leaderboardApi.ts` — XP-ranked table. |
| `features/profile/` | `ProfilePage` + `profileApi.ts` — level, XP, completed quests, achievements grid. |
| `features/teacher/` | `UploadPage` (AI generation), `ApprovePage` (review queue), `CreateQuestPage`, `QuestBuilder`, `CodingQuestBuilder`, `StudentsPage`, `teacherApi.ts`. |

### The star component — `SequenceBuilder.tsx`
This is the marquee game mechanic. In plain terms:
- It takes a **mission** (correct ordered tiles + wrong **distractors**), **shuffles them all together** into a staging area.
- The student taps tiles into **pipeline slots**; tapping a placed tile pulls it back.
- On **Validate**, it checks **each link** (slot *i* → slot *i+1*) against the correct order and colours each connection green/red — so feedback is per-step, not just pass/fail.
- If solved with zero failed validations, it reports a **"clean build"** (which earns a bonus + achievement).
- All movement is animated with Framer Motion's shared-layout (`LayoutGroup`) so tiles glide between staging and pipeline.

---

## 5. Backend — What Each Part Does

### Core
| File | Responsibility |
|---|---|
| `app/main.py` | Creates the FastAPI app, adds CORS, registers error handlers, mounts the router, exposes `/health`. |
| `core/config.py` | Loads settings from `.env` (DB URL, JWT secret, CORS, AI keys). |
| `core/database.py` | SQLAlchemy engine + session + `Base`. |
| `core/security.py` | Password hashing (bcrypt) + JWT encode/decode. |
| `core/levels.py` | The XP→Level threshold table (kept in sync with the frontend). |
| `core/errors.py` | Exception handlers that produce the standard `{data,error}` error envelope. |

### API routers (`app/api/v1/`) — thin controllers
| File | Endpoints |
|---|---|
| `auth.py` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. |
| `content.py` | `GET /subjects`, `GET /subjects/{slug}`, `GET /quests/{slug}` — the student-facing content, shaped exactly for the UI. |
| `student.py` | `GET /student/profile`, `POST /student/xp`, `POST /student/challenges/{slug}/run` (run code), `POST /student/quests/{slug}/complete` (award XP + achievements), `GET /leaderboard`. |
| `teacher.py` | Overview stats, quest CRUD, `POST /teacher/generate` (AI), approve/reject, students roster. |
| `api/deps.py` | Shared dependencies: `get_current_user`, `require_role("TEACHER")`. |

### Services (`app/services/`) — the business logic
| File | Responsibility |
|---|---|
| `auth_service.py` | Register/login, hash + verify passwords, issue JWTs. |
| `student_service.py` | Award XP (idempotent — replaying a quest gives 0), recalc level, clean-build bonus, complete a quest. |
| `content_service.py` | Assemble subject/skill-tree/quest payloads with per-student progress (completed / clean-build / next node). |
| `achievement_service.py` | Unlock predicates ("First Steps", "Clean Architect", "Rising Star"…), checked server-side at completion. |
| `code_runner.py` | Executes student Python in an **isolated (`python -I`) subprocess with a 5s timeout**, compares `str(result)` to each stored test's expected output, returns per-case pass/fail. |
| `generation_service.py` | Turns PDF/text into quest drafts: extract text → prompt the LLM → parse JSON → write a **draft quest** (`PENDING_TEACHER_REVIEW`) with tiles, distractors, and link explanations. For coding quests it runs the model's reference solution through `code_runner` to compute expected outputs. |
| `llm_client.py` | One provider-agnostic client (OpenAI SDK with configurable `base_url`/`model`) → Groq by default, swappable to OpenAI via env. Falls back to a deterministic offline stub if no key. |
| `teacher_service.py` | Teacher content operations (create/edit/approve/reject, roster). |

### Data (`app/models/` + `sql/`)
The **`sql/` files are the canonical schema** (raw SQL, run in order); the SQLAlchemy models map to those tables (`create_type=False` — no auto-create).
- `01_schema.sql` + `02_seed.sql` — users + demo accounts.
- `03_content_schema.sql` + `04_content_seed.sql` — subjects/quests/tiles/links + the DBMS track.
- `05_quest_status.sql` — the draft/publish/reject status enum.
- `06_coding_challenge.sql` + `07_coding_seed.sql` — the `quest_kind` enum + coding challenges.
- `08_achievements.sql` — achievements catalogue + user unlocks.

---

## 6. The Data Model (and why it's the key to flexibility)

```
User ──< QuestAttempt >── Quest ──> Subject
                            │
        ┌───────────────────┼────────────────────┐
        │ kind = SEQUENCE    │  kind = CODING      │
        ▼                    ▼                     ▼
   QuestTile (tiles)   QuestLink (per-step    CodingChallenge
   + distractors        explanations)         (prompt, starter,
                                               test_cases JSON)

Achievement ──< UserAchievement >── User
```

The crucial design choice: **there is ONE `quests` table for every game type.** A column, `kind` (`SEQUENCE | CODING`), discriminates which mechanic a quest uses:
- A **SEQUENCE** quest owns `QuestTile` rows (the tiles + distractors) and `QuestLink` rows (the per-step explanations).
- A **CODING** quest owns a single `CodingChallenge` row (prompt, starter code, JSON test cases).

Everything else — XP reward, difficulty, position in the skill tree, boss flag, story framing, draft/publish status — is **shared** across all game types.

---

## 7. Why the Game Development Is Flexible

This is the architectural heart of the project. The panel will likely ask *"how would you add a new game type?"* — here is the answer.

**A "game mechanic" is not hardcoded anywhere. It's data + a small, isolated component.** Because of the unified schema, adding a brand-new mechanic (say, a "Concept Match" or "Transition Graph" game) is a contained change in three predictable places:

1. **Database:** add a value to the `quest_kind` enum (e.g. `MATCH`), and, if the new mechanic needs its own content shape, one new child table (like `QuestTile` or `CodingChallenge`). The `quests` table itself doesn't change.
2. **Backend:** one new branch in `content_service` to serve that kind's payload, and (if it needs grading) one validator function. Auth, XP, levels, achievements, the skill tree, and progress tracking are **already generic** — they operate on any quest regardless of kind, so none of them need touching.
3. **Frontend:** one new React component (like `SequenceBuilder.tsx` or `CodingChallenge.tsx`). `MissionPage.tsx` simply switches on `quest.kind` to decide which component to render. The dashboard, skill tree, success screen, XP animation, and toasts are reused as-is.

**Concrete evidence this design works:** the project already ships **two completely different mechanics** — a drag/tap **Sequence Builder** and a **Monaco code editor + Python runner** — through the *same* Skill Tree, the *same* XP/level/achievement engine, and the *same* completion endpoint. The second one was added without rewriting the first.

Other dimensions of flexibility built in:
- **Content is data, not code.** Subjects, quests, tiles, distractors, and explanations all live in the database — new content (or entire new subjects) needs **no code deploy**. Teachers add it through the UI.
- **AI generation targets the same schema.** The LLM produces exactly the rows a hand-authored quest would, so generated and human-authored content are indistinguishable to the rest of the system — and both pass through the same approval gate.
- **Answer keys are teacher-editable and validation is exact.** A generated quest is a *draft* until a teacher approves it, so AI mistakes can't reach students. Sequence validation is exact (safe), avoiding false-negative grading.
- **The AI provider is swappable.** One env variable moves the whole system from Groq to OpenAI (or the offline stub) — no code change.
- **The XP/level curve is a single table** in one file (mirrored front and back), so tuning progression is a one-line change.

**One-sentence summary for the viva:**
> *"Every game mechanic is just a `kind` of quest sharing one schema and one progression engine, so adding a new mechanic is a small, isolated, additive change — the platform is designed to grow, not to be rewritten."*

---

## 8. Two End-to-End Flows (trace them if asked)

### A) Student completes a Sequence quest
1. `SkillTreePage` → click Play → `MissionPage` fetches `GET /quests/{slug}` (`content.py` → `content_service`).
2. `SequenceBuilder` shuffles tiles+distractors; student builds the pipeline; **per-link validation** colours each connection.
3. On success, `MissionPage` calls `POST /student/quests/{slug}/complete`.
4. `student_service` records a `QuestAttempt`, awards XP (idempotent) + clean-build bonus, recalculates level; `achievement_service` checks unlocks.
5. Server returns the authoritative updated user; `authStore.setUser` applies it; React Query invalidates the subject + leaderboard; the **XP bar animates** and achievement **toasts** fire.

### B) Teacher generates a quest with AI
1. `UploadPage` posts a PDF or text to `POST /teacher/generate`.
2. `generation_service` extracts the text, prompts the LLM via `llm_client` (Groq), parses the JSON into tiles/links/distractors.
3. It writes a **draft** quest (`status = PENDING_TEACHER_REVIEW`) — **invisible to students.**
4. `ApprovePage` lists pending drafts; teacher edits/approves. On approve, status → `PUBLISHED`.
5. `content_service` now surfaces the subject/quest to students automatically in the play index and skill tree.

---

## 9. Notable Engineering Decisions (talking points)

- **Standard response envelope** (`{data, error}`) everywhere — predictable client handling; one Axios interceptor covers all errors.
- **JWT in `localStorage`** — acceptable for an MVP demo; a production version would use httpOnly cookies.
- **Raw-SQL-canonical schema** — the `sql/` files are the source of truth; ORM models map onto them. This makes the DB shape explicit and reviewable.
- **Server-authoritative progression** — XP/level/achievements are computed on the server and returned; the client never self-reports XP, so it can't be spoofed from the browser.
- **Human-in-the-loop AI** — the single most important safety decision; AI output is always a reviewable draft.
- **Documented MVP boundaries** — the code runner is a lightweight subprocess, not a hardened sandbox; the planned upgrade (containerised judge like Judge0) is a known next step, not a gap.
