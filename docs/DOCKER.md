# Docker — Questigo containerized stack

Three containers, orchestrated by `docker-compose.yml` at the repo root:

| Service    | Image / build      | Port (host)         | Role                                            |
|------------|--------------------|---------------------|-------------------------------------------------|
| `db`       | `postgres:17`      | `5433` → 5432       | PostgreSQL; auto-loads the snapshot on empty vol |
| `backend`  | `./server`         | `8000`              | FastAPI / uvicorn API                            |
| `frontend` | `./client`         | `5173` → 80         | Vite build served by nginx (proxies `/api`)      |

**Why 3 separate containers instead of one?** Frontend and backend have different
runtimes (Node/nginx vs Python) and rebuild independently. The frontend is just
static files behind nginx, which proxies `/api` to the backend — so the browser
stays same-origin and no CORS config is needed (same as the Vite dev proxy).

## First run

```bash
docker compose up -d --build
```

Then open **http://localhost:5173**. Login with your existing seeded accounts —
the DB comes pre-loaded from the snapshot.

Direct API check: http://localhost:8000/health

## The snapshot (your "good saved data")

The file `docker/postgres/initdb/10_snapshot.sql` is a `pg_dump` of your local
`questigo_dev` database. Postgres runs everything in `/docker-entrypoint-initdb.d`
**only when the data volume is empty** — i.e. on first boot or after a `down -v`.

Day-to-day, your experiments (file uploads, generated games, XP changes) are
written to the named volume `questigo_pgdata` and **persist** across
`docker compose stop/start/up/down` (without `-v`).

### Reset to the good snapshot

When an experiment breaks something, roll back to the saved data:

```bash
docker compose down -v && docker compose up -d
# or on Windows:
docker\reset-snapshot.bat
```

`-v` deletes the data volume; the next `up` re-runs the snapshot. Back to good data.

### Save a NEW good snapshot

Reached a fresh state you want to keep as the new baseline? Overwrite the snapshot
from the running container:

```bash
docker compose exec -T db pg_dump -U qdevdbusr -d questigo_dev \
  --no-owner --no-privileges --clean --if-exists > docker/postgres/initdb/10_snapshot.sql
# or on Windows:
docker\save-snapshot.bat
```

## Common commands

```bash
docker compose logs -f backend     # tail backend logs
docker compose ps                  # container status
docker compose up -d --build       # rebuild after code changes
docker compose stop                # stop, keep data
docker compose down                # remove containers, KEEP data volume
docker compose down -v             # remove containers AND data volume (full reset)
```

## Notes

- Secrets (AI key, JWT) are read from `server/.env` via `env_file`. The container
  overrides `DATABASE_URL` (points at the `db` service) and `CORS_ORIGINS`.
- Host DB port is **5433** to avoid clashing with a local PostgreSQL on 5432.
  Connect a GUI to `localhost:5433`, db `questigo_dev`, user `qdevdbusr`.
- Uploaded PDFs are processed in memory (not written to disk), so there's no
  upload volume to manage — all durable state lives in Postgres.
