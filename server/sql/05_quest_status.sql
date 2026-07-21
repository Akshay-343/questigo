-- Questigo — Quest review status (PostgreSQL)
-- Adds a publish workflow so AI-generated quests land as drafts and only become
-- visible to students once a teacher approves them.
-- Run after 03_content_schema.sql:  psql -d questigo_dev -f sql/05_quest_status.sql

-- Enum -----------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE quest_status AS ENUM ('PENDING_TEACHER_REVIEW', 'PUBLISHED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Columns --------------------------------------------------------------
-- Existing seeded quests default to PUBLISHED so the current DBMS tree stays live.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS status quest_status NOT NULL DEFAULT 'PUBLISHED';
-- Who generated the draft (NULL for seeded content).
ALTER TABLE quests ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
-- Provenance: the upload/source the draft was generated from.
ALTER TABLE quests ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_quests_status ON quests (status);
