# Phase 2 — Teacher Content Management

## Goal

Give teachers the ability to manually create and manage the full content hierarchy: Subjects → Topics → Quests. The teacher dashboard becomes a real working interface, not a static layout. By the end of this phase, a teacher can log in, create a complete learning path, and the content is persisted in the database.

The Phase 0 teacher workflow UI (Upload → Generate → Approve) remains visually intact but still mocked. This phase focuses on the manual CRUD path that supports the platform's core content structure.

---

## Features

### 1. Database: Content Models

New Prisma models added to `schema.prisma`:

```prisma
model Subject {
  id          String   @id @default(cuid())
  title       String
  description String?
  teacher     User     @relation(fields: [teacherId], references: [id])
  teacherId   String
  topics      Topic[]
  createdAt   DateTime @default(now())
}

model Topic {
  id        String   @id @default(cuid())
  title     String
  order     Int      @default(0)
  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  subjectId String
  quests    Quest[]
  createdAt DateTime @default(now())
}

model Quest {
  id          String      @id @default(cuid())
  title       String
  description String
  difficulty  Difficulty  @default(EASY)
  xpReward    Int         @default(50)
  topic       Topic       @relation(fields: [topicId], references: [id], onDelete: Cascade)
  topicId     String
  createdAt   DateTime    @default(now())
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

- Migration: `prisma migrate dev --name add-content-models`
- Seed script updated: creates 2 subjects, 3 topics each, 2 quests per topic under the seeded teacher account

### 2. Teacher API Endpoints

All routes under `/api/v1/teacher/` — require `requireAuth` + `requireRole("TEACHER")`.

**Subjects**
- `GET /api/v1/teacher/subjects` — list teacher's subjects (with topic count)
- `POST /api/v1/teacher/subjects` — create subject (`{ title, description }`)
- `GET /api/v1/teacher/subjects/:id` — get subject with topics
- `PUT /api/v1/teacher/subjects/:id` — update title or description
- `DELETE /api/v1/teacher/subjects/:id` — delete subject (cascades to topics and quests)

**Topics**
- `GET /api/v1/teacher/subjects/:subjectId/topics` — list topics for a subject
- `POST /api/v1/teacher/subjects/:subjectId/topics` — create topic (`{ title, order }`)
- `PUT /api/v1/teacher/topics/:id` — update topic
- `DELETE /api/v1/teacher/topics/:id` — delete topic

**Quests**
- `GET /api/v1/teacher/topics/:topicId/quests` — list quests for a topic
- `POST /api/v1/teacher/topics/:topicId/quests` — create quest (`{ title, description, difficulty, xpReward }`)
- `GET /api/v1/teacher/quests/:id` — get single quest
- `PUT /api/v1/teacher/quests/:id` — update quest
- `DELETE /api/v1/teacher/quests/:id` — delete quest

**Students**
- `GET /api/v1/teacher/students` — list all students (id, name, email, xp, level, createdAt)

All list endpoints return paginated responses (`limit: 50` for MVP — no cursor pagination yet).

### 3. Teacher Dashboard (Functional)

Replace mocked stat cards with real data fetched via React Query:

- **Subjects card**: real count from `GET /api/v1/teacher/subjects`
- **Topics card**: sum of topics across all subjects
- **Quests card**: sum of quests across all topics
- **Students card**: count from `GET /api/v1/teacher/students`

Recent quests list: shows the 5 most recently created quests with their topic and subject.

Quick action buttons now navigate to the real management screens:
- "Create Subject" → opens subject creation modal
- "View Students" → navigates to the students table page
- "Upload PDF" → `/teacher/upload` (Phase 0 flow, still mocked)

### 4. Subject Management Screen (`/teacher/subjects`)

- Table listing all teacher's subjects: title, topic count, quest count, created date, actions
- "Create Subject" button → opens a Dialog modal with title + description fields
- Each row has: "Manage Topics" link, edit icon (inline edit modal), delete icon (confirm dialog before delete)
- Empty state: illustrated empty state with "Create your first subject" CTA

### 5. Topic Management Screen (`/teacher/subjects/:subjectId/topics`)

- Breadcrumb: Dashboard → Subjects → [Subject Name]
- Topic list as cards with drag-to-reorder (visual only; order saved on drop via `PUT` with updated `order` value)
- "Add Topic" button → inline input appended to list, confirmed on Enter or blur
- Each card has: topic title, quest count badge, "Manage Quests" link, edit, delete

### 6. Quest Management Screen (`/teacher/topics/:topicId/quests`)

- Breadcrumb: Dashboard → Subjects → [Subject] → [Topic]
- Quest list as cards:
  - Title, description excerpt, difficulty badge (color-coded: green/amber/red), XP reward badge
  - Edit button → opens edit Dialog pre-filled with quest data
  - Delete button → confirm dialog
- "Create Quest" button → Dialog with fields:
  - Title (required)
  - Description (required, textarea)
  - Difficulty (select: Easy / Medium / Hard)
  - XP Reward (number input, default 50)

### 7. Students View (`/teacher/students`)

- Table: avatar (initials), name, email, level badge, XP, joined date
- No actions in this phase (read-only)
- Empty state if no students registered yet
- Sorted by XP descending by default

### 8. Frontend: React Query Integration

All teacher data screens use React Query hooks:

- `useSubjects()` → `GET /api/v1/teacher/subjects`
- `useTopics(subjectId)` → `GET /api/v1/teacher/subjects/:subjectId/topics`
- `useQuests(topicId)` → `GET /api/v1/teacher/topics/:topicId/quests`
- `useStudents()` → `GET /api/v1/teacher/students`

Mutations use `useMutation` with `queryClient.invalidateQueries` on success to keep lists fresh.

Loading states: skeleton rows in tables, skeleton cards in lists.
Error states: error banner with retry button.

### 9. Sidebar Navigation Update

Active links now resolve correctly for all new routes:
- `/teacher/subjects` — active on subject management
- `/teacher/subjects/:id/topics` — active on topic management
- `/teacher/topics/:id/quests` — active on quest management
- `/teacher/students` — active on students view

"Students" link in sidebar is now enabled (was disabled in Phase 0).

---

## Deliverables

- Prisma schema with `Subject`, `Topic`, `Quest`, `Difficulty` enum; migration applied
- Seed data: 2 subjects, 3 topics each, 2 quests per topic
- All teacher CRUD endpoints implemented and tested
- Teacher dashboard showing real counts
- Subject management screen (list, create, edit, delete)
- Topic management screen (list, create, edit, delete, reorder)
- Quest management screen (list, create, edit, delete)
- Students view (read-only table)
- React Query hooks for all teacher data
- Sidebar links all functional

---

## Out of Scope

- Student-facing subject/topic/quest browsing
- Quest attempts or completion
- Coding challenges
- XP, levels, achievements
- PDF upload or AI generation (still mocked from Phase 0)
- Teacher analytics beyond student count
- Image uploads for subjects or quests
- Pagination beyond limit-50

---

## Acceptance Criteria

- [ ] Migration runs cleanly; seed populates subjects, topics, and quests
- [ ] Teacher can create a subject via the dashboard modal; it appears in the list immediately
- [ ] Teacher can navigate into a subject and create a topic
- [ ] Teacher can navigate into a topic and create a quest with all fields
- [ ] Teacher can edit and delete subjects, topics, and quests (with confirmation on delete)
- [ ] Deleting a subject removes its topics and quests (cascade confirmed in DB)
- [ ] Dashboard stat cards show real counts matching the seeded data
- [ ] Students table lists seeded student accounts
- [ ] All teacher screens show loading skeletons while data is fetching
- [ ] All teacher screens show error states with retry when the API is unreachable
- [ ] All Phase 0 and Phase 1 functionality remains working
