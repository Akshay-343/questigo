-- Questigo — Content seed (PostgreSQL)
-- Mirrors client/src/lib/sequenceData.ts (the DBMS track) so the skill tree is
-- served from the database. Idempotent: safe to re-run.
-- Run after 03_content_schema.sql:  psql -d questigo_dev -f sql/04_content_seed.sql

-- Subject ---------------------------------------------------------------
INSERT INTO subjects (slug, title, subtitle, description, position) VALUES
    ('dbms', 'DBMS', 'Database Management Systems',
     'Reconstruct the core engines, lifecycles, and pipelines that power a database.', 0)
ON CONFLICT (slug) DO NOTHING;

-- Quest 1: SQL Execution Order -----------------------------------------
INSERT INTO quests (subject_id, slug, position, node_label, title, topic, difficulty, xp_reward, is_boss, brief_system_name, brief_story, prompt)
SELECT s.id, 'sql-execution-order', 1, 'SQL Execution Engine', 'SQL Query Execution Order', 'Query Processing', 'MEDIUM', 150, false,
    'Query Execution Pipeline',
    'The query execution pipeline has been corrupted. Database requests can no longer be processed correctly. Reconstruct the correct execution flow and restore the query engine.',
    'Reconstruct the execution flow so the query engine processes clauses in the correct order.'
FROM subjects s WHERE s.slug = 'dbms'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO quest_tiles (quest_id, tile_key, label, sub, position, is_distractor)
SELECT q.id, v.tile_key, v.label, v.sub, v.position, v.is_distractor
FROM quests q, (VALUES
    ('from',    'FROM',     'Source tables & joins', 0, false),
    ('where',   'WHERE',    'Filter rows',           1, false),
    ('groupby', 'GROUP BY', 'Form groups',           2, false),
    ('having',  'HAVING',   'Filter groups',         3, false),
    ('select',  'SELECT',   'Project columns',       4, false),
    ('orderby', 'ORDER BY', 'Sort result',           5, false),
    ('commit',  'COMMIT',   'Not part of a query',  99, true)
) AS v(tile_key, label, sub, position, is_distractor)
WHERE q.slug = 'sql-execution-order'
ON CONFLICT (quest_id, tile_key) DO NOTHING;

INSERT INTO quest_links (quest_id, from_key, to_key, explanation)
SELECT q.id, v.from_key, v.to_key, v.explanation
FROM quests q, (VALUES
    ('from',    'where',   'Rows are read from the source in FROM before WHERE can filter them.'),
    ('where',   'groupby', 'Filtered rows are grouped only after WHERE removes non-matching rows.'),
    ('groupby', 'having',  'HAVING filters the groups formed by GROUP BY, so it must follow it.'),
    ('having',  'select',  'SELECT projects columns after grouping and HAVING have run.'),
    ('select',  'orderby', 'ORDER BY sorts the final projected result, so it runs last.')
) AS v(from_key, to_key, explanation)
WHERE q.slug = 'sql-execution-order'
ON CONFLICT (quest_id, from_key, to_key) DO NOTHING;

-- Quest 2: Normalization -----------------------------------------------
INSERT INTO quests (subject_id, slug, position, node_label, title, topic, difficulty, xp_reward, is_boss, brief_system_name, brief_story, prompt)
SELECT s.id, 'normalization', 2, 'Normalization Engine', 'Database Normalization Levels', 'Schema Design', 'MEDIUM', 175, false,
    'Schema Refinement Engine',
    'Redundant, anomaly-prone data has flooded the schema refinement engine. Recover the normalization workflow to progressively eliminate redundancy and restore data integrity.',
    'Recover the normalization workflow from raw data up to the strongest normal form.'
FROM subjects s WHERE s.slug = 'dbms'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO quest_tiles (quest_id, tile_key, label, sub, position, is_distractor)
SELECT q.id, v.tile_key, v.label, v.sub, v.position, v.is_distractor
FROM quests q, (VALUES
    ('unf',    'Unnormalized', 'Repeating groups',         0, false),
    ('1nf',    '1NF',          'Atomic values',            1, false),
    ('2nf',    '2NF',          'No partial deps',          2, false),
    ('3nf',    '3NF',          'No transitive deps',       3, false),
    ('bcnf',   'BCNF',         'Every determinant a key',  4, false),
    ('denorm', 'Denormalized', 'Reverses normalization',  99, true)
) AS v(tile_key, label, sub, position, is_distractor)
WHERE q.slug = 'normalization'
ON CONFLICT (quest_id, tile_key) DO NOTHING;

INSERT INTO quest_links (quest_id, from_key, to_key, explanation)
SELECT q.id, v.from_key, v.to_key, v.explanation
FROM quests q, (VALUES
    ('unf', '1nf',  '1NF is the first step: remove repeating groups so every value is atomic.'),
    ('1nf', '2nf',  '2NF builds on 1NF by removing partial dependencies on a composite key.'),
    ('2nf', '3nf',  '3NF builds on 2NF by removing transitive dependencies.'),
    ('3nf', 'bcnf', 'BCNF is a stricter form of 3NF where every determinant is a candidate key.')
) AS v(from_key, to_key, explanation)
WHERE q.slug = 'normalization'
ON CONFLICT (quest_id, from_key, to_key) DO NOTHING;

-- Quest 3: Transaction Lifecycle (boss) --------------------------------
INSERT INTO quests (subject_id, slug, position, node_label, title, topic, difficulty, xp_reward, is_boss, brief_system_name, brief_story, prompt)
SELECT s.id, 'transaction-lifecycle', 3, 'Transaction Controller', 'Transaction Lifecycle', 'Concurrency & Recovery', 'HARD', 200, true,
    'Transaction State Machine',
    'The transaction controller has lost track of its states — commits and rollbacks are firing out of sequence. Repair the transaction lifecycle so every transaction reaches a safe final state.',
    'Repair the lifecycle a transaction passes through from start to a committed final state.'
FROM subjects s WHERE s.slug = 'dbms'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO quest_tiles (quest_id, tile_key, label, sub, position, is_distractor)
SELECT q.id, v.tile_key, v.label, v.sub, v.position, v.is_distractor
FROM quests q, (VALUES
    ('active',     'Active',              'Executing operations', 0, false),
    ('partial',    'Partially Committed', 'Final statement done', 1, false),
    ('committed',  'Committed',           'Changes persisted',    2, false),
    ('terminated', 'Terminated',          'Transaction ends',     3, false),
    ('failed',     'Failed',              'A separate abort path',99, true)
) AS v(tile_key, label, sub, position, is_distractor)
WHERE q.slug = 'transaction-lifecycle'
ON CONFLICT (quest_id, tile_key) DO NOTHING;

INSERT INTO quest_links (quest_id, from_key, to_key, explanation)
SELECT q.id, v.from_key, v.to_key, v.explanation
FROM quests q, (VALUES
    ('active',    'partial',    'A transaction moves from Active to Partially Committed after its last operation executes.'),
    ('partial',   'committed',  'Once changes are safely written, it transitions from Partially Committed to Committed.'),
    ('committed', 'terminated', 'After committing, the transaction reaches its final Terminated state.')
) AS v(from_key, to_key, explanation)
WHERE q.slug = 'transaction-lifecycle'
ON CONFLICT (quest_id, from_key, to_key) DO NOTHING;
