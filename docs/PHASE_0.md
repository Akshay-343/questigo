# Phase 0 — Frontend Foundation & Teacher Workflow UI

## Goal

Establish the complete frontend architecture and design system. Deliver a fully navigable, visually complete teacher workflow using only mocked local data — no backend, no database, no authentication service.

By the end of this phase, anyone reviewing the project should be able to walk through the entire teacher experience (upload → AI generation → approval → published content) and understand the visual language of the platform.

---

## Constraints

- No backend server
- No database or Prisma
- No real authentication
- No PDF processing
- No AI integration
- All data is hardcoded or mocked in local TypeScript files
- Static teacher login: hardcoded email + password check in the frontend store

---

## Features

### 1. Project Setup
- Vite + React 18 + TypeScript (`client/`)
- Tailwind CSS with custom design tokens (colors, spacing, radius)
- shadcn/ui component library initialized
- Framer Motion for meaningful transitions
- Lucide React for icons
- React Router v6 for client-side routing
- Zustand for global state (auth store — mocked)
- React Query (TanStack Query) installed and configured — queries will use mock resolvers for now
- ESLint + Prettier configured
- Absolute imports configured (`@/` alias pointing to `src/`)
- `shared/` directory created with base TypeScript types

### 2. Design System
- Color tokens defined in `tailwind.config.ts`:
  - `brand`: `#7c3aed` (primary purple)
  - `background`: `#0f1117`
  - `surface`: `#1a1d27`
  - `border`: `#2a2d3e`
  - `success`: `#22c55e`
  - `warning`: `#f59e0b`
  - `danger`: `#ef4444`
  - `muted`: `#6b7280`
- Typography: Inter font via Google Fonts
- Global CSS reset and base styles in `index.css`
- shadcn/ui theme configured to match dark design system
- Reusable primitives built on top of shadcn/ui:
  - `Button` (variants: primary, secondary, ghost, danger)
  - `Card`, `CardHeader`, `CardContent`
  - `Badge` (variants: level, difficulty, status)
  - `Input`, `Textarea`, `Label`
  - `Avatar` (initials-based)
  - `Spinner`, `Skeleton`
  - `Toast` (via sonner)
  - `Dialog`, `Sheet`
  - `ProgressBar` (for XP display)
  - `Stepper` (for multi-step workflows)

### 3. Routing Setup
All routes defined in `client/src/router/index.tsx`:

```
/                        → Landing page
/login                   → Student login
/register                → Student signup (UI only)
/teacher/login           → Teacher login (static)
/teacher/dashboard       → Teacher dashboard (protected)
/teacher/upload          → Upload PDF screen
/teacher/generate        → AI generation workflow
/teacher/approve         → Content approval screen
/dashboard               → Student dashboard placeholder (protected)
```

`ProtectedRoute` component reads from Zustand auth store. Redirects unauthenticated users to appropriate login. Works with mocked auth state.

### 4. Landing Page (`/`)
- Full-viewport hero section: headline, sub-headline, two CTAs ("Start Learning" → `/register`, "I'm a Teacher" → `/teacher/login`)
- Features section: three cards highlighting the platform value proposition (Game-based learning, Coding challenges, Track progress)
- How it works section: three-step visual (Learn → Code → Level Up)
- Stats banner: mock numbers (students, quests, challenges)
- Footer with platform name and navigation links
- Responsive: stacks gracefully at mobile widths

### 5. Student Login Screen (`/login`)
- Email + password fields with validation UI (no submission)
- "Login" button (no-op or shows a mock success)
- Link to `/register`
- Link to `/teacher/login`
- Consistent dark card layout, centered on page

### 6. Student Signup Screen (`/register`) — UI Only
- Name, email, password, confirm password fields
- Role selector (Student pre-selected; Teacher option visible but disabled with tooltip)
- Submit button (no-op)
- Link back to `/login`
- No form submission logic. No API calls. UI + validation display only.

### 7. Static Teacher Login (`/teacher/login`)
- Email + password fields
- Hardcoded credentials checked in the Zustand auth store:
  - Email: `teacher@questigo.dev`
  - Password: `demo1234`
- On match: sets `authStore` state `{ user: { name: "Dr. Sharma", role: "TEACHER" }, isAuthenticated: true }`, redirects to `/teacher/dashboard`
- On mismatch: shows inline error message
- Visually distinct from student login (teacher badge/label)

### 8. Teacher Dashboard Layout (`/teacher/dashboard`)
- Two-panel layout: fixed sidebar + main content area
- Sidebar: platform logo, navigation links, user info footer with logout
- Main content: welcome banner, four stat cards (Subjects, Topics, Quests, Students — all mocked numbers)
- Recent activity feed (mocked list of timestamped events)
- Quick action buttons: "Upload PDF", "View Students", "Review Pending"
- Responsive: sidebar collapses to a hamburger menu on mobile

