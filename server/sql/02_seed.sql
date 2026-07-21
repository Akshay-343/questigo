-- Questigo — Phase 1 seed data (PostgreSQL)
-- Run after the schema:  psql -d questigo -f sql/02_seed.sql
--
-- Passwords are bcrypt-hashed in-database via pgcrypto's crypt()/gen_salt('bf').
-- These are standard bcrypt hashes and verify against the backend's
-- bcrypt.checkpw(), so logging in through the API works out of the box.
--
-- Demo accounts (these match the frontend's existing mock credentials, so the
-- current client login screen will work unchanged once wired to the API):
--   Teacher : teacher@questigo.dev  / demo1234
--   Student : alice@student.dev     / student123   (Alice Chen, level 6)
--   Student : bob@student.dev       / student123   (Bob Kumar,  level 4)

INSERT INTO users (name, email, password_hash, role, xp, level) VALUES
    ('Dr. V. Sukanya', 'teacher@questigo.dev', crypt('demo1234',   gen_salt('bf')), 'TEACHER',    0, 1),
    ('Alice Chen',     'alice@student.dev',    crypt('student123', gen_salt('bf')), 'STUDENT', 2300, 6),
    ('Bob Kumar',      'bob@student.dev',      crypt('student123', gen_salt('bf')), 'STUDENT',  850, 4)
ON CONFLICT (email) DO NOTHING;
