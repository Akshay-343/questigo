# Questigo — Technical Guide (Demo Reference)

> A complete, plain-language explanation of how Questigo is built 
> Last updated: 2026-07-03.

---

## 1. What Questigo Is (the one-paragraph pitch)

Questigo is a **game-based learning platform** for college students. A teacher uploads study material (a PDF), an AI turns it into interactive learning content, the teacher reviews and approves it, and students then learn by **playing through it** — not by reading slides or answering multiple-choice quizzes. The current build demonstrates the first fully playable game mechanic, the **Sequence Builder**, inside a **Skill Tree** progression system.

**Elevator line for the panel:** *"Instead of quizzes, students reconstruct real systems — like the SQL query execution pipeline — by assembling the steps in the correct order. It's learning by building, wrapped in a progression system with XP, levels, and achievements."*

---

## 2. The Gameplay Model (and why we chose it)

Two layered ideas:

1. **Skill Tree (progression system).** Each subject is a branching map of nodes. A node unlocks only when its prerequisite is completed. This mirrors how technical subjects actually build on each other, and it's visually obvious how far a student has progressed.

2. **Sequence Builder (the playable mechanic).** Inside a node, the student is shown shuffled concept tiles (e.g. `FROM`, `WHERE`, `GROUP BY`…) and must **reconstruct the correct pipeline**. The system validates each connection and gives targeted feedback.

**Why this model (defensible answers):**
- It is **not a quiz** — it tests *relational/structural understanding* (the order and dependencies between concepts), which is a higher level of understanding than recognizing a definition.
- It is **subject-agnostic** — CS is full of processes, lifecycles, and pipelines (SQL execution, normalization, OSI layers, SDLC, process lifecycle).
- It is **reliable to auto-generate** — asking an AI for "the correct order of these steps" is one of the most dependable AI tasks, which keeps the AI-generated content trustworthy.
- We deliberately scoped v1 to **linear sequences** (exact, safe validation) and postponed free-form graph building, because graphs have answer-ambiguity and harder validation. (Full reasoning in `GAMEPLAY_SEQUENCE_BUILDER.md`.)

---

## 3. Technology Stack (what and why)

| Layer | Technology | Why we picked it |
|---|---|---|
| Build tool | **Vite 5** | Fast dev server + instant HMR; lighter than CRA/webpack |
| UI library | **React 19** + **TypeScript** | Component model + type safety catches errors before runtime |
| Styling | **Tailwind CSS v4** | Utility-first; consistent dark theme via design tokens, no CSS sprawl |
| Components | **shadcn-style primitives** (Radix under the hood) | Accessible, unstyled primitives we style ourselves (Button, Card, Badge, Progress, Dialog) |
| Routing | **React Router 7** | Standard SPA routing with nested + protected routes |
| Global state | **Zustand** | Minimal, hook-based state; far less boilerplate than Redux |
| Server state | **TanStack React Query** | Ready for real API calls (caching, loading/error states) |
| Forms | **React Hook Form + Zod** | Performant forms with schema validation |
| Animation | **Framer Motion** | Meaningful transitions: tile movement, XP bar fill, level-up |
| Notifications | **sonner** | Toast notifications for achievements / level-ups |
| Icons | **Lucide React** | Single consistent icon set |

**Backend (Phase 1 built, not yet wired to the UI):** **Python + FastAPI + SQLAlchemy + PostgreSQL**, with JWT auth (PyJWT) and bcrypt password hashing. Provides `/api/v1/auth/register`, `/login`, and `/me`. The frontend still runs on mocked auth until integration (see §7). *Note: the original handbook proposed a Node/Express/Prisma backend; we chose FastAPI for Python familiarity and FastAPI's auto-generated API docs.*

---

## 4. Project Structure