### 9. Sidebar Navigation
Component: `components/layout/TeacherSidebar.tsx`

Navigation links:
- Dashboard (`/teacher/dashboard`)
- Upload PDF (`/teacher/upload`)
- AI Generator (`/teacher/generate`)
- Approve Content (`/teacher/approve`)
- Students (disabled, labelled "Phase 2")
- Settings (disabled, labelled "Coming Soon")

Active link highlighted. Collapsed state on mobile via Sheet (slide-in drawer).

### 10. Upload PDF Screen (`/teacher/upload`)
- Page heading: "Upload Learning Material"
- Drag-and-drop file zone (UI only — accepts `.pdf`, `.docx`)
- File list below drop zone showing selected files with name, size, remove button
- Subject selector dropdown (mocked options: "Data Structures", "Python Basics")
- Topic selector (mocked, dependent on subject)
- "Upload & Generate" primary button — navigates to `/teacher/generate` on click (simulates submission)
- Upload progress bar shown after button click (animated, reaches 100% then redirects)
- Constraints notice: max file size 10MB, PDF or DOCX only

### 11. AI Generation Workflow (`/teacher/generate`)
Multi-step UI with a `Stepper` component showing four steps:

**Step 1 — Analyzing Document**
- Spinner with label "Extracting key concepts..."
- Auto-advances to Step 2 after 1.5s (simulated delay using `setTimeout`)

**Step 2 — Generating Quests**
- Progress bar filling from 0% to 100% over 2s
- Animated list of quest titles appearing one by one (from mock data)
- Auto-advances to Step 3

**Step 3 — Generating Coding Challenges**
- Similar animated list for coding challenge titles
- Auto-advances to Step 4

**Step 4 — Ready for Review**
- Success state: green checkmark, summary card (X quests, Y challenges generated)
- "Review Content" button → navigates to `/teacher/approve`

All delays and animations are purely frontend with `setTimeout` / Framer Motion. No API calls.

### 12. Content Approval Screen (`/teacher/approve`)
- Page heading: "Review Generated Content"
- Filter tabs: "All", "Quests", "Challenges", "Pending", "Approved"
- List of generated items (mocked data: 3 quests, 3 coding challenges)

Each item card shows:
- Title, topic tag, difficulty badge, XP reward (for quests)
- Expandable preview section (description, sample code for challenges)
- Three action buttons: "Approve" (green), "Edit" (ghost), "Reject" (red)
- Clicking "Approve" toggles the card to an approved state (local UI state only)
- Clicking "Reject" removes the card from the list with a fade-out animation

Bulk actions bar:
- "Approve All" button
- "Reject All" button
- Count of pending items

"Publish Approved" button at bottom:
- Triggers a success toast: "Content published successfully"
- Redirects to `/teacher/dashboard`

---

## Deliverables

- `client/` fully initialized with all dependencies installed
- `tailwind.config.ts` with complete design token set
- All shared UI primitives in `components/ui/`
- Layout components: `TeacherSidebar`, `Navbar`, `PageWrapper`
- All routes registered and navigable
- All 8 screens implemented (Landing, Login, Register, Teacher Login, Teacher Dashboard, Upload, Generate, Approve)
- Mocked data files in `client/src/lib/mockData.ts`
- Zustand auth store with static teacher login logic
- `ProtectedRoute` component blocking unauthenticated access to teacher routes

---

## Out of Scope

- Any backend server or API
- Any database or ORM
- Real authentication or JWT
- Real file handling or PDF parsing
- Real AI or LLM calls
- Student dashboard content (placeholder only)
- Student quest browsing or attempt flows
- Coding challenge editor
- XP, levels, achievements, or leaderboards
- Teacher content CRUD (creating subjects/topics/quests manually)

---

## Acceptance Criteria

- [ ] `npm run dev` in `client/` starts the app with no errors
- [ ] Landing page renders correctly on both desktop and 375px mobile
- [ ] Navigating to `/teacher/dashboard` without logging in redirects to `/teacher/login`
- [ ] Teacher login with `teacher@questigo.dev` / `demo1234` succeeds and redirects to dashboard
- [ ] Teacher login with wrong credentials shows an error message
- [ ] Sidebar navigation links are active-highlighted and all routes are reachable
- [ ] Upload PDF screen accepts file selection (UI) and clicking "Upload & Generate" navigates to the generation workflow
- [ ] AI generation workflow plays through all four steps automatically and reaches the "Ready for Review" state
- [ ] Content approval screen displays mocked items; Approve/Reject buttons change card state; "Publish Approved" shows a success toast
- [ ] All pages render without console errors
- [ ] Dark theme is consistent across all screens
- [ ] No hardcoded color values outside `tailwind.config.ts`
- [ ] All interactive elements have hover and focus states
