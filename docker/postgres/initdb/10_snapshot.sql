--
-- PostgreSQL database dump
--

\restrict a2hA3GB5g7OdgbVp8IRie3zcAQ2QjwhY5jcUBI9VHhfdTjT8KtagrJoQbxdtwEX

-- Dumped from database version 17.10 (Debian 17.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS quests_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS quests_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.quest_tiles DROP CONSTRAINT IF EXISTS quest_tiles_quest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quest_links DROP CONSTRAINT IF EXISTS quest_links_quest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quest_attempts DROP CONSTRAINT IF EXISTS quest_attempts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quest_attempts DROP CONSTRAINT IF EXISTS quest_attempts_quest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.detective_cases DROP CONSTRAINT IF EXISTS detective_cases_quest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.coding_challenges DROP CONSTRAINT IF EXISTS coding_challenges_quest_id_fkey;
DROP INDEX IF EXISTS public.idx_users_xp;
DROP INDEX IF EXISTS public.idx_user_achievements_user;
DROP INDEX IF EXISTS public.idx_quests_subject;
DROP INDEX IF EXISTS public.idx_quests_status;
DROP INDEX IF EXISTS public.idx_quest_tiles_quest;
DROP INDEX IF EXISTS public.idx_attempts_user;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_slug_key;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS quests_slug_key;
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS quests_pkey;
ALTER TABLE IF EXISTS ONLY public.quest_tiles DROP CONSTRAINT IF EXISTS quest_tiles_quest_id_tile_key_key;
ALTER TABLE IF EXISTS ONLY public.quest_tiles DROP CONSTRAINT IF EXISTS quest_tiles_pkey;
ALTER TABLE IF EXISTS ONLY public.quest_links DROP CONSTRAINT IF EXISTS quest_links_quest_id_from_key_to_key_key;
ALTER TABLE IF EXISTS ONLY public.quest_links DROP CONSTRAINT IF EXISTS quest_links_pkey;
ALTER TABLE IF EXISTS ONLY public.quest_attempts DROP CONSTRAINT IF EXISTS quest_attempts_user_id_quest_id_key;
ALTER TABLE IF EXISTS ONLY public.quest_attempts DROP CONSTRAINT IF EXISTS quest_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.detective_cases DROP CONSTRAINT IF EXISTS detective_cases_quest_id_key;
ALTER TABLE IF EXISTS ONLY public.detective_cases DROP CONSTRAINT IF EXISTS detective_cases_pkey;
ALTER TABLE IF EXISTS ONLY public.coding_challenges DROP CONSTRAINT IF EXISTS coding_challenges_quest_id_key;
ALTER TABLE IF EXISTS ONLY public.coding_challenges DROP CONSTRAINT IF EXISTS coding_challenges_pkey;
ALTER TABLE IF EXISTS ONLY public.achievements DROP CONSTRAINT IF EXISTS achievements_pkey;
ALTER TABLE IF EXISTS ONLY public.achievements DROP CONSTRAINT IF EXISTS achievements_key_key;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_achievements;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.quests;
DROP TABLE IF EXISTS public.quest_tiles;
DROP TABLE IF EXISTS public.quest_links;
DROP TABLE IF EXISTS public.quest_attempts;
DROP TABLE IF EXISTS public.detective_cases;
DROP TABLE IF EXISTS public.coding_challenges;
DROP TABLE IF EXISTS public.achievements;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.quest_status;
DROP TYPE IF EXISTS public.quest_kind;
DROP TYPE IF EXISTS public.difficulty;
DROP TYPE IF EXISTS public.attempt_status;
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: attempt_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attempt_status AS ENUM (
    'IN_PROGRESS',
    'COMPLETED'
);


--
-- Name: difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.difficulty AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);


--
-- Name: quest_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quest_kind AS ENUM (
    'SEQUENCE',
    'CODING',
    'DETECTIVE'
);


--
-- Name: quest_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quest_status AS ENUM (
    'PENDING_TEACHER_REVIEW',
    'PUBLISHED',
    'REJECTED'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'STUDENT',
    'TEACHER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(60) NOT NULL,
    title character varying(120) NOT NULL,
    description character varying(240) NOT NULL,
    icon character varying(60) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coding_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quest_id uuid NOT NULL,
    prompt text NOT NULL,
    starter_code text DEFAULT ''::text NOT NULL,
    language character varying(40) DEFAULT 'python'::character varying NOT NULL,
    test_cases jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: detective_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detective_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quest_id uuid NOT NULL,
    setting text NOT NULL,
    schema_sql text NOT NULL,
    schema_doc jsonb DEFAULT '[]'::jsonb NOT NULL,
    checkpoints jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quest_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quest_id uuid NOT NULL,
    status public.attempt_status DEFAULT 'IN_PROGRESS'::public.attempt_status NOT NULL,
    clean_build boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quest_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quest_id uuid NOT NULL,
    from_key character varying(60) NOT NULL,
    to_key character varying(60) NOT NULL,
    explanation text NOT NULL
);


