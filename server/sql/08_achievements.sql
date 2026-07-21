-- Questigo — Persisted achievements (PostgreSQL)
-- Promotes the previously-derived achievement catalogue to real tables: a static
-- `achievements` catalogue (display metadata) and `user_achievements` (per-student
-- unlock records with a timestamp). Unlock *logic* (the predicates) stays in
-- services/achievement_service.py; this file only stores catalogue + unlocks.
-- Run after 07_coding_seed.sql:  psql -d questigo_dev -f sql/08_achievements.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Catalogue of achievements (display metadata) -------------------------
CREATE TABLE IF NOT EXISTS achievements (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(60)  NOT NULL UNIQUE,
    title       VARCHAR(120) NOT NULL,
    description VARCHAR(240) NOT NULL,
    icon        VARCHAR(60)  NOT NULL,   -- Lucide icon name the frontend maps to a component
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Per-student unlock record (one row per user+achievement) -------------
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user_id);

-- Seed the catalogue (mirrors achievement_service.CATALOGUE). Idempotent:
-- re-running refreshes display text/icon/order without touching unlock rows.
INSERT INTO achievements (key, title, description, icon, position) VALUES
    ('first-quest',     'First Steps',      'Complete your first quest',                'Footprints', 1),
    ('clean-architect', 'Clean Architect',  'Finish a quest with a flawless build',     'Sparkles',   2),
    ('boss-slayer',     'Boss Slayer',      'Defeat a boss system',                     'Swords',     3),
    ('trifecta',        'Trifecta',         'Complete three quests',                    'Layers',     4),
    ('rising-star',     'Rising Star',      'Reach Level 3',                            'Star',       5),
    ('perfectionist',   'Perfectionist',    'Land three flawless builds',               'Gem',        6),
    ('veteran',         'Veteran',          'Reach Level 5',                            'Medal',      7)
ON CONFLICT (key) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        position = EXCLUDED.position;
