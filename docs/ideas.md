# ideas.md — Candidate Game Mechanics (Round 3)

> Design constraint that kills the earlier arcade ideas: **engagement-minutes per unit of authored content.**
> A 10-question rapid-fire level is consumed in ~60 seconds and demands endless material.
> The Code Forge (Monaco editor) gets 10–20 minutes from ONE seeded challenge, because the
> depth comes from the student's own attempts — not from content volume.
>
> So every idea below follows the same shape: **one authored scenario + a live system the
> student pokes at = long open-ended engagement.** Game feel comes from interacting with a
> living system and watching it respond, not from timers and falling blocks.

---

## The balance scorecard

Every idea is rated on the four things that matter to us:

| Axis | Meaning |
|---|---|
| **Content cost** | How much material a teacher/AI must author per 10 minutes of play |
| **Engagement** | Expected minutes a student stays in one node |
| **Game feel** | Does it feel like playing, not answering |
| **Build cost** | New engineering surface area (given what already exists) |

---

## Idea 1 — Data Detective (SQL Sandbox Missions) ⭐ RECOMMENDED

**One line:** A live, queryable database + a mystery to solve. The student writes real SQL
against real seeded tables to chase clues through a case.

**The fantasy:** you're the database forensics expert. "Someone deleted the exam records
the night before results. The logs are in these 4 tables. Find who."

**Core loop:**
```
Open case → see the case brief + schema panel (tables, columns)
   → write SQL in the editor → Run → real result rows come back
      → result matches a clue checkpoint → clue unlocks, story advances
         → 3–5 checkpoints per case → final answer → case closed, XP
```

**Why it's the balanced pick:**
- *Content cost:* **one case = one schema + seed rows + 3–5 checkpoint queries.** AI is
  genuinely good at generating this (schema + INSERTs + expected result sets), and the
  teacher-approval flow we already trust for Sequence Builder applies unchanged.
- *Engagement:* a 4-checkpoint case is easily **15–30 minutes** — every wrong query is the
  student's own experiment, zero extra content needed. Exploration (SELECT * poking around)
  is itself gameplay.
- *Game feel:* comes from **the database being real**. Running a query and watching actual
  rows return IS the dopamine — same reason the code editor already works. Clue-unlock
  progression + case narrative give it stakes without any timer.
- *Build cost:* moderate but heavily reusable — Monaco editor (already integrated), results
  table UI (similar to test-results table), backend runs student SQL against a **per-mission
  SQLite database** (in-memory, rebuilt from seed script per run — no sandboxing nightmare,
  no touching the real Postgres).

**Validation:** compare the student's result set to the checkpoint's expected result set
(order-insensitive unless ORDER BY is the lesson). Never grade the SQL text — only the
result. Multiple correct queries naturally pass. This is the same "never mark a right answer
wrong" principle from the Sequence Builder doc, and it's even safer here.

**Difficulty dials:** table count, join depth, whether the schema panel shows column
descriptions, whether checkpoints give the expected row-count as a hint.

**DBMS-native, and the flagship demo moment:** "students learn SQL by solving crimes in a
real database" is a one-sentence pitch that lands.

---

## Idea 2 — Repair Bay (Debug Missions in the existing editor)

**One line:** Instead of writing code from scratch, the student is dropped into a broken
program with N planted bugs and a failing test suite. Fix the system.

**The fantasy:** the system crashed in production. Here's the smoking wreck and its
diagnostics panel. Bring it back online.

**Core loop:**
```
Open mission → code loads with 3–5 planted bugs → test panel shows 1/6 passing
   → student reads, diagnoses, edits → Run Tests
      → each newly passing test = "subsystem restored" (integrity bar rises 17% → 50% → 83%)
         → all green → system reboots (animation) → XP
```

**Why it's balanced:**
- *Content cost:* **cheapest of all** — take any existing coding challenge's solution,
  plant bugs in it, done. AI can generate "correct solution + 4 realistic bugs + tests"
  in one shot; teacher review = read one function.
- *Engagement:* debugging is slower and stickier than writing — reading comprehension +
  diagnosis stretches one mission to 10–20 minutes.
- *Game feel:* the **integrity bar rising per fixed subsystem** converts the test table
  into a health bar. It's the boss-battle feel, earned through real work instead of trivia.
- *Build cost:* **near zero** — it's a new mission `kind` on top of `CodingChallenge.tsx`
  with a restyled results panel. Could ship in days.

**Also teaches the skill nothing else covers:** reading someone else's code. Arguably more
job-relevant than writing from a blank slate.

---

## Idea 3 — Terminal Infiltration (simulated shell missions)

