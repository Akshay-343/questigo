-- Questigo — retire the Data Detective node type
-- The SQL-sandbox quest kind was cut before the final build: it asked teachers to
-- author a database schema to add content, which was far heavier than the rest of
-- the authoring flow. Its replacement is the Rapid Arena (see 11_arena.sql).
--
-- This drops the seeded detective content. The `detective_cases` table and the
-- 'DETECTIVE' value in the quest_kind enum are intentionally LEFT IN PLACE:
-- Postgres cannot drop an enum value without recreating the type and rewriting
-- every dependent column, which is not worth doing for a now-unreachable value.
-- Run after 12_arena_seed.sql:  psql -d questigo_dev -f sql/13_retire_detective.sql

-- Attempts reference quests, so clear those first (ON DELETE CASCADE covers the
-- case rows themselves, but attempts are worth removing explicitly for clarity).
DELETE FROM quest_attempts
WHERE quest_id IN (SELECT id FROM quests WHERE kind = 'DETECTIVE');

DELETE FROM quests WHERE kind = 'DETECTIVE';
