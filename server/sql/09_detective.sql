-- Questigo — Data Detective node type (PostgreSQL)
-- Adds a third quest kind: a DETECTIVE quest gives the student a live SQLite
-- sandbox seeded with case data; they write real SQL to chase clue checkpoints.
-- Run after 08_achievements.sql:  psql -d questigo_dev -f sql/09_detective.sql

-- Enum -----------------------------------------------------------------
ALTER TYPE quest_kind ADD VALUE IF NOT EXISTS 'DETECTIVE';

-- Detective case attached to a DETECTIVE quest (one-to-one) --------------
CREATE TABLE IF NOT EXISTS detective_cases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id    UUID        NOT NULL UNIQUE REFERENCES quests(id) ON DELETE CASCADE,
    -- Narrative shown when the case opens.
    setting     TEXT        NOT NULL,
    -- SQLite DDL + INSERTs; executed into a fresh in-memory DB per run.
    schema_sql  TEXT        NOT NULL,
    -- Evidence-panel description: [{ name, rowCount, columns: [{name, type, note}] }]
    schema_doc  JSONB       NOT NULL DEFAULT '[]'::jsonb,
    -- Ordered clue checkpoints:
    -- [{ id, title, objective, hint, expected_query, reveal }]
    -- expected_query and reveal NEVER leave the server before the clue is solved.
    checkpoints JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
