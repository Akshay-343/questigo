# Questigo — Live Demo Script (Final External Presentation)

A minute-by-minute runbook for the live application demo, to run right after (or woven into) the PPT. Rehearse this once end-to-end before the actual day — a couple of steps below describe game mechanics from screenshots rather than a live run, so confirm the exact clicks yourself beforehand.

**Total live-demo budget: ~7–8 minutes**, leaving room for the ~10-minute PPT walkthrough and Q&A inside a typical 20–25 minute slot. Cut Part 3 short (or skip the coding/arena replay) if you're running long — Part 2's Sequence Builder pass is the one beat not to lose, since it's the clearest illustration of "construction, not recognition."

---

## 0. Before You Walk In (T-15 min)

- [ ] **Reset to known-good data.** `docker compose down -v && docker compose up -d` (or `docker\reset-snapshot.bat`) — gives you Alice at 2,300 XP / Level 6/7 and a clean approval queue, matching the numbers in the report/PPT.
- [ ] **Confirm both apps are reachable:** http://localhost:5173 (frontend) and http://localhost:8000/health (backend → `{"status":"ok"}`).
- [ ] **Check internet connectivity** if you intend to run AI generation live against Groq. If the venue's wifi is unreliable, decide *now* whether to skip live generation and instead show the pre-approved draft already in the seed data (see Part 3's fallback note) — don't discover a dead connection mid-sentence in front of the panel.
- [ ] **Open two browser tabs**, both at the landing page, logged out: one for the student walkthrough, one for the teacher walkthrough. Switching tabs beats logging out/in mid-demo.
- [ ] **Zoom the browser to 100–110%** and maximize the window so text is readable from the back of the room; close devtools/extra tabs/notifications.
- [ ] Have `docs/Viva_QA_Preparation.md` open on a second screen or printed, for the Q&A that follows.
- [ ] Know your fallback: if something on stage genuinely breaks, you have the screenshots already embedded in the PPT (slides 12–18) — narrate over those rather than fighting a broken live state in front of the panel.

---

## 1. Landing & Framing (30 seconds)

Open the landing page (tab 1). Don't dwell — one line, then move:

> "This is Questigo, live — nothing you're about to see is mocked or scripted. Every screen is reading from a real PostgreSQL database. I'll walk through it as a student first, then as a teacher."

Click **Login**.

---

## 2. Student Journey (~4 minutes)

**Log in as `alice@student.dev` / `student123`.**

### 2a. Dashboard (20s)
Point at the XP bar and level badge.
> "Alice has 2,300 XP, Level 6. This isn't stored as a level — it's recalculated from total XP every time, against a fixed threshold table, so it can never drift out of sync."

### 2b. Skill Tree (30s)
Open the **DBMS** subject → its Skill Tree.
> "This is the prerequisite-gated progression — nodes unlock only once their predecessor is complete. Alice has restored SQL Execution Engine and Normalization Engine already; Transaction Controller is the next one available — it's flagged as the Boss System for this track."

### 2c. Sequence Builder — the core mechanic (90s)
Open **Transaction Controller → Transaction Lifecycle** (mission brief: *"The transaction controller has lost track of its states — commits and rollbacks are firing out of sequence. Repair the transaction lifecycle so every transaction reaches a safe final state."*) → **Begin Reconstruction**.

