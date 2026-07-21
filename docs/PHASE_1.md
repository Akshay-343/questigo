# Phase 1 — Backend Foundation & Real Authentication

## Goal

Build the backend infrastructure and replace the mocked authentication from Phase 0 with a real, working auth system. By the end of this phase, users can register as students, a seeded teacher account exists, and both can log in and receive a JWT that controls access to protected routes. The frontend auth flow is fully wired to the real API.

The Phase 0 UI remains intact. This phase adds substance behind the login screens without changing any visual design.

---

## Features

### 1. Server Setup (`server/`)
- Node.js + Express + TypeScript initialized in `server/`
- `ts-node-dev` for development hot-reload
- Express app with:
  - `express.json()` body parser
  - CORS configured for `http://localhost:5173`
  - `helmet` for basic security headers
- Single `errorMiddleware` catching all thrown errors and returning `{ data: null, error: "message" }`
- Structured folder layout matching CLAUDE.md: `routes/`, `controllers/`, `services/`, `middleware/`, `lib/`
- Environment variables via `dotenv`: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- `server/src/index.ts` entry point

### 2. Database Setup (PostgreSQL + Prisma)
- Prisma initialized in `prisma/` at the root
- `schema.prisma` with initial `User` model:
  ```prisma
  model User {
    id           String   @id @default(cuid())
    name         String
    email        String   @unique
    passwordHash String
    role         Role     @default(STUDENT)
    xp           Int      @default(0)
    level        Int      @default(1)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
  }

  enum Role {
    STUDENT
    TEACHER
  }
  ```
- First migration: `prisma migrate dev --name init`
- Prisma client singleton in `server/src/lib/prisma.ts`
- Seed script (`prisma/seed.ts`) creates:
  - 1 teacher account: `teacher@questigo.dev` / `demo1234` / role `TEACHER`
  - 2 student accounts: `alice@student.dev` / `student123`, `bob@student.dev` / `student123`

### 3. Auth Endpoints

**POST `/api/v1/auth/register`**
- Body: `{ name, email, password }`
- Validates with Zod: name required, email format, password min 8 chars
- Checks email uniqueness — 400 if already registered
- Hashes password with `bcrypt` (salt rounds: 10)
- Creates `User` with role `STUDENT`
- Returns `{ data: { token, user: { id, name, email, role, xp, level } } }`

**POST `/api/v1/auth/login`**
- Body: `{ email, password }`
- Finds user by email — 401 if not found
- Compares password hash with `bcrypt.compare` — 401 if mismatch
- Signs JWT: payload `{ userId, role }`, expiry `7d`
- Returns `{ data: { token, user: { id, name, email, role, xp, level } } }`

**GET `/api/v1/auth/me`**
- Requires `Authorization: Bearer <token>` header
- `requireAuth` middleware validates token, attaches `req.user`
- Returns `{ data: { user } }`
- Used by frontend on app load to restore session

### 4. Auth Middleware

`middleware/requireAuth.ts`:
- Extracts `Authorization` header
- Verifies JWT with `jsonwebtoken`
- Attaches decoded `{ userId, role }` to `req.user`
- Returns 401 on missing or invalid token

`middleware/requireRole.ts`:
- Takes a `Role` argument
- Returns 403 if `req.user.role` does not match
- Always used after `requireAuth`

### 5. Shared Types (`shared/`)
```typescript
// shared/types/auth.ts
export type Role = 'STUDENT' | 'TEACHER'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  xp: number
  level: number
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
```

Frontend imports from `shared/` via path alias `@shared/`.

### 6. Frontend: Wire Auth to Real API

Replace the static Zustand mock from Phase 0 with real API calls:

**`client/src/lib/api.ts`**
- Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401, clears auth store and redirects to login; on 5xx, shows error toast

**`client/src/store/authStore.ts`** (updated)
- State: `{ user: AuthUser | null, token: string | null, isAuthenticated: boolean }`
- Actions:
  - `login(email, password)` → calls `POST /api/v1/auth/login`, stores token in `localStorage`, updates state
  - `register(name, email, password)` → calls `POST /api/v1/auth/register`, auto-logs in on success
  - `logout()` → clears localStorage, resets state, redirects to `/login`
  - `restoreSession()` → calls `GET /api/v1/auth/me` on app init if token exists in localStorage

**`client/src/router/index.tsx`** (updated)
- `ProtectedRoute` now reads from real Zustand state (not mocked)
- App entry point calls `authStore.restoreSession()` on mount

**Teacher Login page** (`/teacher/login`) updated:
- Calls real `authStore.login()` instead of hardcoded check
- Teacher credentials (`teacher@questigo.dev` / `demo1234`) now work via real API

**Student Login page** (`/login`) updated:
- Calls real `authStore.login()`
- Shows server error messages inline

**Student Register page** (`/register`) activated:
- Form now submits via `authStore.register()`
- Redirects to `/dashboard` on success
- Shows field-level errors from Zod validation response

### 7. Student Dashboard Placeholder
- Route `/dashboard` protected: `STUDENT` role required
- Simple placeholder page: "Welcome, [name]" heading + "More coming in Phase 2" message
- Uses real `user` from auth store to display name and role

---

## Deliverables

- `server/` fully initialized with Express + TypeScript
- PostgreSQL connected via Prisma with `User` model migrated
- Seed script populating teacher + 2 student accounts
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` endpoints working
- `GET /api/v1/auth/me` session restore endpoint
- `requireAuth` and `requireRole` middleware
- `shared/` types for `AuthUser` and `AuthResponse`
- Frontend Axios instance with interceptors
- Zustand auth store wired to real API
- Teacher login working with real credentials via real DB
- Student register and login working end-to-end
- Session persisted across page refresh via localStorage + `/me` endpoint
- All Phase 0 UI still intact and navigable

---

## Out of Scope

- Subject, Topic, Quest models or endpoints
- Teacher content management screens (functional)
- Student dashboard content (still a placeholder)
- Coding challenges
- XP, levels, achievements
- PDF upload or AI generation (remains mocked from Phase 0)
- Email verification
- Password reset

---

## Acceptance Criteria

- [ ] `npm run dev` in `server/` starts without errors on port 3000
- [ ] `npm run dev` in `client/` starts without errors on port 5173
- [ ] `prisma migrate dev` runs cleanly; `prisma db seed` populates the three accounts
- [ ] `POST /api/v1/auth/register` with valid data creates a student and returns a token
- [ ] `POST /api/v1/auth/register` with a duplicate email returns a 400 error
- [ ] `POST /api/v1/auth/login` with valid credentials returns a token
- [ ] `POST /api/v1/auth/login` with wrong password returns a 401 error
- [ ] Teacher login at `/teacher/login` with seeded credentials authenticates and redirects to `/teacher/dashboard`
- [ ] Student registration at `/register` creates an account and redirects to `/dashboard`
- [ ] Student login at `/login` with seeded student credentials authenticates and redirects to `/dashboard`
- [ ] Refreshing the page while logged in restores the session (name visible, not redirected)
- [ ] Logging out clears the session and redirects to `/login`
- [ ] Navigating to `/teacher/dashboard` as a student redirects to `/login`
- [ ] Navigating to `/dashboard` as a teacher redirects to `/teacher/dashboard`
- [ ] All Phase 0 screens still render without errors
