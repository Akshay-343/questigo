-- Questigo — Coding challenge seed (PostgreSQL)
-- Adds one CODING node to the DBMS track: implement a Python function that
-- builds a lookup index. Idempotent.
-- Run after 06_coding_challenge.sql:  psql -d questigo_dev -f sql/07_coding_seed.sql

-- Quest node (CODING) ---------------------------------------------------
INSERT INTO quests (subject_id, slug, position, node_label, title, topic, difficulty, xp_reward, is_boss, kind, brief_system_name, brief_story, prompt)
SELECT s.id, 'index-builder', 4, 'Index Engine', 'Build a Lookup Index', 'Indexing', 'HARD', 200, false, 'CODING',
    'Index Builder',
    'The index engine''s de-duplication routine has crashed, so key lookups are returning duplicates in random order. Reimplement the routine that turns raw keys into a clean, ordered index.',
    'Implement the index builder so every key appears once, in ascending order.'
FROM subjects s WHERE s.slug = 'dbms'
ON CONFLICT (slug) DO NOTHING;

-- Coding challenge payload ---------------------------------------------
INSERT INTO coding_challenges (quest_id, prompt, starter_code, language, test_cases)
SELECT q.id,
$prompt$Implement `solution(keys)` so it returns the unique values in `keys` sorted in ascending order, as a list.

A database index stores each key exactly once, in order, so lookups are fast. Given a list of integer keys (which may contain duplicates and be unordered), return the de-duplicated, ascending list.

Example: solution([3, 1, 2, 3, 1]) -> [1, 2, 3]$prompt$,
$starter$def solution(keys):
    # keys: list of integers (may contain duplicates, unordered)
    # return: the unique keys, sorted ascending
    pass
$starter$,
    'python',
    $json$[
        {"id": "tc1", "description": "removes duplicates and sorts", "input": "[3, 1, 2, 3, 1]", "expectedOutput": "[1, 2, 3]"},
        {"id": "tc2", "description": "already sorted, no duplicates", "input": "[1, 2, 3]", "expectedOutput": "[1, 2, 3]"},
        {"id": "tc3", "description": "empty list", "input": "[]", "expectedOutput": "[]"},
        {"id": "tc4", "description": "single element", "input": "[7]", "expectedOutput": "[7]"},
        {"id": "tc5", "description": "reverse order with duplicates", "input": "[5, 4, 4, 2, 5]", "expectedOutput": "[2, 4, 5]"}
    ]$json$::jsonb
FROM quests q WHERE q.slug = 'index-builder'
ON CONFLICT (quest_id) DO NOTHING;
