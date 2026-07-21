# GAMEPLAY_SEQUENCE_BUILDER.md — Questigo

> The first fully playable game mechanic in Questigo.
> Status: **Design finalized — not yet implemented.**
> Related: `goal.md` (vision), `CLAUDE.md` (engineering handbook).

## Design Decisions Locked

- **Skill Tree** is the overall progression system.
- **Sequence Builder** is the first fully playable mechanic.
- **Free-form Transition Graph** is postponed to a later phase.
- **Teacher approval of AI-generated answer keys is mandatory.**
- v1 optimizes for **reliability, demo value, and AI-generation compatibility**.
- The experience must feel like **constructing a system/process/pipeline — never like a quiz.**

---

## 1. Gameplay Vision

The Sequence Builder turns a topic into a **pipeline a student assembles with their own hands**. Scattered concept tiles are dropped into an ordered track, snapping together into a working process the student can see flow end to end.

The emotional target is the quiet satisfaction of **making something fit** — the feeling of wiring a pipeline, ordering migration steps, or laying out an architecture — not the test-anxiety of a multiple-choice question.

Three principles separate this from a quiz:

1. **Construction over selection.** The student *builds* a structure; they don't pick A/B/C/D.
2. **Visible system.** The result is a connected pipeline that visibly "runs," not a graded answer.
3. **Forgiving iteration.** Rearranging is free and encouraged. Being wrong is a step in building, not a failure.

Why it fits MCA / engineering students: their entire field *is* processes, pipelines, lifecycles, and layered architectures. Assembling them is how they already think.

---

## 2. Core Loop

```
Enter node
   → Tiles shuffled into the staging area
      → Student drags/taps tiles into ordered pipeline slots
         → Student presses "Check Structure"
            → System validates each connection
               → Correct: pipeline locks, XP awarded, node complete, next unlocks
               → Incorrect: wrong links flagged with reasons → retry
```

The loop is short (target 30–90 seconds per node) and repeatable across every structural topic in the curriculum.

---

## 3. Student Journey

1. **Dashboard** — student sees XP bar, level, and a "Continue" prompt into a subject map.
2. **Skill Tree** — student picks an available (unlocked, pulsing) node.
3. **Briefing** — a slide-in panel shows the topic, difficulty, XP reward, and a "Build the pipeline" button.
4. **Sequence Builder** — tiles are shuffled in the staging area; the student assembles the pipeline.
5. **Validation** — on "Check Structure," each link turns green (correct) or red (wrong, with a one-line reason).
6. **Success** — the full pipeline pulses and "runs," XP sweeps up, achievements may unlock.
7. **Return to map** — the completed node glows; the next node unlocks; the student moves on.

---

## 4. UI Layout

Three stacked regions on the builder screen:

- **Header** — topic title, difficulty chip, attempt/streak indicator, optional soft timer (for bonus only, never a fail condition).
- **Staging area** — shuffled, unplaced tiles. Concept name + optional one-line hint.
- **Pipeline track** — numbered, connected drop slots. Arrows render automatically between filled slots, forming the visible pipeline.
- **Action bar** — "Check Structure" primary button; "Hint" secondary (small XP cost).

Layout adapts: horizontal track on desktop/tablet, vertical track on mobile (see §11).

---

## 5. Interaction Model

**Desktop / tablet**
- Drag a tile from staging into a slot. Tile snaps; an arrow connects it to its neighbor.
- Drag a placed tile back out or to another slot to rearrange. Slots reflow.
- "Check Structure" validates the current arrangement.

**Mobile**
- Tap-to-select, tap-to-place (no fine-grained edge dragging — see §11).
- Long-press a placed tile to remove it.

**Feel rules**
- Snapping is animated and tactile (soft scale + click).
- Empty slots show a dashed placeholder so the target structure is always legible.
- Rearranging is unlimited and penalty-free before checking.

---

## 6. Validation Rules

**v1 scope: linear sequences only.** Validation is exact and safe.

- The canonical answer is an ordered list. Validation compares the student's order to it.
- **Per-link validation, not just pass/fail.** Each adjacency (slot N → slot N+1) is evaluated so feedback can target the *specific* wrong connection.
- **Support multiple acceptable orders** where a topic genuinely allows them: the answer key is a *set* of valid sequences, and a match against any one passes. (Most v1 topics have a single correct order; the schema supports more so we never mark a defensible answer wrong.)
- **Teacher-approved answer key is the source of truth** — never the raw AI output (see §10).
- Feedback messages are content-specific and instructive, e.g. *"SELECT executes after HAVING, not before it."*

