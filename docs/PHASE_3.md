# Phase 3 — Student Experience & Quest Browsing

## Goal

Deliver the complete student-facing learning experience: a real dashboard, the ability to browse subjects and topics, and a full quest attempt flow from selection through reading content to marking a quest complete. By the end of this phase, a student can log in, explore the content created by a teacher in Phase 2, start a quest, and earn XP — without writing any code. The gamification engine (XP and levels) becomes functional for the first time.

---

## Features

### 1. Database: Quest Attempt Model

New Prisma model:

```prisma
model QuestAttempt {
  id          String        @id @default(cuid())
  user        User          @relation(fields: [userId], references: [id])
  userId      String
  quest       Quest         @relation(fields: [questId], references: [id])
  questId     String
  status      AttemptStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now())
  completedAt DateTime?

  @@unique([userId, questId])
}

enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
}
```

`User` model gains relations:
```prisma
attempts     QuestAttempt[]
```

`Quest` model gains relation:
```prisma
attempts     QuestAttempt[]
```

Migration: `prisma migrate dev --name add-quest-attempts`

### 2. Student API Endpoints

All routes under `/api/v1/student/` — require `requireAuth` + `requireRole("STUDENT")`.

**Dashboard**
- `GET /api/v1/student/dashboard` — returns:
  ```json
  {
    "user": { "name", "xp", "level" },
    "stats": { "questsCompleted", "questsInProgress", "achievementsUnlocked" },
    "recentAttempts": [ { "questTitle", "topicTitle", "completedAt", "xpEarned" } ]
  }
  ```

**Subjects**
- `GET /api/v1/student/subjects` — list all subjects with topic count and quest count

**Topics**
- `GET /api/v1/student/subjects/:subjectId` — get subject with its topics (each with quest count)

**Quests**
- `GET /api/v1/student/topics/:topicId/quests` — list quests with attempt status for the current user
- `GET /api/v1/student/quests/:questId` — get single quest detail with attempt status

**Quest Attempts**
- `POST /api/v1/student/quests/:questId/start` — creates a `QuestAttempt` with status `IN_PROGRESS` (idempotent; returns existing if already started)
- `POST /api/v1/student/quests/:questId/complete` — marks attempt `COMPLETED`, awards `xpReward`, recalculates level

**XP + Level Update (in `questService.completeQuest`):**
```typescript
user.xp += quest.xpReward
user.level = calculateLevel(user.xp)  // using threshold table from CLAUDE.md
await prisma.user.update({ where: { id }, data: { xp, level } })
```

### 3. Student Dashboard (`/dashboard`)

Replaces the Phase 1 placeholder with a fully functional screen:

**Welcome section**
- "Welcome back, [name]" heading
- Level badge (e.g., "Level 3") with a progress bar showing XP toward the next level
- XP display: current / next level threshold (e.g., "450 / 600 XP")

**Stats row** — four cards:
- Quests Completed
- Quests In Progress
- XP Earned
- Achievements (count — always 0 until Phase 5)

**Recent Activity**
- List of last 5 completed quest attempts with: quest title, topic, subject, XP earned, completion date
- Empty state: "No quests completed yet. Start exploring!" with a CTA to `/subjects`

**Explore CTA section**
- Card prompting the student to browse subjects

All data fetched from `GET /api/v1/student/dashboard` via React Query.

### 4. Subjects Listing Page (`/subjects`)

- Grid of subject cards (2 columns on desktop, 1 on mobile)
- Each card: subject title, description, topic count, quest count
- Clicking a card navigates to `/subjects/:subjectId`
- Loading: skeleton cards
- Empty state: "No subjects available yet"

### 5. Subject Detail & Topics Page (`/subjects/:subjectId`)

- Breadcrumb: Home → Subjects → [Subject Title]
- Subject header: title, description
- Topics listed as an ordered vertical list (accordion-style or plain list)
- Each topic: title, quest count badge, "View Quests" button → navigates to `/subjects/:subjectId/topics/:topicId`
- Topics ordered by `Topic.order`

### 6. Topic Detail & Quests Page (`/subjects/:subjectId/topics/:topicId`)

- Breadcrumb: Home → Subjects → [Subject] → [Topic]
- Quest list as cards:
  - Title, description excerpt, difficulty badge, XP reward
  - Attempt status badge: "Not Started" / "In Progress" / "Completed" (green checkmark)
  - "Start Quest" or "Continue" or "Review" button based on status
