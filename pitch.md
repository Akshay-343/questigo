# Questigo — 10-Minute Demo Pitch

> **For:** MCA Major Project Internal Viva Voce — Osmania University
> **Presenter script + live-demo runbook.** Read the bold lines aloud; the indented notes are for you.

---

## 0. Before you walk in (2-minute setup checklist)

Start both servers a few minutes early so nothing loads cold in front of the panel.

| Step | Command / Action |
|---|---|
| 1. Start PostgreSQL | Ensure the `questigo_dev` database is running (Postgres 17 service). |
| 2. Start backend | In `server/`: `./.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000` |
| 3. Start frontend | In `client/`: `npm run dev` |
| 4. Open browser | `http://localhost:5173` — leave it on the landing page. |
| 5. Sanity check | Backend health: open `http://localhost:8000/health` → should show `{"data":{"status":"ok"}}`. |
| 6. API docs tab (optional flex) | Open `http://localhost:8000/docs` in a second tab — FastAPI auto-generates live Swagger docs. Great to show if asked about the API. |

**Demo logins (keep this visible on a sticky note):**

| Role | Email | Password |
|---|---|---|
| Student | `alice@student.dev` | `student123` |
| Student | `bob@student.dev` | `student123` |
| Teacher | `teacher@questigo.dev` | `demo1234` |

> The login screens also **display the demo credentials on-page**, so you don't have to memorise them.

---

## 1. The Hook (0:00 – 1:00) — *The Problem*

**"Most students learn programming passively — reading slides and answering multiple-choice quizzes. MCQs test recall, not thinking. Questigo turns learning into gameplay: students don't answer questions, they *rebuild broken systems* to earn XP and level up. And teachers don't hand-author content — they upload their existing PDF notes and AI turns them into playable quests."**

> Keep it to two sentences of problem + one sentence of solution. Don't over-explain — the demo will do the talking.

**One-line positioning:** *"A gamified learning platform where programming concepts are taught through game mechanics instead of quizzes, with AI-assisted content generation for teachers."*

---

## 2. Landing Page (1:00 – 1:30) — *Set the tone*

Start on `http://localhost:5173`.

**"This is the front door. Notice the pitch is aimed at educators: 'Turn your notes into gamified quests.' The mockup on the right previews the exact teacher workflow — upload a PDF, AI generates, teacher approves."**

> Scroll once so they see it's a real, polished product, then move on. Don't linger.

---

## 3. The Student Experience (1:30 – 5:00) — *This is the heart of the demo*

### 3a. Login → Dashboard (1:30 – 2:00)

Click **Student Login**, sign in as **Alice**.

**"Alice lands on a personalised dashboard. Everything is game-framed: an XP progress bar showing how far to the next level, her current level badge, systems restored, and achievements earned. This is real data from the database, not a mockup."**

> Point at the **XP bar** and the **Level 6** badge. Note "Continue Learning → DBMS" card.

### 3b. The Skill Tree (2:00 – 2:30)

Click into the **DBMS** track (or navigate to `/play/dbms`).

**"Instead of a flat list of chapters, a subject is a Skill Tree — a branching map of unlockable nodes. Completed nodes are 'Restored' (green), the next one is playable, and later nodes are locked until you earn your way there. The starred node is a Boss challenge."**

> This is the *progression* story. Show the three states: ✅ Restored, ▶ Play, 🔒 Locked.

### 3c. The Sequence Builder — *the marquee mechanic* (2:30 – 4:15)

Click **Play** on **Normalization Engine**. On the brief, click **Begin Reconstruction**.

**"Here's the core game mechanic — the Sequence Builder. The story framing is 'System Failure Detected: redundant data has flooded the schema engine. Rebuild the normalization pipeline.' The student has to construct the correct pipeline from raw data up to the strongest normal form."**

**Play it live** — tap tiles into the pipeline in order:
> **Unnormalized → 1NF → 2NF → 3NF → BCNF**

**"Notice two things. First, there's a *distractor* tile — 'Denormalized' — that does NOT belong. This is testing understanding, not memorisation. Second, when I hit Validate, it checks *every link* in the chain, not just the final answer."**

Click **Validate Pipeline**.

**"Every connection turns green, the system is 'Restored', and watch — I get an achievement toast, 'Clean Build', for solving it with zero mistakes. XP animates up, and this all persists to the server."**

> **This is your money moment.** Slow down here. The green-link validation + achievement toast + XP animation is the most impressive 10 seconds of the demo.

### 3d. Progression payoff — Profile & Leaderboard (4:15 – 5:00)

Navigate to **Profile**.

**"Her profile shows the RPG progression: total XP, level, quests completed, clean builds, and an achievements grid — earned ones lit up, locked ones greyed out as goals to chase."**

Navigate to **Leaderboard**.

**"And students are ranked against each other by XP — competitive motivation. This drives the 'one more quest' engagement loop that MCQs never create."**

---

## 4. The Teacher Experience + AI (5:00 – 8:30) — *The differentiator*

Log out, click **Teacher Portal**, sign in as **teacher@questigo.dev**.

### 4a. Teacher Dashboard (5:00 – 5:30)

**"Teachers get a management console — subjects, total quests, student count, all live from the database. But the feature that makes this project different is here: Generate Quests."**

### 4b. AI Generation — *do this LIVE* (5:30 – 7:30)

Go to **Generate Quests**. Choose **Sequence Builder**. In the **paste text** box, drop a paragraph of notes (have one ready — e.g. a paragraph on the OSI model, TCP handshake, or ACID properties). Set **Subject** to a name, **Quests to generate = 1**, click **Generate Quests**.