Hard rule: **the system must never mark a correct answer wrong.** When in doubt, widen the accepted set rather than risk a false negative.

---

## 7. XP & Reward System

Aligned with `CLAUDE.md` gamification rules (XP additive, level from fixed threshold table).

- **Base XP** — awarded on a correct pipeline (`Quest.xpReward`).
- **Clean Build bonus** — solved with zero incorrect "Check" attempts.
- **Speed bonus** (small) — completed before the soft timer empties. Never punitive; absence of the bonus is the only effect.
- **Hint cost** — each hint reduces potential bonus (not base XP), keeping learning low-stakes.
- On success: XP bar sweep animation → level recalculation → `checkAchievements()` → achievement toast if unlocked.

Retries carry **no XP penalty** — the design rewards persistence, not perfection.

---

## 8. Difficulty Progression

Difficulty scales along several independent dials so the same mechanic stays fresh:

| Dial | Easy | Medium | Hard |
|---|---|---|---|
| Tile count | 4–5 | 6–7 | 8+ |
| Distractors | none | 1 irrelevant tile | 2+ plausible distractors |
| Scaffolding | first & last slot pre-filled | only first pre-filled | empty track |
| Labels | full names | abbreviations | terse / symbolic |
| Hints | free | small cost | costly |

A topic's `difficulty` field drives the dials. Boss-style end-of-topic nodes use the Hard column.

---

## 9. AI Content Generation Requirements

The AI, given approved PDF content, must emit per node:

```
{
  "topic": "SQL Query Execution Order",
  "subject": "DBMS",
  "type": "SEQUENCE",
  "difficulty": "EASY | MEDIUM | HARD",
  "tiles": [
    { "id": "t1", "label": "FROM",     "hint": "..." },
    { "id": "t2", "label": "WHERE",    "hint": "..." }
  ],
  "distractors": [ { "id": "d1", "label": "COMMIT" } ],
  "answerKeys": [ ["t1","t2","t3","t4","t5","t6"] ],
  "linkExplanations": {
    "t1->t2": "Rows are filtered by WHERE only after the source is read in FROM."
  },
  "status": "PENDING_TEACHER_REVIEW"
}
```

Requirements:
- Output **at least one full canonical order**; multiple when the topic genuinely allows.
- Provide a **per-link explanation** for instructive feedback.
- Mark optional **distractors** explicitly so they're never required in the answer.
- Always emit `status: PENDING_TEACHER_REVIEW` — AI output is a draft, never live.
- Keep tile counts within the difficulty band.

Reliability note: sequence ordering is among the most reliable AI generation tasks, which is exactly why it leads v1.

---

## 10. Teacher Review Workflow

AI output is a **draft**; the teacher is the source of truth.

```
AI generates draft node (status: PENDING_TEACHER_REVIEW)
   → Teacher opens review screen
      → Sees tiles, proposed order, distractors, explanations
         → Teacher can: reorder, edit labels, add/remove tiles,
           add an alternate valid order, edit explanations
            → Teacher clicks "Approve"
               → status: PUBLISHED → node becomes playable
```

- A node **cannot appear in the student Skill Tree until approved.**
- The teacher can add **alternate accepted orders** — the primary defense against false-negative grading.
- Edits are versioned so an approved key is stable even if the source PDF is regenerated.

---

## 11. Mobile Experience (375px minimum)

Free-form edge dragging is deliberately avoided on mobile. Instead:

- **Vertical track.** The pipeline runs top-to-bottom; staging tiles sit above or in a drawer.
- **Tap-to-place.** Tap a staging tile (it highlights) → tap a slot. No drag precision required.
- **Long-press to remove** a placed tile; tap two placed tiles to swap.
- Slots are full-width, finger-sized; arrows render vertically (↓) between them.
- "Check Structure" pins to the bottom action bar.

This keeps the mechanic fully playable on a phone — a key reason linear sequencing leads over free-form graphs.

---

## 12. Future Evolution into Transition Graphs

