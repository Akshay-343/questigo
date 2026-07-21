# CLAUDE.md — Questigo Engineering Handbook

> Implementation guidance for Claude Code. For project goals and vision, see docs/goal.md.
> All project documentation lives in `docs/` (this file stays at the repo root so Claude Code auto-loads it).

---

## 1. Engineering Principles

- **Simplicity first.** Prefer the obvious implementation. No clever abstractions until the simple version proves wrong.
- **Build visible features early.** Prioritize UI and end-to-end flows over backend polish. A working screen beats a perfect service.
- **MVP before optimization.** Hardcode, seed, or mock anything that isn't core to the demo. Optimize later.
- **No over-engineering.** No generic factories, no plugin systems, no event buses unless the problem demands it. Three similar functions beat a premature abstraction.
- **One responsibility per file.** Components render. Services fetch. Utils transform. Never mix.

---

## 2. Project Architecture

### Repository Structure
```
questigo/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express backend
├── shared/          # Shared TypeScript types
├── prisma/          # Schema and migrations
├── goal.md
└── CLAUDE.md
```

### Frontend Structure (`client/src/`)
```
assets/              # Static images, icons, fonts
components/
  ui/                # Reusable primitives (Button, Card, Badge)
  layout/            # Navbar, Sidebar, PageWrapper
  game/              # XP bar, LevelBadge, QuestCard
features/
  auth/              # Login, Register pages + hooks
  dashboard/         # Student and Teacher dashboards
  subjects/          # Subject and Topic browsing
  quests/            # Quest detail and attempt flow
  coding/            # Code editor challenge module
  leaderboard/       # Rankings UI
  profile/           # Student profile and achievements
hooks/               # Shared custom hooks
lib/                 # axios instance, query client, utils
store/               # Zustand global state (auth, user)
router/              # Route definitions and guards
types/               # Re-exported from shared/
```

### Backend Structure (`server/src/`)
```
routes/              # Express routers per domain
controllers/         # Request handlers (thin)
services/            # Business logic (fat)
middleware/          # auth, error, validate
lib/                 # prisma client, jwt helpers
types/               # Request/response types
```

### Database Structure (PostgreSQL via Prisma)

Core models:
- `User` — id, name, email, passwordHash, role (STUDENT | TEACHER), xp, level, createdAt
- `Subject` — id, title, description, teacherId
- `Topic` — id, title, subjectId, order
- `Quest` — id, title, description, topicId, xpReward, difficulty
- `CodingChallenge` — id, questId, prompt, starterCode, testCases (JSON), language
- `QuestAttempt` — id, userId, questId, status (IN_PROGRESS | COMPLETED), completedAt
- `Achievement` — id, key, title, description, iconUrl
- `UserAchievement` — userId, achievementId, unlockedAt

---

## 3. Development Standards

### Naming Conventions
- **Files:** `camelCase.ts` for logic, `PascalCase.tsx` for components
- **Components:** PascalCase (`QuestCard`, `XpBar`)
- **Hooks:** `useNoun` (`useAuth`, `useQuests`)
- **Services:** `nounService.ts` (`questService.ts`)
- **DB models:** PascalCase singular (`User`, `Quest`)
- **API routes:** kebab-case plural (`/api/quests`, `/api/coding-challenges`)
- **Env vars:** `SCREAMING_SNAKE_CASE`

### Folder Conventions
- One component per file. Co-locate its types and styles in the same folder if complex.
- Feature folders own their pages, components, hooks, and API calls. No cross-feature imports.
- Shared UI primitives live in `components/ui/` only — no business logic there.

### API Conventions
- Base path: `/api/v1/`
- REST. No GraphQL.
- JSON request/response bodies.
- Standard response shape:
  ```json
  { "data": {}, "error": null }
  { "data": null, "error": "message" }
  ```
- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 500 server error.
- Auth via `Authorization: Bearer <jwt>` header.

### Error Handling
- Backend: single `errorMiddleware` catches all thrown errors and returns the standard error shape.
- Frontend: Axios interceptor catches 401 (redirect to login) and 5xx (toast notification).
- Never swallow errors silently. Log on server, toast on client.
- No try/catch inside React components — use React Query's `isError` state.

---

## 4. UI/UX Guidelines

- **Game-inspired but professional.** Clean dashboard with subtle RPG accents — XP bars, level badges, quest cards — not a literal video game.
- **Color system:** Dark background (`#0f1117`), accent purple (`#7c3aed`), success green (`#22c55e`), warning amber (`#f59e0b`), danger red (`#ef4444`). Define as Tailwind config variables, not hardcoded values.
- **Typography:** Single sans-serif font (Inter or Geist). Headings bold, body regular.
- **Components:** Use shadcn/ui as the primitive library. Customize via Tailwind, not inline styles.
- **Mobile-first responsive.** All layouts work at 375px minimum. Use Tailwind's `sm:`, `md:`, `lg:` prefixes.
- **Loading states:** Every async action shows a skeleton or spinner. Never leave blank space.
- **Animations:** Framer Motion only for meaningful transitions (XP gain, level-up). No decorative animation.
- **Icons:** Lucide React only.

---

## 5. Authentication & Authorization

### Roles
- `STUDENT` — default on registration
- `TEACHER` — set at registration via a role field (seed teacher accounts for demo)