**One line:** A fake in-browser Linux terminal over a virtual file system. Missions like
"a rogue process is eating memory — find it in the logs, trace its config file, kill it."

**The fantasy:** full hacker-movie energy. Green-on-black, blinking cursor, `ls`, `cat`,
`grep`, `ps`, `kill`. Every CS student secretly wants this.

**Core loop:**
```
Mission brief → terminal boots into a scenario file system
   → student explores with real commands → discovers clues in files/logs
      → objectives check off as evidence is found ("config located ✓")
         → final action (kill PID / delete payload / edit config) → mission complete
```

**Why it's balanced:**
- *Content cost:* one scenario = a JSON file-tree + objective triggers. A single authored
  scenario yields 10–20 minutes of exploration.
- *Engagement:* exploration IS the gameplay — same open-ended property as the editor.
- *Game feel:* **highest of any idea here.** A terminal that responds to you is inherently
  a toy; the fiction does the rest. Zero timers needed.
- *Build cost:* the real cost — a command interpreter (~15 commands: ls, cd, cat, grep,
  find, ps, kill, head, tail, echo, chmod...) over an in-memory JSON file system, all
  frontend. No real shell, no security risk. It's a bounded, well-understood build
  (2–3 focused days), but it's genuinely new surface area.

**Perfect for the OS/Networks subjects** where SQL and Python missions don't reach.

---

## Idea 4 — Query Golf (optimization playground)

**One line:** The mission is already solved — now do it *better*. Same SQL sandbox as
Idea 1, but the win condition is efficiency: fewer rows scanned, correct use of an index,
shorter query.

**Core loop:**
```
"This report query works but takes 9 seconds in prod. Make it fast."
   → student runs the baseline → sees cost/rows-scanned meter
      → rewrites → meter drops → beat the par score → medal tier (bronze/silver/gold)
```

**Why it's interesting:** infinite replayability from one scenario (golf = retry to beat
your own score), leaderboard-friendly (par scores per mission), and it teaches the
*second-order* DB skills (indexes, query plans) that no intro tool gamifies.

**Why it's second-wave:** needs Idea 1's sandbox to exist first, and "query cost" needs a
simplified, honest metric (EXPLAIN-derived rows-scanned works in SQLite). Ship Data
Detective, then this is a cheap expansion pack on the same engine.

---

## Idea 5 — Pipeline Tycoon (living-system upgrade of Sequence Builder)

**One line:** The pipeline the student builds doesn't just validate — it RUNS, with animated
data packets flowing through, and wrong configurations visibly jam.

**Core loop:** place components (reusing Sequence Builder interactions) → press START
instead of Validate → watch packets flow tile-to-tile → a wrong link makes packets pile up
and spill at that exact junction → rearrange live → flow restored → throughput counter
ticks up → target throughput reached = win.

**Why it's here:** it directly converts our weakest game-feel screen into a simulation
(show, don't grade), and needs **zero new content** — every existing sequence mission
upgrades for free. Factorio-lite energy.

**Why it's not the top pick:** it improves an existing game rather than adding a new kind
of engagement, and the user's ask was a new game. Best treated as a polish project for
Sequence Builder later.

---

## Head-to-head

| | Content cost | Engagement / node | Game feel | Build cost | New skill taught |
|---|---|---|---|---|---|
| **1. Data Detective** | Low (1 case = 15–30 min) | ★★★★★ | ★★★★ | Medium | Writing real SQL |
| **2. Repair Bay** | **Lowest** | ★★★★ | ★★★ | **Lowest** | Reading/debugging code |
| **3. Terminal Infiltration** | Low | ★★★★ | ★★★★★ | High | Shell / OS literacy |
| **4. Query Golf** | Low (after #1) | ★★★★ (replay) | ★★★★ | Low (after #1) | Optimization |
| **5. Pipeline Tycoon** | Zero (reuses) | ★★★ | ★★★★ | Medium | (upgrade, not new) |

## Recommended order

1. **Data Detective** — the flagship. It's the "DB sandbox playground, AI-assisted, like the
   code editor level" instinct, made concrete. Long engagement from thin content, DBMS-native,
   demo headline, and the validation model is the safest we have (result-set comparison).
2. **Repair Bay** — ship alongside or immediately after; it's days of work on top of the
   existing editor and instantly doubles the coding-mission variety.
3. **Terminal Infiltration** — the second semester's marquee feature when OS/Networks
   content arrives.
4. **Query Golf** — cheap expansion on Data Detective's engine when replayability is wanted.
5. **Pipeline Tycoon** — Sequence Builder polish pass, whenever game-feel budget exists.
