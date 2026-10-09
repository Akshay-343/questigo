# Questigo

A gamified learning platform where programming concepts are taught through game mechanics instead of quizzes — and teachers generate content by uploading their existing PDF notes to AI.

Students don't answer questions. They **rebuild broken systems** to earn XP, level up, and unlock achievements.

---

## The Idea

Traditional programming education uses MCQs that test recall, not understanding. Questigo replaces that with two game mechanics:

- **Sequence Builder** — reconstruct a broken pipeline in the correct order (e.g., rebuild the database normalization pipeline from raw data → 1NF → 2NF → BCNF). Distractors are included; every link in the chain is validated.
- **Coding Challenge** — write real Python in an in-browser Monaco editor; the backend runs it against hidden test cases in a sandboxed subprocess and awards XP only when all tests pass.

Teachers upload their existing lecture notes → AI generates a complete playable quest (title, story framing, ordered tiles, distractors, per-step explanations) → teacher reviews and approves before any student sees it.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI, SQLAlchemy 2, PostgreSQL |
| Auth | JWT (PyJWT) + bcrypt |
| AI | Groq Llama 3.3 70B (OpenAI-compatible; swappable; offline fallback included) |
| Deploy | Docker Compose, Nginx, GitHub Actions |

---

## Features

**Student side**
- Skill Tree — subjects as branching unlockable node maps (completed / playable / locked)
- XP + leveling system (server-side, idempotent — replaying awards nothing)
- Achievements with unlock toasts
- Leaderboard ranked by XP
- Profile with RPG progression stats

**Teacher side**
- Paste notes → AI generates a complete quest draft
- Human-in-the-loop approval queue — AI output is never live until a teacher approves it
- Edit answer key and tiles before approving
- Subject and student management dashboard

---

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend API + Swagger: `http://localhost:8000/docs`

### Manual

**Backend:**
```bash
cd server
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, AI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

**Database** (first run):
```bash
psql -d questigo -f server/sql/01_schema.sql
# run subsequent migration files in order: 02–14
```

### Demo accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Teacher | `teacher@questigo.dev` | `demo1234` |
| Student | `alice@student.dev` | `student123` |
| Student | `bob@student.dev` | `student123` |

---

## Project Structure

```
questigo/
├── client/              # React + TypeScript frontend
│   └── src/
│       ├── features/    # auth, dashboard, play, teacher, leaderboard, profile
│       ├── components/  # shared UI
│       ├── store/       # auth state (Zustand)
│       └── lib/         # API client, utils, level config
├── server/              # FastAPI backend
│   └── app/
│       ├── api/v1/      # auth, student, teacher, content routes
│       ├── services/    # business logic + AI generation
│       ├── models/      # SQLAlchemy models
│       ├── schemas/     # Pydantic schemas
│       └── crud/        # DB access layer
├── docker/              # Postgres init scripts + Docker helpers
├── docs/                # Architecture, gameplay design, technical guide
└── docker-compose.yml
```

---

## AI Quest Generation

The generation pipeline (`server/app/services/generation_service.py`):

1. Teacher pastes lecture notes and selects quest type
2. LLM prompt instructs the model to output structured JSON: title, story framing, ordered concept tiles, distractors with explanations
3. Response is parsed and validated into the same schema as manually-authored quests
4. Quest is created with status `PENDING_TEACHER_REVIEW` — invisible to students
5. Teacher reviews, edits if needed, approves → quest goes live

The AI provider is env-configurable (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`). Defaults to Groq (free tier). Swap to OpenAI by changing three env vars. If `AI_API_KEY` is empty, a deterministic offline stub fires instead so the app always works.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | local postgres | SQLAlchemy connection string |
| `JWT_SECRET` | `change-me` | **Set this in production** |
| `AI_API_KEY` | *(empty)* | Groq or OpenAI API key; empty = offline fallback |
| `AI_BASE_URL` | Groq endpoint | Swap to `https://api.openai.com/v1` for OpenAI |
| `AI_MODEL` | `llama-3.3-70b-versatile` | Model name |
| `CORS_ORIGINS` | localhost:5173 | Comma-separated allowed origins |
