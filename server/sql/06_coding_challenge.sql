-- Questigo — Coding challenge node type (PostgreSQL)
-- Adds a second quest kind: instead of a Sequence Builder, a CODING quest asks
-- the student to implement a function that is run against stored test cases.
-- Run after 05_quest_status.sql:  psql -d questigo_dev -f sql/06_coding_challenge.sql

-- Enum -----------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE quest_kind AS ENUM ('SEQUENCE', 'CODING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Existing quests default to SEQUENCE so the current DBMS tree is unaffected.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS kind quest_kind NOT NULL DEFAULT 'SEQUENCE';

-- Coding challenge attached to a CODING quest (one-to-one) --------------
CREATE TABLE IF NOT EXISTS coding_challenges (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id     UUID        NOT NULL UNIQUE REFERENCES quests(id) ON DELETE CASCADE,
    prompt       TEXT        NOT NULL,
    starter_code TEXT        NOT NULL DEFAULT '',
    language     VARCHAR(40) NOT NULL DEFAULT 'python',
    -- Array of { id, description, input, expectedOutput }. `input` is the
    -- argument expression passed to solution(...); outputs compared as strings.
    test_cases   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