Sequence Builder is the on-ramp to the postponed **Transition Graph** mechanic:

- **Shared canvas & tiles** — the same node/snap system extends from a single track to a 2D canvas.
- **From order to edges** — instead of one linear chain, students draw multiple valid edges between fixed-position state nodes (e.g., Process Lifecycle with branching transitions and cycles).
- **Validation upgrade** — compare the student's *edge set* against accepted edge sets, still per-link, still teacher-approved.
- **Why later** — graph validation has acceptable-answer ambiguity, higher AI error risk, and harder mobile UX. We ship sequencing, prove the loop and the teacher-approval safety net, then graduate.

---

## Screen Mockups

### A. Student Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  QUESTIGO                              ⚙  🔔   [ Akshay ▾ ]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Welcome back, Akshay 👋                                      │
│                                                                │
│   ┌── LEVEL 4 ───────────────────────────────────────────┐    │
│   │  ▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱   720 / 1200 XP  →  Level 5   │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ Quests      │  │ Achievements│  │ Rank        │            │
│   │   12 done   │  │    6 / 8    │  │    #3       │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                │
│   Continue Learning                                            │
│   ┌──────────────────────────────────────────────────────┐    │
│   │  DBMS                          ◑ 40% mastered          │    │
│   │  Next up: SQL Query Execution Order       [ Resume → ] │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
│   Your Subjects                                                │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│   │   DBMS     │  │     OS     │  │  Networks  │               │
│   │  ◑ 40%     │  │  ◔ 15%     │  │  ○ 0%      │               │
│   └────────────┘  └────────────┘  └────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

### B. Skill Tree (Subject Map)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Dashboard      DBMS — Skill Tree            ◑ 40% mastered  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│        ╔═══════════╗                                           │
│        ║ ✓ SQL      ║   completed (glowing)                    │
│        ║   Basics   ║                                           │
│        ╚═════╤═════╝                                            │
│              │                                                  │
│        ╔═════▼═════╗                                            │
│        ║ ◉ SQL      ║   ◉ AVAILABLE (pulsing) — click me        │
│        ║  Execution ║                                           │
│        ║   Order    ║                                           │
│        ╚═════╤═════╝                                            │
│         ┌────┴────┐                                             │
│   ╔═════▼═══╗ ╔══▼══════╗                                       │
│   ║ 🔒 Normal║ ║ 🔒 Trans ║   locked (dimmed)                   │
│   ║  ization ║ ║  actions ║                                     │
│   ╚═════╤═══╝ ╚══╤══════╝                                       │
│         └────┬───┘                                              │
│        ╔═════▼═════╗                                            │
│        ║ 🔒 Indexing║   🔒 locked                               │
│        ║  (BOSS)    ║                                           │
│        ╚═══════════╝                                            │
│                                                                │
│   Legend:  ✓ done   ◉ available   🔒 locked                    │
└──────────────────────────────────────────────────────────────┘
```

### C. Sequence Builder Screen (desktop — mid-build)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Map     SQL Query Execution Order      [MEDIUM]   ⏱ 0:42    │
├──────────────────────────────────────────────────────────────┤
│  Build the pipeline: arrange the clauses in execution order.   │
│                                                                │
│  STAGING (drag a tile down into a slot)                        │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────┐              │
│  │  WHERE │  │ ORDER  │  │  COMMIT  │  │ HAVING │              │
│  │        │  │   BY   │  │ (unused?)│  │        │              │
│  └────────┘  └────────┘  └──────────┘  └────────┘              │
│                                                                │
│  ── PIPELINE ───────────────────────────────────────────────  │
│                                                                │
│   ┌──────┐   ┌──────────┐   ┌ ─ ─ ─ ┐   ┌ ─ ─ ─ ┐             │
│   │ FROM │ → │ GROUP BY │ → │   2   │ → │   3   │ → ...        │
│   └──────┘   └──────────┘   └ ─ ─ ─ ┘   └ ─ ─ ─ ┘             │
│      1            (filled)    (empty)     (empty)              │
│                                                                │
│                                          [ Hint ]  [ Check ▸ ] │
└──────────────────────────────────────────────────────────────┘
```

### D. Validation Feedback (after "Check Structure" — partially wrong)

