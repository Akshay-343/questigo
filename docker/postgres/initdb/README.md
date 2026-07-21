# Postgres init scripts

Loaded **only when the data volume is empty** — first boot, or after
`docker compose down -v`. Postgres runs every file here in alphabetical order,
each in its own psql session, so the numeric prefixes define the order.

| File | What it does |
|---|---|
| `10_snapshot.sql` | Full `pg_dump` of the good demo database (schema + data), taken 2026-07-16. |
| `11_arena.sql` | Adds the `ARENA` quest kind + `arena_rounds` table. |
| `12_arena_seed.sql` | Seeds the two playable arena rounds (DBMS + Core Python). |
| `13_retire_detective.sql` | Drops the retired Data Detective quest content. |
| `14_hello_world_zero_arg.sql` | Rewrites Hello World as a true zero-argument `solution()`. |

`11`–`14` are copies of the same files in `server/sql/`, layered on top of the
snapshot because the snapshot predates them. They are idempotent
(`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`), so re-running is safe.

**When you next re-take the snapshot**, dump the live DB over `10_snapshot.sql`
and delete `11`–`14` from this directory — at that point they are already baked in.
Keep the originals in `server/sql/`, which is the migration history.

`ALTER TYPE ... ADD VALUE` cannot be used by statements in the same transaction,
which is why the enum change (`11`) and the seed that uses it (`12`) are separate
files rather than one.
