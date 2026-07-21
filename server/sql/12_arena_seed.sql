-- Questigo — Rapid Arena seed content
-- Two playable arena rounds: one closing out the DBMS track, one in Core Python.
-- Run after 11_arena.sql:  psql -d questigo_dev -f sql/12_arena_seed.sql

-- DBMS: Rapid Fire ------------------------------------------------------
INSERT INTO quests (
    subject_id, slug, position, node_label, title, topic, difficulty,
    xp_reward, is_boss, kind, brief_system_name, brief_story, prompt, status
)
SELECT
    s.id, 'dbms-rapid-fire', 5, 'Rapid Fire', 'DBMS Rapid Fire', 'Databases', 'MEDIUM',
    180, false, 'ARENA', 'Query Engine Arena',
    'Six questions, three hearts, one timer. Answer fast enough and the streak multiplier does the rest.',
    'Answer before the timer runs out. Keep your streak alive.',
    'PUBLISHED'
FROM subjects s WHERE s.slug = 'dbms'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO arena_rounds (quest_id, intro, seconds_per_question, questions)
SELECT q.id, 'Six questions. Three hearts. Go.', 20, '[
  {"id":"q1","prompt":"Which SQL clause runs FIRST when a query executes?",
   "options":["SELECT","FROM","WHERE","ORDER BY"],"answer":1,
   "explain":"FROM resolves the source tables before anything can be filtered or projected."},
  {"id":"q2","prompt":"What does a PRIMARY KEY guarantee about a column?",
   "options":["Values are sorted","Values are unique and never null","Lookups are cached","Values are encrypted"],"answer":1,
   "explain":"A primary key uniquely identifies each row, so it can never be null or duplicated."},
  {"id":"q3","prompt":"Which normal form removes partial dependencies on a composite key?",
   "options":["1NF","2NF","3NF","BCNF"],"answer":1,
   "explain":"2NF requires every non-key attribute to depend on the WHOLE composite key."},
  {"id":"q4","prompt":"A transaction that is committed must survive a crash. Which ACID property is that?",
   "options":["Atomicity","Consistency","Isolation","Durability"],"answer":3,
   "explain":"Durability means a committed write is persisted even if the system fails immediately after."},
  {"id":"q5","prompt":"Which JOIN keeps rows from the left table that have no match on the right?",
   "options":["INNER JOIN","LEFT JOIN","CROSS JOIN","NATURAL JOIN"],"answer":1,
   "explain":"LEFT JOIN preserves every left row, padding the right side with NULLs when nothing matches."},
  {"id":"q6","prompt":"Adding an index to a column usually makes which operation SLOWER?",
   "options":["SELECT with WHERE","INSERT","Sorted reads","Equality lookups"],"answer":1,
   "explain":"Every INSERT must also update the index structure, so writes pay the cost reads save."}
]'::jsonb
FROM quests q WHERE q.slug = 'dbms-rapid-fire'
ON CONFLICT (quest_id) DO NOTHING;

-- Python: Syntax Sprint --------------------------------------------------
-- The Python track is called `core-python` in local dev but `python-core` in the
-- Docker snapshot, so match either and append after that subject's last quest
-- rather than assuming a fixed position.
INSERT INTO quests (
    subject_id, slug, position, node_label, title, topic, difficulty,
    xp_reward, is_boss, kind, brief_system_name, brief_story, prompt, status
)
SELECT
    s.id, 'python-syntax-sprint',
    (SELECT COALESCE(MAX(q2.position), 0) + 1 FROM quests q2 WHERE q2.subject_id = s.id),
    'Syntax Sprint', 'Python Syntax Sprint', 'Core Python', 'EASY',
    100, false, 'ARENA', 'Interpreter Arena',
    'A warm-up round on Python fundamentals. Read fast, answer faster, and do not lose all three hearts.',
    'Answer before the timer runs out. Keep your streak alive.',
    'PUBLISHED'
FROM subjects s
WHERE s.slug IN ('core-python', 'python-core')
ORDER BY s.position
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO arena_rounds (quest_id, intro, seconds_per_question, questions)
SELECT q.id, 'Warm up. Six questions. Do not blink.', 15, '[
  {"id":"q1","prompt":"What is the type of the value 3 / 2 in Python 3?",
   "options":["int","float","Decimal","str"],"answer":1,
   "explain":"A single slash is true division and always produces a float — 1.5 here."},
  {"id":"q2","prompt":"Which of these is IMMUTABLE?",
   "options":["list","dict","tuple","set"],"answer":2,
   "explain":"A tuple cannot be changed after creation, which is why it can be used as a dict key."},
  {"id":"q3","prompt":"What does len(\"hello\") return?",
   "options":["4","5","6","Error"],"answer":1,
   "explain":"len counts characters, and hello has five of them."},
  {"id":"q4","prompt":"Which keyword defines a function in Python?",
   "options":["func","def","function","lambda"],"answer":1,
   "explain":"def introduces a named function; lambda only makes small anonymous ones."},
  {"id":"q5","prompt":"What does the slice nums[1:3] return from [10, 20, 30, 40]?",
   "options":["[10, 20]","[20, 30]","[20, 30, 40]","[30, 40]"],"answer":1,
   "explain":"Slices start at the first index and stop BEFORE the second, so you get positions 1 and 2."},
  {"id":"q6","prompt":"Which statement stops a loop entirely?",
   "options":["continue","pass","break","return"],"answer":2,
   "explain":"break exits the loop; continue only skips to the next iteration."}
]'::jsonb
FROM quests q WHERE q.slug = 'python-syntax-sprint'
ON CONFLICT (quest_id) DO NOTHING;