```
┌──────────────────────────────────────────────────────────────┐
│  SQL Query Execution Order            Check #1 · 2 issues      │
├──────────────────────────────────────────────────────────────┤
│  ── PIPELINE ───────────────────────────────────────────────  │
│                                                                │
│   ┌──────┐  ✓  ┌──────────┐  ✗  ┌────────┐  ✓  ┌────────┐     │
│   │ FROM │ ══▶ │ GROUP BY │ ──▶ │ SELECT │ ══▶ │ ORDER  │     │
│   └──────┘green└──────────┘ RED └────────┘green│   BY   │     │
│                              ▲                  └────────┘     │
│                              │                                 │
│   ┌──────────────────────────┴───────────────────────────┐    │
│   │ ✗  SELECT executes AFTER HAVING, not right after      │    │
│   │    GROUP BY. Place HAVING before SELECT.              │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
│   Green links are locked. Fix the red link and re-check.       │
│                                          [ Hint ]  [ Check ▸ ] │
└──────────────────────────────────────────────────────────────┘
```

### E. Success Screen

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│                    ✦  PIPELINE COMPLETE  ✦                     │
│                                                                │
│   ┌────┐→┌──────┐→┌────────┐→┌────────┐→┌────────┐→┌───────┐  │
│   │FROM│ │WHERE │ │GROUP BY│ │ HAVING │ │ SELECT │ │ORDER BY│  │
│   └────┘ └──────┘ └────────┘ └────────┘ └────────┘ └───────┘  │
│        ～～ flow animation runs left → right ～～               │
│                                                                │
│        ┌──────────────────────────────────────────┐           │
│        │   + 150 XP        🎯 Clean Build (+30)     │           │
│        │   ⚡ Speed Bonus (+20)                      │           │
│        └──────────────────────────────────────────┘           │
│                                                                │
│        🏆 Achievement Unlocked: "Pipeline Architect"           │
│                                                                │
│        [ Back to Map ]            [ Next Node → ]              │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### F. XP Progression (post-success, on dashboard return)

```
┌──────────────────────────────────────────────────────────────┐
│   LEVEL 4                                                      │
│   before:  ▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱   720 / 1200 XP                │
│            ╲                                                    │
│             ╲  +200 XP earned                                  │
│              ▼                                                 │
│   after:   ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱   920 / 1200 XP                │
│            (animated sweep fills the bar)                      │
│                                                                │
│   ── on level-up (if threshold crossed) ──                     │
│   ┌──────────────────────────────────────────┐                │
│   │   ⬆  LEVEL UP!   Level 4 → Level 5         │                │
│   │      Badge flips · confetti burst          │                │
│   └──────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

### G. Mobile Sequence Builder (375px — vertical track, tap-to-place)

```
┌──────────────────────┐
│ ← SQL Exec Order  ⏱   │
├──────────────────────┤
│ Tap a tile, tap a slot│
│                       │
│ STAGING               │
│ [WHERE] [ORDER BY]    │
│ [HAVING] [COMMIT?]    │
│                       │
│ PIPELINE              │
│   ┌────────────┐      │
│ 1 │ FROM       │      │
│   └─────┬──────┘      │
│         ↓             │
│   ┌────────────┐      │
│ 2 │ GROUP BY   │      │
│   └─────┬──────┘      │
│         ↓             │
│   ┌ ─ ─ ─ ─ ─ ┐       │
│ 3 │  tap to    │  ◀── │
│   │  place     │ selected
│   └ ─ ─ ─ ─ ─ ┘       │
│         ↓             │
│   ┌ ─ ─ ─ ─ ─ ┐       │
│ 4 │            │      │
│   └ ─ ─ ─ ─ ─ ┘       │
├──────────────────────┤
│ [ Hint ]  [ Check ▸ ] │
└──────────────────────┘
```

---

## Open Questions to Resolve Before Build

1. **Soft timer** — include in v1 for the speed bonus, or defer? (Adds tension but also pressure; could feel quiz-like.)
2. **Distractor tiles** — ship in v1 (Medium/Hard) or hold for a later polish pass?
3. **Multiple-valid-order topics in v1** — which seed topics genuinely need >1 accepted order? (Likely few; confirm during seeding.)
4. **Hint content** — per-tile hint vs. one global "reveal one correct adjacency" hint.

These are gameplay-tuning questions, not blockers. The design above is implementation-ready once they're answered.