- Place a tile in the **wrong** position first (the `Failed` tile reads "a separate abort path" — it's the distractor). Let it fail.
  > "Notice it doesn't just say 'wrong' — it tells you *why*: 'A transaction moves from Active to Partially Committed after its last operation executes.' That's the difference from a quiz — a wrong answer here is a teaching moment, not a dead end."
- Pull it back, place the tiles in the correct order instead, and submit.
  > "And every connection is checked independently, not the sequence as one blob — so partial understanding gets partial, specific feedback."
- Let the XP-award animation play.

### 2d. Code Forge (60s)
Back to Skill Tree → **Index Engine → Build a Lookup Index** (prompt: *implement `solution(keys)` returning the unique values in `keys`, sorted ascending*).

Type the solution live — it's a one-liner, low-risk to type on stage:
```python
def solution(keys):
    return sorted(set(keys))
```
Click **Run** → all test cases pass → submit for XP.
> "This runs in an isolated Python subprocess with a hard timeout on the server — not in the browser. If I'd written something wrong, the server would say so; nothing about correctness is decided client-side."

### 2e. Rapid Arena (45s)
Open an Arena quest (e.g. **DBMS Rapid Fire — Query Engine Arena**). Answer one question correctly, then deliberately answer one **wrong** to show the heart/streak reset live, then finish the round.
> "The answer key never reaches the browser ahead of time — each round is graded server-side, one question at a time, exactly like the other two mechanics. This one tests recall speed under pressure; it's deliberately not trying to test the same thing Sequence Builder and Code Forge do."

### 2f. Profile & Leaderboard (20s)
Open **Profile** (achievements grid, completed-quest history), then **Leaderboard**.
> "Everything here is a live query ordered by XP — Alice and Bob are both real seeded accounts, not placeholder rows."

---

## 3. Teacher Journey — AI Generation & Approval (~2.5 minutes)

Switch to tab 2. **Log in as `teacher@questigo.dev` / `demo1234`.**

### 3a. Teacher Dashboard (15s)
> "Real subject, quest, and student counts — same principle, nothing hardcoded."

### 3b. Generate (60s)
Open **Generate Quests**. Paste a short paragraph of study notes (have 3–4 sentences on a topic ready in a text file beforehand — e.g. a short paragraph on B-Tree indexing or ACID properties), choose a quest kind (**Sequence Builder** is the most visually convincing), set quests-to-generate to 1, and submit.

> "This goes to Groq — a live LLM call, not a canned response — and comes back as a structured draft: ordered steps, distractors, and per-link explanations, in the same shape a hand-authored quest would use."

**Fallback if the network is unreliable:** skip live generation and instead open **Approve Content**, where a draft generated *before* the demo is already sitting in the `PENDING_TEACHER_REVIEW` queue. Say so plainly rather than pretending it just happened:
> "I generated this one earlier to avoid depending on conference wifi — here's what the review screen looks like."

### 3c. Approve (45s)
Open **Approve Content**, open the new (or pre-staged) draft.
> "Nothing an AI produces reaches a student until this step. I can see the full answer key here, edit it if needed, and only then approve it — that's the safety net against a wrong or nonsensical AI-generated quest ever reaching a real student."

Click **Approve**.

*(Optional, if time allows: switch back to Alice's tab, refresh the Skill Tree, and show the newly-approved quest now appearing as playable — the strongest possible proof the pipeline is real and not staged.)*

---

## 4. Close (20 seconds)

> "That's the full loop: three mechanics testing three different kinds of thinking, one shared progression engine underneath, and an AI content pipeline that never bypasses a human. Everything you just saw was reading from and writing to a live database — happy to take questions, or go deeper into the architecture, the schema, or the anti-spoof design."

Hand off to Q&A — see `docs/Viva_QA_Preparation.md`.

---

## What Not To Do Live

- **Don't demo the DETECTIVE mechanic** — it was built and deliberately retired (Section 5.12 of the report). If asked, explain it verbally; don't go looking for it in the UI.
- **Don't open `.env` files, a terminal with secrets visible, or the raw database** in front of the panel.
- **Don't attempt a fresh `docker compose up` cold-start live** — that's a 1–2 minute dead-air risk. Have the stack already running and healthy before you're called up.
- **Don't apologize for or dwell on the mocked/limitations areas** (code sandbox isolation level, Python-only runner) unless asked — they're honestly documented in the report; raising them unprompted just eats your time budget.

## If Something Breaks Mid-Demo

1. Stay calm, keep talking — describe what *should* happen while you glance at the fix.
2. Most likely failure: a stale page after a backend restart → refresh the tab.
3. Second most likely: Groq request timeout/network hiccup during generation → fall back to the pre-staged draft (3b above) without breaking stride.
4. If the whole stack is down and won't recover quickly, pivot immediately to the screenshots already in the PPT (slides 12–18) and narrate over them — a confident narrated screenshot beats a visibly panicked live retry.

## Quick Reference — Demo Accounts

| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@questigo.dev` | `demo1234` |
| Student (main demo account) | `alice@student.dev` | `student123` |
| Student (leaderboard contrast) | `bob@student.dev` | `student123` |