### Implementation
- JWT stored in `localStorage` (acceptable for MVP demo).
- Token payload: `{ userId, role, exp }`
- Protected routes on frontend via `<ProtectedRoute role="STUDENT" />` wrapper.
- Backend middleware `requireAuth` validates JWT. `requireRole("TEACHER")` checks role after auth.

### Route Access
| Route | Access |
|---|---|
| `/login`, `/register` | Public |
| `/dashboard` | STUDENT only |
| `/teacher/*` | TEACHER only |
| `/subjects`, `/quests/*` | STUDENT only |
| `/leaderboard` | STUDENT only |
| `/api/v1/teacher/*` | TEACHER JWT required |
| `/api/v1/student/*` | STUDENT JWT required |

---

## 6. Gamification Guidelines

### XP System
- Every completed quest awards `Quest.xpReward` XP to `User.xp`. XP is additive, never decreases.
- XP is updated atomically after quest completion is confirmed server-side.

### Level Progression
- Level is derived from XP using a fixed threshold table (not a dynamic formula):
  ```
  Level 1:  0 XP     Level 6:  2100 XP
  Level 2:  100 XP   Level 7:  3000 XP
  Level 3:  300 XP   Level 8:  4200 XP
  Level 4:  600 XP   Level 9:  5800 XP
  Level 5:  1200 XP  Level 10: 8000 XP
  ```
- Recalculate and store `User.level` after every XP update.

### Achievements
- 5–8 hardcoded achievements for MVP (e.g., "First Quest", "Level 3", "5 Quests Complete", "Top 3 Leaderboard").
- Check triggers in a `checkAchievements(userId, event)` service called after each relevant action.
- Unlocked achievements show a toast notification on the frontend.

### Leaderboards
- Rank all students by `User.xp` descending. Show: rank, initials avatar, name, level, XP.
- Query directly from `User` table for MVP — no separate materialized view needed.
- Refresh on page load. No real-time updates for MVP.

---

## 7. MVP Boundaries

### Build Now
- Student registration and login
- Teacher login (seed teacher account — no teacher self-registration needed for demo)
- Student dashboard: XP bar, level badge, recent quests, achievement count
- Teacher dashboard: subject list, student count
- Subject listing and detail
- Topic listing within a subject
- Quest listing and quest detail
- Coding challenge: Monaco editor, run button, test case evaluation, XP award on pass
- XP accumulation and level recalculation
- 5–8 hardcoded achievements with toast on unlock
- Leaderboard page (ranked by XP)
- Student profile: level, XP, completed quests, achievements grid
- Teacher: create/list subjects, topics, quests

### Mock or Simplify
- Code execution: Node.js `vm` module or simple string-matching test runner — no sandboxed judge
- AI content generation: stub endpoint returning a hardcoded quest template
- Avatars: initials-based only, no image upload
- Email verification: skip entirely
- Pagination: limit 50 records, no infinite scroll

### Postpone
- AI-generated quests and adaptive difficulty
- Multiplayer coding battles
- Real-time leaderboard
- Advanced analytics
- Mobile app
- LMS integrations
- Sandboxed code execution (Judge0 or equivalent)
- Image uploads and media management

---

## 8. Development Phases

### Phase 1 — Setup + Authentication
- Monorepo init: `client/` (Vite + React + TypeScript + Tailwind + shadcn/ui), `server/` (Express + TypeScript + Prisma + PostgreSQL), `shared/`
- Prisma schema with `User`; seed one teacher and two student accounts
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` returning JWT
- Login and Register pages with form validation (React Hook Form + Zod)
- `ProtectedRoute` component with role-based redirect
- Zustand auth store (`user`, `token`, `logout`)

### Phase 2 — Dashboards
- Student Dashboard: welcome banner, XP bar, level badge, stats cards (quests done, achievements)
- Teacher Dashboard: subject list table, total student count card
- Shared Navbar with role-aware links and logout button

### Phase 3 — Subjects, Topics, Quests
- Prisma models: `Subject`, `Topic`, `Quest`; seed 2 subjects, 3 topics each, 2 quests per topic
- Teacher CRUD: create and list subjects, topics, quests
- Student browse: subjects page → topics page → quests list → quest detail
- Quest detail shows title, description, difficulty, XP reward, and "Start Quest" button

### Phase 4 — Coding Challenge Module
- `CodingChallenge` model linked to `Quest`; seed one challenge per quest
- Monaco editor embedded in quest page with language selector (JavaScript default)
- `POST /api/v1/challenges/:id/run` evaluates code against stored test cases; returns per-case pass/fail
- On all tests passing: create `QuestAttempt` (COMPLETED), award XP, recalculate level, trigger achievement check
- Frontend: show test results table and XP gain animation on success

### Phase 5 — Progression + Leaderboards
- Achievement service: check and unlock achievements after quest complete and level-up events
- Toast notification on achievement unlock with icon and title
- Leaderboard page: ranked table of all students ordered by XP
- Student profile page: level, XP progress bar, completed quest count, achievements grid

### Phase 6 — Demo Polish
- Consistent dark theme across all pages; no unstyled flash on load
- Loading skeletons on all async pages; empty states with helpful messages
- Error boundaries on major routes
- Seed realistic demo data: 2 teachers, 5 students with varied XP, complete content tree
- Final checks: mobile layout at 375px, no console errors, all routes accessible