--
-- Name: quest_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_tiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quest_id uuid NOT NULL,
    tile_key character varying(60) NOT NULL,
    label character varying(120) NOT NULL,
    sub character varying(200),
    "position" integer DEFAULT 0 NOT NULL,
    is_distractor boolean DEFAULT false NOT NULL
);


--
-- Name: quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    slug character varying(120) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    node_label character varying(120) NOT NULL,
    title character varying(160) NOT NULL,
    topic character varying(120),
    difficulty public.difficulty DEFAULT 'MEDIUM'::public.difficulty NOT NULL,
    xp_reward integer DEFAULT 100 NOT NULL,
    is_boss boolean DEFAULT false NOT NULL,
    brief_system_name character varying(160),
    brief_story text,
    prompt text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.quest_status DEFAULT 'PUBLISHED'::public.quest_status NOT NULL,
    created_by uuid,
    source_name character varying(255),
    kind public.quest_kind DEFAULT 'SEQUENCE'::public.quest_kind NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(80) NOT NULL,
    title character varying(120) NOT NULL,
    subtitle character varying(200),
    description text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'STUDENT'::public.user_role NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievements (id, key, title, description, icon, "position", created_at) FROM stdin;
e70f11bd-e3b5-45c6-a365-6666c53ccaed	first-quest	First Steps	Complete your first quest	Footprints	1	2026-06-19 10:17:55.461709+00
14af48cc-ee6d-449a-bd17-170ece2ce175	clean-architect	Clean Architect	Finish a quest with a flawless build	Sparkles	2	2026-06-19 10:17:55.461709+00
d72bcda7-7bd3-438c-872e-44d1d49e4ba4	boss-slayer	Boss Slayer	Defeat a boss system	Swords	3	2026-06-19 10:17:55.461709+00
3f3ea092-c67e-4bbb-b2ae-a4dcdedd019f	trifecta	Trifecta	Complete three quests	Layers	4	2026-06-19 10:17:55.461709+00
54b13999-3183-41e8-ac0b-25f12bd70fea	rising-star	Rising Star	Reach Level 3	Star	5	2026-06-19 10:17:55.461709+00
413719d6-f3f9-494c-8b0c-95a52b4104be	perfectionist	Perfectionist	Land three flawless builds	Gem	6	2026-06-19 10:17:55.461709+00
72ded330-3483-45c1-bf93-49859433e253	veteran	Veteran	Reach Level 5	Medal	7	2026-06-19 10:17:55.461709+00
\.


--
-- Data for Name: coding_challenges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_challenges (id, quest_id, prompt, starter_code, language, test_cases, created_at) FROM stdin;
a051ea59-47c9-4b4d-9975-465154109c20	c04c259c-bef0-45f3-b896-d5eaa7c61125	Implement `solution(keys)` so it returns the unique values in `keys` sorted in ascending order, as a list.\n\nA database index stores each key exactly once, in order, so lookups are fast. Given a list of integer keys (which may contain duplicates and be unordered), return the de-duplicated, ascending list.\n\nExample: solution([3, 1, 2, 3, 1]) -> [1, 2, 3]	def solution(keys):\n    # keys: list of integers (may contain duplicates, unordered)\n    # return: the unique keys, sorted ascending\n    pass\n	python	[{"id": "tc1", "input": "[3, 1, 2, 3, 1]", "description": "removes duplicates and sorts", "expectedOutput": "[1, 2, 3]"}, {"id": "tc2", "input": "[1, 2, 3]", "description": "already sorted, no duplicates", "expectedOutput": "[1, 2, 3]"}, {"id": "tc3", "input": "[]", "description": "empty list", "expectedOutput": "[]"}, {"id": "tc4", "input": "[7]", "description": "single element", "expectedOutput": "[7]"}, {"id": "tc5", "input": "[5, 4, 4, 2, 5]", "description": "reverse order with duplicates", "expectedOutput": "[2, 4, 5]"}]	2026-06-18 20:14:36.903733+00
81a3e9a1-e4f3-4447-b20e-8978d9c6f003	6fe93486-31f4-4d6e-bbe2-ef7d852b1273	print helloworld	def solution(value):\n    # implement me\n    pass\n	python	[{"id": "tc1", "input": "None", "description": "test1- oputupt", "expectedOutput": "Hello World"}]	2026-07-06 10:14:11.117244+00
\.


