# Phase 5 — Gamification, AI Content Pipeline & Demo Polish

## Goal

Complete the platform. This phase wires up the gamification layer (achievements, leaderboard, student profile), activates the AI-assisted content generation workflow that was demoed as a static mockup in Phase 0, seeds the database with realistic demo data, and polishes every screen for presentation quality.

By the end of this phase, Questigo is a fully working, demonstrable product.

---

## Features

### 1. Achievements System

#### Database

```prisma
model Achievement {
  id          String            @id @default(cuid())
  key         String            @unique
  title       String
  description String
  icon        String
  users       UserAchievement[]
}

model UserAchievement {
  user          User        @relation(fields: [userId], references: [id])
  userId        String
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  achievementId String
  unlockedAt    DateTime    @default(now())

  @@id([userId, achievementId])
}
```

`User` model gains:
```prisma
achievements  UserAchievement[]
```

Migration: `prisma migrate dev --name add-achievements`

Seed 8 achievements:

| Key | Title | Description | Trigger |
|---|---|---|---|
| `first_quest` | First Quest | Completed your first quest | questsCompleted === 1 |
| `quest_5` | Quest Seeker | Completed 5 quests | questsCompleted === 5 |
| `quest_10` | Quest Master | Completed 10 quests | questsCompleted === 10 |
| `level_3` | Rising Star | Reached Level 3 | newLevel === 3 |
| `level_5` | Veteran | Reached Level 5 | newLevel === 5 |
| `level_10` | Legend | Reached Level 10 | newLevel === 10 |
| `first_code` | Code Initiate | Solved your first coding challenge | first coding quest completed |
| `code_5` | Code Warrior | Solved 5 coding challenges | codingQuestsCompleted === 5 |

#### Achievement Service

`server/src/services/achievementService.ts`:

```typescript
export async function checkAndUnlock(userId: string, context: AchievementContext): Promise<Achievement[]>
```

`AchievementContext`: `{ questsCompleted, codingQuestsCompleted, newLevel, previousLevel }`

- Checks each of the 8 conditions
- For each matching achievement, inserts into `UserAchievement` if not already present
- Returns the list of newly unlocked achievements

Called from `questService.completeQuest()` after XP is awarded. Response from `complete` endpoint is extended:
```json
{
  "xpEarned": 50,
  "newXp": 450,
  "newLevel": 3,
  "leveledUp": true,
  "unlockedAchievements": [
    { "key": "level_3", "title": "Rising Star", "description": "...", "icon": "⭐" }
  ]
}
```

#### Frontend: Achievement Notifications

On quest completion, if `unlockedAchievements.length > 0`:
- Each achievement shown as a stacked toast (sonner) with icon, title, and "Achievement Unlocked!" label
- Toasts are queued and shown 500ms apart so they don't overlap

### 2. Leaderboard Page (`/leaderboard`)

Replaces the Phase 3 placeholder.

**API endpoint:**
- `GET /api/v1/student/leaderboard` — returns top 50 students ordered by XP descending
- Response: `[{ rank, id, name, xp, level }]`

**Page layout:**
- Page heading "Leaderboard" with a trophy icon
- Top 3 podium section (large cards for ranks 1, 2, 3 with special styling — gold, silver, bronze)
- Table for ranks 4–50: rank number, avatar (initials), name, level badge, XP
- Current student's row highlighted (compare `id` to auth store)
- If current student is not in top 50: pinned row at the bottom showing their rank and XP

### 3. Student Profile Page (`/profile`)

Replaces the Phase 3 placeholder.

**API endpoint:**
- `GET /api/v1/student/profile` — returns:
  ```json
  {
    "user": { "name", "email", "xp", "level", "createdAt" },
    "stats": { "questsCompleted", "codingQuestsCompleted", "rank" },
    "achievements": [{ "key", "title", "description", "icon", "unlockedAt" }],
    "recentActivity": [ last 10 completed quest attempts ]
  }
  ```

**Page sections:**
- **Hero:** initials avatar (large), name, email, member since date
- **Level & XP card:** level badge, XP progress bar (current / next threshold), XP total
- **Stats row:** quests completed, coding challenges solved, leaderboard rank
- **Achievements grid:** unlocked achievements as icon cards (dimmed locked achievements shown as grey placeholders)
- **Activity feed:** last 10 completed quests with date and XP earned

### 4. AI Content Pipeline (Functional)

Wire up the Phase 0 teacher workflow UI to a real (but simplified) backend pipeline.

#### File Upload

**`POST /api/v1/teacher/upload`** (multipart/form-data)
- Fields: `file` (PDF or DOCX), `subjectId`, `topicId`
- Uses `multer` to handle file upload; stores temporarily in `server/uploads/`
- For MVP: does not parse the PDF — uses the filename and selected subject/topic as context
- Returns `{ uploadId, filename, subjectId, topicId }` used to poll generation status

#### AI Generation

**`POST /api/v1/teacher/generate`**
- Body: `{ uploadId, subjectId, topicId }`
- Calls the Anthropic API (Claude) with a structured prompt:
  ```
  You are a programming educator. Based on the subject "[subjectTitle]" and topic "[topicTitle]",
  generate 3 quests and 3 coding challenges in the following JSON format: ...
  ```
- Response streamed to avoid timeout; stored in a `GenerationJob` (in-memory map for MVP — no new DB model needed)
- Returns `{ jobId }` immediately

**`GET /api/v1/teacher/generate/:jobId/status`**
- Returns `{ status: "pending" | "complete" | "error", result?: GeneratedContent }`
- Frontend polls this every 2s until status is `complete`

`GeneratedContent` shape:
```typescript
{
  quests: Array<{
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    xpReward: number
  }>
  challenges: Array<{
    questIndex: number  // which generated quest this attaches to
    prompt: string
    starterCode: string
    testCases: TestCase[]
  }>
}
```

