-- Questigo — Rapid Arena node type (PostgreSQL)
-- Adds a quest kind built for speed: a timed multiple-choice run. The student
-- answers a set of questions against a per-question countdown, keeping a streak
-- multiplier alive and spending hearts on wrong answers.
-- Run after 10_detective_seed.sql:  psql -d questigo_dev -f sql/11_arena.sql
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot be used by statements in the same
-- transaction, which is why the seed data lives in 12_arena_seed.sql.

-- Enum -----------------------------------------------------------------
ALTER TYPE quest_kind ADD VALUE IF NOT EXISTS 'ARENA';

-- Arena round attached to an ARENA quest (one-to-one) --------------------
CREATE TABLE IF NOT EXISTS arena_rounds (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id             UUID        NOT NULL UNIQUE REFERENCES quests(id) ON DELETE CASCADE,
    -- Short line shown on the "get ready" countdown before the first question.
    intro                TEXT        NOT NULL DEFAULT '',
    -- Countdown length per question; drives both the timer bar and the speed bonus.
    seconds_per_question INTEGER     NOT NULL DEFAULT 15,
    -- Ordered questions:
    -- [{ id, prompt, options: [str, ...], answer: int (0-based index), explain: str }]
    -- `answer` and `explain` NEVER leave the server before that question is answered.
    questions            JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