--
-- Data for Name: detective_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detective_cases (id, quest_id, setting, schema_sql, schema_doc, checkpoints, created_at) FROM stdin;
72cb99ee-9e05-46b8-be37-c1b3e461b8bf	ed030649-d835-455d-bbf8-9f44620def44	You are the on-call database forensics analyst. The audit trail survived — whoever did this forgot the database remembers everything. You have a read-only SQL terminal and four evidence tables. Work the case one clue at a time; every answer is a query away.	\nCREATE TABLE students (\n    id    INTEGER PRIMARY KEY,\n    name  TEXT NOT NULL,\n    class TEXT NOT NULL\n);\nCREATE TABLE exam_results (\n    student_id INTEGER NOT NULL,\n    subject    TEXT NOT NULL,\n    marks      INTEGER NOT NULL\n);\nCREATE TABLE staff (\n    id   TEXT PRIMARY KEY,\n    name TEXT NOT NULL,\n    role TEXT NOT NULL\n);\nCREATE TABLE audit_log (\n    id           INTEGER PRIMARY KEY,\n    actor_id     TEXT NOT NULL,\n    action       TEXT NOT NULL,\n    target_table TEXT NOT NULL,\n    target_id    INTEGER,\n    logged_at    TEXT NOT NULL\n);\n\nINSERT INTO students (id, name, class) VALUES\n (1,'Ishaan Verma','MCA-A'),\n (2,'Priya Nair','MCA-A'),\n (3,'Rohit Shetty','MCA-B'),\n (4,'Ananya Iyer','MCA-A'),\n (5,'Kabir Singh','MCA-B'),\n (6,'Meghna Das','MCA-A'),\n (7,'Aditya Kulkarni','MCA-B'),\n (8,'Sneha Reddy','MCA-A'),\n (9,'Varun Menon','MCA-B'),\n (10,'Zoya Sheikh','MCA-A');\n\n-- Every student has DBMS + OS results EXCEPT 4, 7, 9 — their rows were deleted.\nINSERT INTO exam_results (student_id, subject, marks) VALUES\n (1,'DBMS',71),(1,'OS',64),\n (2,'DBMS',58),(2,'OS',77),\n (3,'DBMS',66),(3,'OS',59),\n (5,'DBMS',49),(5,'OS',73),\n (6,'DBMS',82),(6,'OS',68),\n (8,'DBMS',75),(8,'OS',81),\n (10,'DBMS',63),(10,'OS',70);\n\nINSERT INTO staff (id, name, role) VALUES\n ('S01','Prof. Meera Pillai','Exam Controller'),\n ('S02','Arjun Rao','Lab Assistant'),\n ('S03','Kiran Dutta','Database Admin'),\n ('S04','Farida Khan','Records Clerk');\n\nINSERT INTO audit_log (id, actor_id, action, target_table, target_id, logged_at) VALUES\n (1,'S01','INSERT','exam_results',1,'2026-07-14 17:02:11'),\n (2,'S01','INSERT','exam_results',2,'2026-07-14 17:02:45'),\n (3,'S01','INSERT','exam_results',3,'2026-07-14 17:03:20'),\n (4,'S04','UPDATE','students',5,'2026-07-14 18:11:04'),\n (5,'S03','DELETE','temp_uploads',NULL,'2026-07-14 19:30:00'),\n (6,'S01','LOGIN','sessions',NULL,'2026-07-14 16:58:59'),\n (7,'S02','LOGIN','sessions',NULL,'2026-07-15 02:09:41'),\n (8,'S02','DELETE','exam_results',4,'2026-07-15 02:11:08'),\n (9,'S02','DELETE','exam_results',4,'2026-07-15 02:11:31'),\n (10,'S02','DELETE','exam_results',7,'2026-07-15 02:12:19'),\n (11,'S02','DELETE','exam_results',7,'2026-07-15 02:12:44'),\n (12,'S02','DELETE','exam_results',9,'2026-07-15 02:13:52'),\n (13,'S02','DELETE','exam_results',9,'2026-07-15 02:14:10'),\n (14,'S02','LOGOUT','sessions',NULL,'2026-07-15 02:16:03'),\n (15,'S04','LOGIN','sessions',NULL,'2026-07-15 08:01:15'),\n (16,'S03','UPDATE','settings',NULL,'2026-07-15 08:45:27');\n	[{"name": "students", "columns": [{"name": "id", "note": "student id", "type": "INTEGER"}, {"name": "name", "note": "full name", "type": "TEXT"}, {"name": "class", "note": "section, e.g. MCA-A", "type": "TEXT"}], "rowCount": 10}, {"name": "exam_results", "columns": [{"name": "student_id", "note": "references students.id", "type": "INTEGER"}, {"name": "subject", "note": "DBMS or OS", "type": "TEXT"}, {"name": "marks", "note": "0-100", "type": "INTEGER"}], "rowCount": 14}, {"name": "staff", "columns": [{"name": "id", "note": "staff id, e.g. S01", "type": "TEXT"}, {"name": "name", "note": "full name", "type": "TEXT"}, {"name": "role", "note": "job title", "type": "TEXT"}], "rowCount": 4}, {"name": "audit_log", "columns": [{"name": "id", "note": "log entry id", "type": "INTEGER"}, {"name": "actor_id", "note": "references staff.id", "type": "TEXT"}, {"name": "action", "note": "INSERT / UPDATE / DELETE / LOGIN / LOGOUT", "type": "TEXT"}, {"name": "target_table", "note": "table the action touched", "type": "TEXT"}, {"name": "target_id", "note": "affected row id (nullable)", "type": "INTEGER"}, {"name": "logged_at", "note": "timestamp", "type": "TEXT"}], "rowCount": 16}]	[{"id": "c1", "hint": "LEFT JOIN students to exam_results and keep the rows where the join found nothing (IS NULL). NOT IN works too.", "title": "The Missing", "reveal": "Ananya Iyer. Aditya Kulkarni. Varun Menon. The three toppers of the DBMS midterm — the same three who filed a misconduct complaint last week. This was not random corruption. Someone chose them.", "objective": "Start with the victims. List the names of every student who has NO rows left in exam_results.", "expected_query": "SELECT s.name FROM students s LEFT JOIN exam_results e ON e.student_id = s.id WHERE e.student_id IS NULL"}, {"id": "c2", "hint": "Filter audit_log with two conditions: action = 'DELETE' AND target_table = 'exam_results'.", "title": "Fingerprints in the Log", "reveal": "Six deletions between 02:11 and 02:14 AM — surgical, and all signed by the same staff id: S02. Whoever it is logged in at 02:09 and was gone by 02:16. Seven minutes. They knew exactly what they came for.", "objective": "The database logs everything. Pull the actor_id and target_id of every DELETE that hit the exam_results table.", "expected_query": "SELECT actor_id, target_id FROM audit_log WHERE action = 'DELETE' AND target_table = 'exam_results'"}, {"id": "c3", "hint": "JOIN staff ON staff.id = audit_log.actor_id, keep the DELETE + exam_results filter, and use DISTINCT so the six log rows collapse to one.", "title": "Unmasked", "reveal": "Arjun Rao, Lab Assistant. He proctored that midterm — and he is the staff member those three students reported for selling answer keys. Motive, access, and now his id on every deletion.", "objective": "S02 is just an id. Join the staff table to the delete entries and produce the culprit's name and role — one row.", "expected_query": "SELECT DISTINCT st.name, st.role FROM staff st JOIN audit_log a ON a.actor_id = st.id WHERE a.action = 'DELETE' AND a.target_table = 'exam_results'"}, {"id": "c4", "hint": "Same join as before, but aggregate: COUNT(*) the delete entries and GROUP BY the staff name.", "title": "The Evidence Pack", "reveal": "Arjun Rao — six rows deleted, three students targeted, one motive. The evidence pack is complete and the audit trail is untouchable. Case ready for the board before the noon deadline.", "objective": "The disciplinary board needs one final exhibit: the culprit's name and the total number of result rows they deleted, in a single row.", "expected_query": "SELECT st.name, COUNT(*) FROM staff st JOIN audit_log a ON a.actor_id = st.id WHERE a.action = 'DELETE' AND a.target_table = 'exam_results' GROUP BY st.name"}]	2026-07-16 06:12:55.361742+00
\.