```
questigo/
├── CLAUDE.md            # Engineering handbook (stays at root)
├── docs/                # All project documentation
│   ├── goal.md                      # Vision & objectives
│   ├── GAMEPLAY_SEQUENCE_BUILDER.md # Gameplay design spec
│   ├── TECHNICAL_GUIDE.md           # ← this file
│   ├── PROGRESS_LOG.md              # What's done / what's next
│   └── PHASE_0..5.md, LANDING_PAGE_REVIEW.md
└── client/              # React frontend (the running app)
    └── src/
        ├── components/ui/     # Reusable primitives (Button, Card, Badge…)
        ├── components/layout/ # Teacher layout & sidebar
        ├── features/          # One folder per feature area
        │   ├── landing/       # Public landing page
        │   ├── auth/          # Login / Register / Teacher login
        │   ├── dashboard/     # Student & Teacher dashboards
        │   ├── teacher/       # Upload / Generate / Approve (mock)
        │   └── play/          # ← the Sequence Builder game
        ├── lib/               # levels.ts, sequenceData.ts, utils, mockData
        ├── store/             # Zustand stores (auth, progress)
        ├── router/            # Route table + ProtectedRoute guard
        └── types/             # Shared TypeScript types
```

**Design principle:** one responsibility per file — components render, `lib/` transforms data, `store/` holds state. Feature folders own their own screens.

---

## 5. The Sequence Builder — How It Actually Works

This is the part the panel will ask about most. Here's the full pipeline.

### 5.1 The flow (3 screens, one route)
`/play/mission/:missionId` is a single page (`MissionPage.tsx`) that moves through three phases with animated transitions:
1. **Mission Brief** — "System Failure Detected" narrative + reward.
2. **Sequence Builder** — the actual game.
3. **Success Screen** — pipeline restored, XP animation, next node unlocked.

### 5.2 The data model (`lib/sequenceData.ts`)
Each mission is a plain object:
```ts
{
  id, order, node, title, topic, difficulty, xpReward,
  brief: { systemName, story },         // narrative framing
  prompt,                                // "Reconstruct the execution flow…"
  tiles: [{ id, label, sub }],           // CORRECT items, in canonical order
  distractors: [{ id, label, sub }],     // tiles that should never be placed
  linkExplanations: { "from->where": "…" } // teaching feedback per connection
}
```
The **canonical answer is simply the order of `tiles`**. This is exactly the shape an AI would emit from a PDF in the real system — which is why the design is "AI-ready."

### 5.3 The interaction (`SequenceBuilder.tsx`)
- All tiles (correct + distractors) start **shuffled** in a staging area.
- **Tap a tile** → it drops into the next empty pipeline slot. **Tap a placed tile** → it returns to staging.
- We use **tap-to-place** (not drag-and-drop) deliberately: it works *identically* on desktop and mobile/touch, which is more robust for a live demo. Framer Motion's shared-layout animation (`layoutId`) makes tiles visually *fly* between staging and slots, so it still feels like dragging.

### 5.4 The validation (the key technical point)
Validation is **per-link**, not just pass/fail:
- For each adjacent pair of slots, the link is **correct** if both slots hold the tile the canonical answer expects at those positions.
- Correct links turn **green ✓**, wrong links turn **red ✗**.
- For wrong links, we show the **`linkExplanation`** for the connection that *should* be there — e.g. *"SELECT executes after HAVING, not immediately after GROUP BY."* That turns a wrong answer into a teaching moment.
- **Retries are unlimited and carry no XP penalty.** Solving with zero failed validations earns a **Clean Build** bonus.

### 5.5 XP, levels, and progression
- **`lib/levels.ts`** holds a fixed XP→Level threshold table (Level 1 = 0 XP … Level 10 = 8000 XP). Level is **derived** from XP, never stored independently — so it can never drift.
- On a correct solve, **`authStore.addXp()`** adds the reward (+ bonus) and recalculates the level.
- **`progressStore`** records which missions are completed. A node is **available** only if it's the first node *or* its previous node is completed → this is how the **next node unlocks**.
- Both stores use Zustand `persist`, so progress and XP **survive a page refresh** (saved in `localStorage`).

---

## 6. Authentication & Roles (current state)

