-- Questigo — Phase 1 schema (PostgreSQL)
-- Run first:  psql -d questigo -f sql/01_schema.sql
--
-- Requires the pgcrypto extension for gen_random_uuid() and (in the seed
-- script) bcrypt password hashing via crypt()/gen_salt().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Role enum -------------------------------------------------------------
DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- Users -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    role          user_role    NOT NULL DEFAULT 'STUDENT',
    xp            INTEGER      NOT NULL DEFAULT 0,
    level         INTEGER      NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- email already has a UNIQUE index; xp index supports leaderboard ordering.
CREATE INDEX IF NOT EXISTS idx_users_xp ON users (xp DESC);