--
-- Data for Name: quest_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quest_attempts (id, user_id, quest_id, status, clean_build, completed_at, created_at) FROM stdin;
52c88e5c-8e76-4d1a-942f-db26810367a3	b70ec2a1-cd81-41d9-a944-1330612d982e	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	COMPLETED	f	2026-06-19 12:55:22.789539+00	2026-06-19 12:55:22.782148+00
b7ed6f66-0820-4702-8133-ac8d0a2fce1b	b70ec2a1-cd81-41d9-a944-1330612d982e	759b88a0-ad72-44b5-b6ae-fd7a57e96338	COMPLETED	t	2026-07-03 19:30:48.303116+00	2026-07-03 19:30:48.310185+00
72980226-8233-4051-a570-c1134112088a	ac8950fe-768e-4196-b807-254b79176288	6fe93486-31f4-4d6e-bbe2-ef7d852b1273	COMPLETED	f	2026-07-06 10:14:52.547603+00	2026-07-06 10:14:52.525544+00
\.


--
-- Data for Name: quest_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quest_links (id, quest_id, from_key, to_key, explanation) FROM stdin;
d414fba8-5c09-4f18-8111-a55980a0b564	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	where	groupby	Filtered rows are grouped only after WHERE removes non-matching rows.
134955c2-f5b4-42c5-9b69-c3c390cd0574	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	groupby	having	HAVING filters the groups formed by GROUP BY, so it must follow it.
fc6aaa78-7577-45d8-88d2-90d5cc372485	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	having	select	SELECT projects columns after grouping and HAVING have run.
019379d0-7aa7-4f6f-b364-41fc1d49ae8c	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	select	orderby	ORDER BY sorts the final projected result, so it runs last.
e0838aef-97d0-49c2-9e29-5e14de710df0	759b88a0-ad72-44b5-b6ae-fd7a57e96338	unf	1nf	1NF is the first step: remove repeating groups so every value is atomic.
dc6f73b6-2079-47d1-a0a8-d83b9ec396c5	759b88a0-ad72-44b5-b6ae-fd7a57e96338	1nf	2nf	2NF builds on 1NF by removing partial dependencies on a composite key.
7e922c65-0738-4e2e-a6ed-e6c453038e3f	759b88a0-ad72-44b5-b6ae-fd7a57e96338	2nf	3nf	3NF builds on 2NF by removing transitive dependencies.
85e76efe-d186-4cf1-ad13-fdd814b167b9	759b88a0-ad72-44b5-b6ae-fd7a57e96338	3nf	bcnf	BCNF is a stricter form of 3NF where every determinant is a candidate key.
a87364fa-b3aa-45fb-861b-40ed35edadad	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	active	partial	A transaction moves from Active to Partially Committed after its last operation executes.
2deba38c-cf7d-436b-a933-de17b6754e23	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	partial	committed	Once changes are safely written, it transitions from Partially Committed to Committed.
13a696bb-0665-43cd-a2f2-16d5b5b77911	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	committed	terminated	After committing, the transaction reaches its final Terminated state.
39b36323-58b7-49e6-b5c1-7827e97966c9	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	from	where	Rows are read from the source in FROM before WHERE can filter them.
83062ea5-dc83-4422-8ebf-65325fccf7a0	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s1	s2	Application layer hands off to Transport for delivery handling.
cb5de027-9e82-4ca5-a927-bcef4f6413d8	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s2	s3	Transport layer relies on Network for routing.
a89700e6-845b-4d63-b1bb-83aaf15e6075	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s3	s4	Network layer uses Data Link for framing and addressing.
100019ec-9672-4c17-b109-9afa59fbd61d	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s4	s5	Data Link layer sends to Physical for transmission.
f488d99b-8832-460c-92d1-bb7dd51d9389	f5949074-9338-4532-9eca-70573941df82	s1	s2	First, define the range of numbers to check.
d814d185-f67a-45da-b734-c23e3b4440fc	f5949074-9338-4532-9eca-70573941df82	s2	s3	Then, check each number for divisibility and append to the list if it meets the condition.
a33058bb-c5de-42be-97c5-df0610a8cbd4	f5949074-9338-4532-9eca-70573941df82	s3	s4	Finally, print the list of numbers that meet the condition.
bae848d8-78f4-4e89-824a-e0534e6d09b3	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s1	s2	Then, define the function to compute the factorial.
b7270d13-c5d8-4da0-b391-26021763a87f	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s2	s3	Next, check the base case and call the recursive function if necessary.
f83c2c5c-a39b-46b3-b45e-47d41761bb85	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s3	s4	Finally, print the result.
1f8c8ea0-5503-4fa5-a736-5877c16f69e8	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s4	s5	“Print result” must come before “Get user input”.
\.


