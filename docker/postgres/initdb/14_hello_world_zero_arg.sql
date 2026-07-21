-- Questigo — make Hello World style challenges real zero-argument functions
--
-- The test-case `input` is the argument expression spliced into solution(<input>).
-- It used to be rejected when empty, so hello-world quests were authored with the
-- literal string 'None' as their input — forcing students to write
-- `def solution(value)` and ignore the argument just to return a greeting.
-- Empty inputs are now allowed, and an empty string produces a plain `solution()`
-- call, which is what these challenges should have been all along.
--
-- Targets any single-test challenge still using the 'None' placeholder, so it
-- fixes both the local `hello-world` quest and the `test` quest that ships in the
-- Docker snapshot without depending on either slug.
-- Run after 13_retire_detective.sql:  psql -d questigo_dev -f sql/14_hello_world_zero_arg.sql

UPDATE coding_challenges cc
SET
    prompt = 'Write a function `solution()` that takes no arguments and returns the string `Hello, World!`.'
             || E'\n\n'
             || 'Example: solution() -> ''Hello, World!''',
    starter_code = E'def solution():\n    # Return the greeting below\n    pass\n',
    test_cases = '[
      {"id":"tc1","description":"solution() returns the greeting","input":"","expectedOutput":"Hello, World!"}
    ]'::jsonb
WHERE jsonb_array_length(cc.test_cases) = 1
  AND cc.test_cases -> 0 ->> 'input' = 'None';