**"I'm pasting raw lecture notes — the kind of thing a teacher already has. The AI reads it and generates a complete playable quest: a title, the game story framing, the ordered concept tiles, wrong-answer distractors, and a per-step explanation for each link. This runs on a real LLM — Groq's Llama 3.3 70B."**

> It takes a few seconds. Fill the silence: *"It's not just extracting keywords — it's designing a game level: what's the correct order, what plausible-but-wrong distractors to add, and why each step follows the last."*

**"Now — critically — notice it did NOT go live to students. It landed as a *draft* in the approval queue."**

### 4c. Teacher Approval Gate (7:30 – 8:30)

You'll be on **Approve Content** with the new draft in **Pending**.

**"This is the safety net. AI can make mistakes, so nothing an AI generates ever reaches a student automatically. The teacher reviews it, can edit the tiles and answer key, and only then Approves. This 'human-in-the-loop' design is what makes AI-generated content trustworthy for actual teaching."**

> Click **Approve** (or Reject) to show the state change. If you approved, mention: *"Now it's live — students see a new track appear automatically."*

---

## 5. The Second Mechanic — Coding Challenge (8:30 – 9:15)

**"The platform isn't limited to one game type. The other node type is a real Coding Challenge — an in-browser Monaco editor, the same one that powers VS Code. Students write actual Python, hit Run, and the backend executes it against hidden test cases in a sandboxed subprocess and awards XP only when every test passes."**

> If a coding quest is unlocked, open it and run a solution. If not, describe it (you've verified it works) or show `http://localhost:8000/docs` → the `/challenges/{slug}/run` endpoint. Don't burn time fighting the tree lock — a confident description is fine here.

---

## 6. Close (9:15 – 10:00) — *Architecture + Vision*

**"Under the hood: a React + TypeScript frontend, a Python FastAPI backend, and PostgreSQL — a clean, layered, three-tier architecture. The key design decision is that every game mechanic is just a *quest kind* in one unified schema, so adding a new game type is a small, isolated change — the platform is built to grow."**

**"Where it goes next: adaptive difficulty, multiplayer coding battles, more subjects beyond DBMS, and a hardened code sandbox for production. But the core thesis is proven here today — programming can be taught as an adventure, and AI can do the heavy lifting of content creation while teachers stay in control."**

**"Thank you — happy to take questions."**

---

## 7. Anticipated Q&A — *rehearse these*

**Q: Is the AI real or hardcoded?**
> Real. It calls Groq's Llama 3.3 70B through an OpenAI-compatible API. The provider is env-configurable, so it can swap to OpenAI by changing one variable. There's also a deterministic offline fallback so the demo never dies if the network drops.

**Q: How do you stop the AI from teaching students something wrong?**
> Every AI output is a *draft* with status `PENDING_TEACHER_REVIEW`. It's invisible to students until a teacher approves it, and the teacher can edit the answer key first. Human-in-the-loop by design.

**Q: How is the coding challenge graded / is it safe?**
> Student code runs in an isolated (`python -I`) short-lived subprocess with a 5-second timeout, compared against stored test cases. For the MVP this is a lightweight runner; production would use a containerised judge like Judge0 — that's a documented, planned upgrade, not an oversight.

**Q: How does levelling work?**
> XP is additive and awarded server-side only after a quest is confirmed complete (idempotent — replaying awards nothing). Level is derived from a fixed XP threshold table, recalculated on every XP change. A "clean build" (zero wrong validations) earns a bonus.

**Q: Why FastAPI/Python instead of Node?**
> Python for the AI ecosystem and readability, FastAPI for automatic OpenAPI/Swagger docs and Pydantic validation. It's a clean layered design: routes → services → CRUD → models.

**Q: Is the data real or mocked?**
> All real and persisted in PostgreSQL. XP survives across sessions and devices — I can log in as Alice on another machine and her progress is there. There is no mock data left in the app.

**Q: What's the database design?**
> Users, Subjects, Quests, and per-quest content (tiles + links for sequences, or a coding-challenge row), plus QuestAttempts for progress and an Achievements catalogue with per-user unlocks. One quest table serves every game type via a `kind` discriminator.

**Q: What was the hardest part?**
> Designing the content model so one schema cleanly supports *different* game mechanics, and building the AI generation so its output slots directly into that model as a reviewable draft.

---

## 8. If something breaks — recovery moves

- **A screen won't load:** it has loading skeletons + error states; refresh once. All routes have error boundaries, so you won't get a white screen.
- **Backend seems down:** re-run the uvicorn command; check `http://localhost:8000/health`.
- **AI generation hangs / no key:** it falls back to the offline generator automatically — still produces a valid draft. You can say *"that's the offline fallback working as designed."*
- **Lost your place:** every page has a back link in the header; `/dashboard` (student) and `/teacher/dashboard` (teacher) are home base.
- **Don't** click browser-back rapidly during the XP animation; let it finish, then navigate via the in-app links.

---

## 9. The 30-second version (if they cut you short)

**"Questigo teaches programming through gameplay instead of quizzes. Students rebuild broken systems — like a database normalization pipeline — to earn XP, level up, unlock achievements, and climb a leaderboard. Teachers upload their PDF notes and AI generates the playable quests, which the teacher approves before students ever see them. It's built on React, FastAPI, and PostgreSQL, and every game mechanic plugs into one unified schema so the platform can keep growing."**