--
-- Data for Name: quest_tiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quest_tiles (id, quest_id, tile_key, label, sub, "position", is_distractor) FROM stdin;
d9607698-b677-46f9-9ced-ee8d2a354dff	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	where	WHERE	Filter rows	1	f
739b0318-d59d-4523-97ee-6e30908b8e75	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	groupby	GROUP BY	Form groups	2	f
85f68e6a-49f5-47ad-a9a6-b41cdd4d0d06	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	having	HAVING	Filter groups	3	f
3a140a11-428a-42a1-b064-0b301b59d188	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	select	SELECT	Project columns	4	f
ee5a8801-ece2-47d6-9da7-e05462d73d2a	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	orderby	ORDER BY	Sort result	5	f
5f35213d-a66e-4a94-b811-7bf556c68f3a	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	commit	COMMIT	Not part of a query	99	t
958c1d7c-7a26-4da3-a32c-c53cd2b8724e	759b88a0-ad72-44b5-b6ae-fd7a57e96338	unf	Unnormalized	Repeating groups	0	f
53504fad-0b32-4655-8bef-49960ce123ef	759b88a0-ad72-44b5-b6ae-fd7a57e96338	1nf	1NF	Atomic values	1	f
10fd2876-dd75-49e6-8df3-76b092d910ce	759b88a0-ad72-44b5-b6ae-fd7a57e96338	2nf	2NF	No partial deps	2	f
4563f59a-42cf-4a22-a7c2-a275916923fa	759b88a0-ad72-44b5-b6ae-fd7a57e96338	3nf	3NF	No transitive deps	3	f
5999e77c-0785-408a-9c54-4215444b3da8	759b88a0-ad72-44b5-b6ae-fd7a57e96338	bcnf	BCNF	Every determinant a key	4	f
6aa2d70e-a042-4dbd-b307-b1fd4e138e3d	759b88a0-ad72-44b5-b6ae-fd7a57e96338	denorm	Denormalized	Reverses normalization	99	t
94e0c9e6-c5ce-47b1-adf6-de5b148285b8	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	active	Active	Executing operations	0	f
a5488f7c-beb4-4e24-8f55-1c232e8d8568	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	partial	Partially Committed	Final statement done	1	f
cc27c99f-8e42-4c8d-b656-1bc04db72910	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	committed	Committed	Changes persisted	2	f
315c9011-1cf6-459c-88be-b517d3c63107	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	terminated	Terminated	Transaction ends	3	f
75e70cbe-20b3-4b23-a644-88b574f0d0e5	1e531da7-ef3c-4c16-bd98-82b1c22fc86f	failed	Failed	A separate abort path	99	t
e83ac889-9cae-4f8a-abde-bb5a7aaf441e	8bcc9361-c93f-48ff-8a65-9fb212d1e93e	from	FROM	edited sub	0	f
addf5685-8447-487c-8ca4-199116922751	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s1	Application	Start of data flow	0	f
969f3538-a665-44ab-876f-248d470ca764	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s2	Transport	End-to-end delivery	1	f
50072a29-0e61-430c-9384-36e55e0a2219	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s3	Network	IP routing	2	f
1edaf4cf-1d28-4da6-9884-e186a8eb7466	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s4	Data Link	Framing and MAC addressing	3	f
ad71ccec-1a49-4c37-ae09-ef68399a3227	cc2ecaff-b76b-491e-91fc-1e80afc86b14	s5	Physical	Transmit raw bits	4	f
ecb6ea09-bbdb-4214-8766-133cbb8d6be3	cc2ecaff-b76b-491e-91fc-1e80afc86b14	d1	Session	Incorrect layer order	0	t
ff40da56-f5e2-4533-afd4-b74a2d5cafa5	cc2ecaff-b76b-491e-91fc-1e80afc86b14	d2	Presentation	Not in this sequence	1	t
cc578707-590c-460c-a0fc-809b8fdeb7ca	f5949074-9338-4532-9eca-70573941df82	s1	Define range	Use range() function	0	f
30034008-ea26-4c90-b218-9395d198cdb1	f5949074-9338-4532-9eca-70573941df82	s2	Check divisibility	Use if statement	1	f
7c33e086-bf12-44fe-95e8-2eaec60f5814	f5949074-9338-4532-9eca-70573941df82	s3	Append to list	Use append() method	2	f
5bd0377b-81f6-4f59-8f1b-e43841a7c2a2	f5949074-9338-4532-9eca-70573941df82	s4	Print result	Use print() function	3	f
f560b329-7691-4042-b1c4-e15965f4ca52	f5949074-9338-4532-9eca-70573941df82	d1	Use while loop	Incorrect loop type	0	t
74698edb-acf4-4bec-b9d9-3ee81620f1d8	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s1	Define function	Use def keyword	0	f
37d799f0-5664-4a5c-b6d9-fba81b424741	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s2	Check base case	Use if statement	1	f
5cfbc515-bc39-4c1d-8e82-a68d8e3eecc3	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s3	Call recursive function	Use function name	2	f
f9c9d100-150d-4978-b0b4-26ea3c503cf4	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s4	Print result	Use print() function	3	f
a5b17051-1951-4bd9-8e4c-ea7874768609	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	s5	Get user input	Use raw_input() function	4	f
8e29ee1a-5202-458d-ab1c-b9de2a067d4c	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	d1	Use while loop	Incorrect loop type	0	t
cc0edec5-f9a5-4fae-8e7f-80dd572bec83	b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	d2	Use for loop	Incorrect loop type	1	t
\.


