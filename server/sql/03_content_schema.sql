-- Questigo — Content schema (PostgreSQL)
-- Subjects (skill-tree tracks), Quests (Sequence Builder nodes), their tiles &
-- per-link explanations, and per-student attempts.
-- Run after 01_schema.sql:  psql -d questigo_dev -f sql/03_content_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums -----------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Subjects (a track / skill tree) --------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    title       VARCHAR(120) NOT NULL,
    subtitle    VARCHAR(200),
    description  TEXT,
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Quests (a Sequence Builder node inside a subject) --------------------
CREATE TABLE IF NOT EXISTS quests (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id        UUID         NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    slug              VARCHAR(120) NOT NULL UNIQUE,
    position          INTEGER      NOT NULL DEFAULT 0,
    node_label        VARCHAR(120) NOT NULL,
    title             VARCHAR(160) NOT NULL,
    topic             VARCHAR(120),
    difficulty        difficulty   NOT NULL DEFAULT 'MEDIUM',
    xp_reward         INTEGER      NOT NULL DEFAULT 100,
    is_boss           BOOLEAN      NOT NULL DEFAULT false,
    brief_system_name VARCHAR(160),
    brief_story       TEXT,
    prompt            TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quests_subject ON quests (subject_id, position);

-- Tiles for a quest (canonical-order tiles + distractors) --------------
CREATE TABLE IF NOT EXISTS quest_tiles (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id      UUID        NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    tile_key      VARCHAR(60) NOT NULL,
    label         VARCHAR(120) NOT NULL,
    sub           VARCHAR(200),
    position      INTEGER     NOT NULL DEFAULT 0,
    is_distractor BOOLEAN     NOT NULL DEFAULT false,
    UNIQUE (quest_id, tile_key)
);
CREATE INDEX IF NOT EXISTS idx_quest_tiles_quest ON quest_tiles (quest_id, position);

-- Per-link teaching feedback ("from_key -> to_key") --------------------
CREATE TABLE IF NOT EXISTS quest_links (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id    UUID        NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    from_key    VARCHAR(60) NOT NULL,
    to_key      VARCHAR(60) NOT NULL,
    explanation TEXT        NOT NULL,
    UNIQUE (quest_id, from_key, to_key)
);

-- A student's attempt at a quest (one row per user+quest) --------------
CREATE TABLE IF NOT EXISTS quest_attempts (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id     UUID           NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status       attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
    clean_build  BOOLEAN        NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quest_attempts (user_id);