#### Content Approval Screen (Functional)

The Phase 0 approval UI is updated to use real data from the `GenerationJob`:

- On load: fetches the latest generation result for the teacher
- Each generated quest card is now editable (clicking title or description lets teacher inline-edit before approving)
- "Approve" action: calls `POST /api/v1/teacher/content/approve` with the edited content
- Backend creates `Quest` and `CodingChallenge` records under the selected topic
- "Reject" action: removes from the pending list (nothing saved to DB)
- "Publish Approved" calls the approve endpoint for all remaining approved items in one request

#### Frontend: Generation Workflow Update

Phase 0 workflow screens (`/teacher/upload`, `/teacher/generate`, `/teacher/approve`) are updated:

- Upload form now calls real `POST /api/v1/teacher/upload`
- Generation page polls `GET /api/v1/teacher/generate/:jobId/status` instead of using `setTimeout`
- Steps in the stepper reflect real backend status
- Approval screen shows AI-generated content (editable before approving)

### 5. Demo Seed Data

`prisma/seed.ts` completely replaced with a rich demo dataset:

**Users:**
- 1 teacher: Dr. Priya Sharma (`teacher@questigo.dev`)
- 5 students with varied XP and levels:
  - Alice Chen — Level 6, 2300 XP (quest 5 completed, 3 coding challenges)
  - Bob Kumar — Level 4, 750 XP (3 quests completed)
  - Carol Singh — Level 3, 420 XP (2 quests completed)
  - David Lee — Level 2, 180 XP (1 quest completed)
  - Eva Patel — Level 1, 60 XP (just started)

**Content:**
- 2 subjects: "Python Fundamentals", "Data Structures"
- 3 topics each: ("Variables & Types", "Control Flow", "Functions") and ("Arrays", "Linked Lists", "Trees")
- 2 quests per topic (12 total)
- Coding challenges on all 12 quests

**Achievements:**
- Alice has: `first_quest`, `quest_5`, `level_3`, `level_5`, `first_code`, `code_5`
- Bob has: `first_quest`, `level_3`, `first_code`
- Carol has: `first_quest`
- David has: `first_quest`
- Eva has: none

**Quest Attempts:**
- Seeded `QuestAttempt` records matching each student's stated progress

### 6. Demo Polish

#### Global
- No console errors on any page
- No unstyled flash (dark background set in `index.html` `<body>` style)
- All async pages have skeleton loading states
- All lists have empty states with icons and helpful messages
- All forms have field-level validation feedback
- Error boundaries on all major routes (student, teacher, auth areas)

#### Responsive Check
- Test all pages at 375px (iPhone SE), 768px (iPad), 1280px (desktop)
- Teacher sidebar collapses correctly to hamburger on mobile
- Monaco editor minimum height 300px on mobile with scrollable panel

#### Final Navigation Audit
- Every link in the app resolves to a real page
- Breadcrumbs are correct on all nested pages
- Back buttons or breadcrumbs available everywhere depth > 1
- No dead links, no routes returning 404

#### Performance
- React Query stale time set to 30s on list queries (reduces redundant refetches during demo)
- Code splitting: lazy-load the coding challenge page (Monaco is ~2MB)
  ```typescript
  const ChallengePage = lazy(() => import('@/features/coding/ChallengePage'))
  ```

---

## Deliverables

- `Achievement` and `UserAchievement` models migrated
- 8 seeded achievements
- `achievementService.ts` with `checkAndUnlock`
- Achievement unlock toasts on quest completion
- Leaderboard page with podium and ranked table
- Student profile page with stats, achievements grid, activity feed
- Anthropic API integration for quest generation (with env var `ANTHROPIC_API_KEY`)
- `POST /api/v1/teacher/upload` and `POST /api/v1/teacher/generate` endpoints
- Generation status polling endpoint
- Content approval endpoint that persists AI-generated quests and challenges
- Phase 0 teacher workflow fully functional end-to-end
- Rich demo seed data (5 students, 2 subjects, 12 quests, 12 challenges, achievements)
- All polish items: no console errors, skeletons, empty states, error boundaries, responsive, lazy-loaded Monaco

---

## Out of Scope

- Real PDF parsing (filename-based context only for MVP)
- Real-time leaderboard updates (refresh on load only)
- Adaptive difficulty or personalized learning paths
- Multiplayer or collaborative features
- Additional programming languages
- Email notifications
- Admin panel
- LMS integrations
- Analytics dashboard

---

## Acceptance Criteria

- [ ] Completing a qualifying quest unlocks the correct achievements and shows toast notifications
- [ ] `GET /api/v1/student/leaderboard` returns students ordered by XP
- [ ] Leaderboard page shows the top 3 podium and ranked table; current student's row is highlighted
- [ ] Student profile page shows real stats, achievements grid (locked/unlocked), and activity feed
- [ ] Teacher can upload a file (any PDF), trigger AI generation, and see generated quests in the approval screen
- [ ] Approving generated content creates real `Quest` and `CodingChallenge` records in the database
- [ ] Newly approved quests appear in the student-facing quest listing for the selected topic
- [ ] Demo seed data is present: 5 students with varied XP, full content tree, seeded achievements
- [ ] Leaderboard shows seeded students in correct XP order
- [ ] Alice is at the top of the leaderboard with the most XP
- [ ] No console errors on any page
- [ ] All pages render correctly at 375px mobile width
- [ ] Coding challenge page loads lazily without blocking initial app bundle
- [ ] All Phase 0 through Phase 4 functionality remains working
- [ ] A complete demo walkthrough is possible: Teacher creates content → Student registers → browses subjects → solves a coding challenge → earns XP → appears on leaderboard