--
-- Data for Name: quests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quests (id, subject_id, slug, "position", node_label, title, topic, difficulty, xp_reward, is_boss, brief_system_name, brief_story, prompt, created_at, status, created_by, source_name, kind) FROM stdin;
759b88a0-ad72-44b5-b6ae-fd7a57e96338	16470f21-7b2b-40bb-af5e-b7c975390569	normalization	2	Normalization Engine	Database Normalization Levels	Schema Design	MEDIUM	175	f	Schema Refinement Engine	Redundant, anomaly-prone data has flooded the schema refinement engine. Recover the normalization workflow to progressively eliminate redundancy and restore data integrity.	Recover the normalization workflow from raw data up to the strongest normal form.	2026-06-17 17:41:07.255+00	PUBLISHED	\N	\N	SEQUENCE
1e531da7-ef3c-4c16-bd98-82b1c22fc86f	16470f21-7b2b-40bb-af5e-b7c975390569	transaction-lifecycle	3	Transaction Controller	Transaction Lifecycle	Concurrency & Recovery	HARD	200	t	Transaction State Machine	The transaction controller has lost track of its states — commits and rollbacks are firing out of sequence. Repair the transaction lifecycle so every transaction reaches a safe final state.	Repair the lifecycle a transaction passes through from start to a committed final state.	2026-06-17 17:41:07.255+00	PUBLISHED	\N	\N	SEQUENCE
8bcc9361-c93f-48ff-8a65-9fb212d1e93e	16470f21-7b2b-40bb-af5e-b7c975390569	sql-execution-order	1	SQL Execution Engine	SQL Query Execution Order	Query Processing	MEDIUM	150	f	Query Execution Pipeline	The query execution pipeline has been corrupted. Database requests can no longer be processed correctly. Reconstruct the correct execution flow and restore the query engine.	Reconstruct the execution flow so the query engine processes clauses in the correct order.	2026-06-17 17:41:07.255+00	PUBLISHED	\N	\N	SEQUENCE
c04c259c-bef0-45f3-b896-d5eaa7c61125	16470f21-7b2b-40bb-af5e-b7c975390569	index-builder	4	Index Engine	Build a Lookup Index	Indexing	HARD	200	f	Index Builder	The index engine's de-duplication routine has crashed, so key lookups are returning duplicates in random order. Reimplement the routine that turns raw keys into a clean, ordered index.	Implement the index builder so every key appears once, in ascending order.	2026-06-18 20:14:36.903733+00	PUBLISHED	\N	\N	CODING
cc2ecaff-b76b-491e-91fc-1e80afc86b14	b8bae223-821c-4bf2-bd7d-85453affa338	osi-layer-data-flow	1	Network Basics	OSI Layer Data Flow	OSI Model	EASY	80	f	Network Demo	Data is sent from a sender to a receiver through the OSI model layers.	Arrange the OSI layers in the order data flows from sender to receiver.	2026-07-03 19:33:19.473773+00	REJECTED	c4c1e834-2466-4bf7-8094-e86c5cbc1ce5	\N	SEQUENCE
6fe93486-31f4-4d6e-bbe2-ef7d852b1273	19cd01c4-97de-46de-8854-d2c6490c6d43	test	1	test	test	test	MEDIUM	120	f	test	\N	print helloworld	2026-07-06 10:14:11.117244+00	PUBLISHED	c4c1e834-2466-4bf7-8094-e86c5cbc1ce5	\N	CODING
f5949074-9338-4532-9eca-70573941df82	b5a32918-1581-4b34-a4c1-6e2b8723105b	divisible-by-7-but-not-5	1	Python Basics	Divisible by 7 but not 5	Conditional Statements	EASY	80	f	Python Core	Write a program to find numbers between 2000 and 3200 that are divisible by 7 but not 5.	Arrange the steps to solve the problem in the correct order.	2026-07-06 13:44:48.942797+00	PUBLISHED	c4c1e834-2466-4bf7-8094-e86c5cbc1ce5	361662507-100-Python-Programming-Challenges.pdf	SEQUENCE
b9ef5de9-b96c-4e2a-a70a-47a4c6f47f84	b5a32918-1581-4b34-a4c1-6e2b8723105b	compute-factorial	2	Python Functions	Compute Factorial	Recursion	MEDIUM	120	f	Python Core	Write a program to compute the factorial of a given number.	Arrange the steps to solve the problem in the correct order.	2026-07-06 13:44:48.942797+00	PUBLISHED	c4c1e834-2466-4bf7-8094-e86c5cbc1ce5	361662507-100-Python-Programming-Challenges.pdf	SEQUENCE
ed030649-d835-455d-bbf8-9f44620def44	16470f21-7b2b-40bb-af5e-b7c975390569	the-vanished-marks	5	Archive Vault	The Vanished Marks	SQL Investigation	MEDIUM	180	f	University Records DB	At 03:00 AM, monitoring pinged a silent anomaly in the university records database. No crash. No corruption. Just missing rows — the midterm results of the top students, gone hours before results publish at noon. The Dean wants a name.	Query the evidence tables to uncover who deleted the records — and prove it.	2026-07-16 06:12:55.353035+00	PUBLISHED	\N	\N	DETECTIVE
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subjects (id, slug, title, subtitle, description, "position", created_at) FROM stdin;
16470f21-7b2b-40bb-af5e-b7c975390569	dbms	DBMS	Database Management Systems	Reconstruct the core engines, lifecycles, and pipelines that power a database.	0	2026-06-17 17:41:07.255+00
c46836fd-c934-4f92-b3ff-e2c1f3199250	zz-test-track	ZZ Test Track	\N	\N	1	2026-06-22 20:20:09.623025+00
b8bae223-821c-4bf2-bd7d-85453affa338	networks-demo-check	Networks Demo Check	\N	\N	2	2026-07-03 19:33:19.473773+00
19cd01c4-97de-46de-8854-d2c6490c6d43	helloworld	helloworld	\N	\N	3	2026-07-06 10:14:11.117244+00
b5a32918-1581-4b34-a4c1-6e2b8723105b	python-core	Python Core	\N	\N	4	2026-07-06 13:44:48.942797+00
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_achievements (user_id, achievement_id, unlocked_at) FROM stdin;
b70ec2a1-cd81-41d9-a944-1330612d982e	54b13999-3183-41e8-ac0b-25f12bd70fea	2026-06-19 12:03:34.709255+00
b70ec2a1-cd81-41d9-a944-1330612d982e	72ded330-3483-45c1-bf93-49859433e253	2026-06-19 12:03:34.709255+00
b70ec2a1-cd81-41d9-a944-1330612d982e	e70f11bd-e3b5-45c6-a365-6666c53ccaed	2026-06-19 12:55:22.805639+00
b70ec2a1-cd81-41d9-a944-1330612d982e	14af48cc-ee6d-449a-bd17-170ece2ce175	2026-06-22 20:20:09.895683+00
ac8950fe-768e-4196-b807-254b79176288	54b13999-3183-41e8-ac0b-25f12bd70fea	2026-07-06 10:14:22.080451+00
ac8950fe-768e-4196-b807-254b79176288	e70f11bd-e3b5-45c6-a365-6666c53ccaed	2026-07-06 10:14:52.553378+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, xp, level, created_at) FROM stdin;
c4c1e834-2466-4bf7-8094-e86c5cbc1ce5	Dr. V. Sukanya	teacher@questigo.dev	$2a$06$fZsl2Deo569zrAGfn8uhgupaE1f4wFXFcZmtj6ftNPu8i7AgU2xDy	TEACHER	0	1	2026-06-17 17:17:25.766582+00
b70ec2a1-cd81-41d9-a944-1330612d982e	Alice Chen	alice@student.dev	$2a$06$ihw3Lw.MsdUOJZoa1MMFiuOoSM98cIzwFeXoH6Pnzaqpm3gT3Bpwy	STUDENT	2655	6	2026-06-17 17:17:25.766582+00
ac8950fe-768e-4196-b807-254b79176288	Akshay	akshay@student.dev	$2a$06$hC1ctIJ0KVewIEE1ZAitwu8Fk8/l5KOSVhNxC8/xd0VuAdzX0fytq	STUDENT	970	4	2026-06-17 17:17:25.766582+00
\.


