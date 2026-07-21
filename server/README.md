# Questigo Backend (FastAPI) — Phase 1

Authentication API: register, login, current user. PostgreSQL via SQLAlchemy, JWT auth, bcrypt password hashing.

> Not yet wired to the frontend. Phase 1 = auth + User model + seed data.

## Stack
- **FastAPI** + **Uvicorn** — web framework + ASGI server
- **SQLAlchemy 2** — ORM
- **PostgreSQL** (psycopg2) — database
- **PyJWT** — JWT tokens
- **bcrypt** — password hashing
- **Pydantic v2** — request/response validation

## Project layout
```
server/
├── app/
│   ├── main.py              # FastAPI app, CORS, routers, error handlers
│   ├── core/                # config, database, security (jwt+bcrypt), levels, errors
│   ├── models/              # SQLAlchemy models (User)
│   ├── schemas/             # Pydantic schemas (auth, response envelope)
│   ├── crud/                # DB access (user)
│   ├── services/            # business logic (auth_service)
│   └── api/
│       ├── deps.py          # get_current_user, require_role
│       └── v1/auth.py       # /api/v1/auth/{register,login,me}
├── sql/
│   ├── 01_schema.sql        # tables + enum + indexes (run first)
│   └── 02_seed.sql          # demo users (bcrypt via pgcrypto)
├── scripts/seed.py          # Python seeder (alternative to 02_seed.sql)
├── requirements.txt
└── .env.example
```

## Setup

1. **Create the database** (once):
   ```bash
   createdb questigo        # or: psql -c "CREATE DATABASE questigo;"
   ```

2. **Apply schema + seed** (pure SQL path):
   ```bash
   psql -d questigo -f sql/01_schema.sql
   psql -d questigo -f sql/02_seed.sql
   ```

3. **Python environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate        # Windows
   # source .venv/bin/activate    # macOS/Linux
   pip install -r requirements.txt
   ```

4. **Configure env**:
   ```bash
   copy .env.example .env         # Windows  (cp on macOS/Linux)
   # edit DATABASE_URL and JWT_SECRET
   ```

5. **(Optional) seed via Python instead of 02_seed.sql**:
   ```bash
   python -m scripts.seed
   ```

6. **Run the API**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive docs: http://localhost:8000/docs

## API

Base path: `/api/v1`. All responses use the envelope `{ "data": ..., "error": ... }`.

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | `{ name, email, password }` | `{ user, token }` (creates a STUDENT) |
| POST | `/api/v1/auth/login` | — | `{ email, password }` | `{ user, token }` |
| GET | `/api/v1/auth/me` | Bearer | — | `{ user }` |
| GET | `/health` | — | — | `{ status: "ok" }` |

`token` is a JWT — send it as `Authorization: Bearer <token>`.

### Demo accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@questigo.dev` | `demo1234` |
| Student | `alice@student.dev` | `student123` |
| Student | `bob@student.dev` | `student123` |

### Quick test
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@student.dev\",\"password\":\"student123\"}"
```

## Notes
- Public registration always creates a **STUDENT**. Teacher accounts are seeded (no teacher self-registration).
- Level is derived from XP using the same threshold table as the frontend (`app/core/levels.py` ↔ `client/src/lib/levels.ts`).
- The demo accounts intentionally mirror the frontend's mock credentials so the existing login screen works once integrated.