- Two roles: **STUDENT** and **TEACHER**.
- Login is currently **mocked** with static demo credentials in `authStore.ts` (no backend yet). On success the user object is stored in Zustand + `localStorage`.
- **`ProtectedRoute`** guards routes by role: a logged-out user is redirected to login; a teacher hitting a student route is redirected to their own dashboard, and vice-versa.
- Demo student login: **`alice@student.dev` / `student123`**. Demo teacher: **`teacher@questigo.dev` / `demo1234`**.

**Planned (real) version:** JWT issued by the Express backend, sent as `Authorization: Bearer <token>`, validated by `requireAuth` middleware.

---

## 7. What's Real vs. Mocked (be honest in the demo)

| Area | Status |
|---|---|
| Sequence Builder gameplay | ✅ **Fully functional** (real logic, validation, XP, unlocking) |
| Skill Tree + node unlocking | ✅ Fully functional |
| XP / level / progress persistence | ✅ Functional (localStorage) |
| Student & Teacher dashboards, landing, auth UI | ✅ Built |
| Login (frontend) / content data | ⚠️ **Mocked** — static credentials, hardcoded DBMS missions |
| Teacher Upload / Generate / Approve | ⚠️ UI mock (no real PDF parsing or AI yet) |
| Backend auth API (FastAPI + JWT + bcrypt + PostgreSQL) | ✅ **Built** (Phase 1), not yet connected to the frontend |
| Frontend ↔ backend integration, AI generation | ⛔ **Not built yet** — next steps |

This is the right MVP strategy: **prove the gameplay and architecture first**, wire the backend and AI after. (Matches CLAUDE.md §7 "MVP Boundaries.")

---

## 8. How to Run It

```bash
cd client
npm install      # first time only
npm run dev      # starts Vite on http://localhost:5173
```
Then log in as the demo student and open the **DBMS Skill Tree** from the dashboard.

Build check (proves it compiles): `npm run build`.

---

## 9. Likely Demo Questions & Answers

**Q: How is this different from a quiz app?**
A: A quiz tests recognition (pick the right option). Questigo tests *construction* — the student rebuilds a real process from its parts. It validates the *relationships* between concepts, which is deeper understanding.

**Q: Where does the AI fit in?**
A: In the full system, the teacher uploads a PDF, the AI segments it into topics and emits each Sequence Builder node as structured data (tiles + correct order + explanations). The teacher reviews and approves before students see it. The game's data model is already shaped exactly like that AI output, so plugging in the AI is a backend task, not a redesign.

**Q: Why is teacher approval mandatory?**
A: It's the safety net against AI mistakes. An AI could output a subtly wrong order; the teacher confirms the answer key before it goes live, so students never learn something incorrect.

**Q: How does the level system work?**
A: A fixed XP threshold table. XP only ever increases; the level is recalculated from total XP after each reward, so it's always consistent.

**Q: How does the next node unlock?**
A: A node becomes playable only when its predecessor is marked complete in the progress store. Completing a mission updates that store, which re-renders the tree with the next node active.

**Q: Why tap-to-place instead of drag-and-drop?**
A: Reliability across devices. Drag-and-drop is fiddly on touchscreens; tap-to-place behaves identically on phone and laptop, and we use motion animations so it still feels tactile. The design also keeps a vertical layout on mobile.

**Q: Is it responsive?**
A: Yes — mobile-first, tested down to 375px. The pipeline is vertical on phones and horizontal on larger screens.

**Q: What would you build next?**
A: The Phase 1 FastAPI auth backend is already built — next is wiring the frontend login to it, then the PDF-upload + AI-generation + teacher-approval flow, then additional node types (a coding-challenge node and a free-form Transition Graph). See `PROGRESS_LOG.md`.

---

## 10. Quick Glossary

- **Node** — one learning activity on the skill tree (one Sequence Builder mission).
- **Tile** — a single draggable concept piece (e.g. `WHERE`).
- **Distractor** — a tile that looks plausible but doesn't belong in the pipeline.
- **Clean Build** — solving a mission with zero failed validation attempts (earns bonus XP).
- **Track** — all the nodes for one subject (currently the DBMS track).
- **Pipeline** — the ordered sequence the student assembles.