- Clicking navigates to `/quests/:questId`

### 7. Quest Detail Page (`/quests/:questId`)

- Breadcrumb: Home → Subjects → [Subject] → [Topic] → [Quest Title]
- Quest header: title, difficulty badge, XP reward badge
- Full description rendered (plain text for MVP; no markdown yet)
- Status panel on the right (or below on mobile):
  - If not started: "Start Quest" button
  - If in progress: "Mark as Complete" button + "Started on [date]"
  - If completed: green "Completed" banner + XP earned + completion date

**"Start Quest" flow:**
1. Button click → calls `POST /api/v1/student/quests/:id/start`
2. Status panel updates to "In Progress" state via React Query mutation + invalidate
3. No page navigation — updates in place

**"Mark as Complete" flow** (for non-coding quests):
1. Button click → calls `POST /api/v1/student/quests/:id/complete`
2. Response includes `{ xpEarned, newXp, newLevel, leveledUp }`
3. If `leveledUp: true`: show a level-up animation overlay (Framer Motion — slide-up card with new level number)
4. XP gain shown as a floating "+50 XP" animation near the XP indicator
5. Status panel updates to "Completed"

> Note: In Phase 4, quests with a coding challenge will have "Solve Challenge" instead of "Mark as Complete". This page handles both cases based on whether a `CodingChallenge` is linked to the quest.

### 8. XP and Level Calculation (Service)

`server/src/services/progressService.ts`:

```typescript
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1200, 2100, 3000, 4200, 5800, 8000]

export function calculateLevel(xp: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return level
}
```

`completeQuest(userId, questId)` in `questService.ts`:
1. Verify attempt exists and is `IN_PROGRESS` (or auto-start if not started)
2. Verify not already `COMPLETED`
3. Update `QuestAttempt.status = COMPLETED`, set `completedAt`
4. Add `quest.xpReward` to `user.xp`
5. Recalculate and update `user.level`
6. Return `{ xpEarned, newXp, newLevel, leveledUp: previousLevel !== newLevel }`

### 9. Navbar Update for Students

Student navbar:
- Questigo logo (links to `/dashboard`)
- "Subjects" link → `/subjects`
- "Leaderboard" link → placeholder page (functional in Phase 5)
- User avatar with dropdown: name, level, "Profile" (placeholder), "Logout"

XP bar shown in navbar below main links (compact version): current level, XP progress bar.

### 10. Student Profile Placeholder (`/profile`)

Simple placeholder page showing:
- Name, email, level badge, XP
- "Achievements coming in Phase 5"
- "Stats coming in Phase 5"

Uses real data from auth store / `GET /api/v1/auth/me`.

---

## Deliverables

- `QuestAttempt` model migrated
- All student API endpoints (`/api/v1/student/*`) implemented
- `progressService.ts` with `calculateLevel` and `completeQuest`
- Student dashboard showing real data
- Subjects listing page
- Subject detail + topics page
- Topic detail + quests page with attempt status
- Quest detail page with Start / Complete flow
- XP award and level calculation working end-to-end
- Level-up animation on frontend
- Student navbar with XP indicator
- Student profile placeholder

---

## Out of Scope

- Coding challenges (quest completion is "Mark as Complete" for all quests in this phase)
- Achievements system (counter shows 0)
- Leaderboard (placeholder page only)
- Teacher content management changes
- PDF upload or AI generation
- Markdown rendering in quest descriptions
- Quest search or filtering

---

## Acceptance Criteria

- [ ] Student can log in and see a real dashboard with stats from the database
- [ ] Dashboard shows correct XP, level, and recent activity
- [ ] Subjects page lists all seeded subjects with topic and quest counts
- [ ] Student can navigate Subject → Topic → Quest without error
- [ ] Quest detail page shows correct status (Not Started / In Progress / Completed) per student
- [ ] "Start Quest" creates a `QuestAttempt` record in the database with status `IN_PROGRESS`
- [ ] "Mark as Complete" awards XP, updates `user.xp` and `user.level` in the database
- [ ] Completing a quest that triggers a level-up shows the level-up animation
- [ ] A student cannot complete the same quest twice (idempotency enforced by the `@@unique` constraint)
- [ ] Navbar XP bar reflects the student's current XP and level from the database
- [ ] All pages show proper loading skeletons and empty states
- [ ] All Phase 0, 1, and 2 functionality remains working