--
-- Name: achievements achievements_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_key_key UNIQUE (key);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: coding_challenges coding_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_challenges
    ADD CONSTRAINT coding_challenges_pkey PRIMARY KEY (id);


--
-- Name: coding_challenges coding_challenges_quest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_challenges
    ADD CONSTRAINT coding_challenges_quest_id_key UNIQUE (quest_id);


--
-- Name: detective_cases detective_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detective_cases
    ADD CONSTRAINT detective_cases_pkey PRIMARY KEY (id);


--
-- Name: detective_cases detective_cases_quest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detective_cases
    ADD CONSTRAINT detective_cases_quest_id_key UNIQUE (quest_id);


--
-- Name: quest_attempts quest_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_attempts
    ADD CONSTRAINT quest_attempts_pkey PRIMARY KEY (id);


--
-- Name: quest_attempts quest_attempts_user_id_quest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_attempts
    ADD CONSTRAINT quest_attempts_user_id_quest_id_key UNIQUE (user_id, quest_id);


--
-- Name: quest_links quest_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_links
    ADD CONSTRAINT quest_links_pkey PRIMARY KEY (id);


--
-- Name: quest_links quest_links_quest_id_from_key_to_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_links
    ADD CONSTRAINT quest_links_quest_id_from_key_to_key_key UNIQUE (quest_id, from_key, to_key);


--
-- Name: quest_tiles quest_tiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_tiles
    ADD CONSTRAINT quest_tiles_pkey PRIMARY KEY (id);


--
-- Name: quest_tiles quest_tiles_quest_id_tile_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_tiles
    ADD CONSTRAINT quest_tiles_quest_id_tile_key_key UNIQUE (quest_id, tile_key);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: quests quests_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_slug_key UNIQUE (slug);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_slug_key UNIQUE (slug);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id, achievement_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user ON public.quest_attempts USING btree (user_id);


--
-- Name: idx_quest_tiles_quest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quest_tiles_quest ON public.quest_tiles USING btree (quest_id, "position");


--
-- Name: idx_quests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quests_status ON public.quests USING btree (status);


--
-- Name: idx_quests_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quests_subject ON public.quests USING btree (subject_id, "position");


--
-- Name: idx_user_achievements_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_user ON public.user_achievements USING btree (user_id);


--
-- Name: idx_users_xp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_xp ON public.users USING btree (xp DESC);


--
-- Name: coding_challenges coding_challenges_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_challenges
    ADD CONSTRAINT coding_challenges_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: detective_cases detective_cases_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detective_cases
    ADD CONSTRAINT detective_cases_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quest_attempts quest_attempts_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_attempts
    ADD CONSTRAINT quest_attempts_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quest_attempts quest_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_attempts
    ADD CONSTRAINT quest_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quest_links quest_links_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_links
    ADD CONSTRAINT quest_links_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quest_tiles quest_tiles_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_tiles
    ADD CONSTRAINT quest_tiles_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: quests quests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quests quests_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict a2hA3GB5g7OdgbVp8IRie3zcAQ2QjwhY5jcUBI9VHhfdTjT8KtagrJoQbxdtwEX

