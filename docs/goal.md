# Questigo

> **Status (2026-07-21): MVP delivered; development locked.** Every objective below is
> implemented and verified. This document states the project's goals and vision; for what
> was built, in what order, and what was deliberately cut, see `PROGRESS_LOG.md`.
> The remaining timeline is documentation, report finalisation, and binding.

## Project Overview

Questigo is a game-based interactive learning platform designed to help students learn programming concepts through engaging RPG-inspired gameplay.

Traditional learning platforms rely heavily on passive content consumption and multiple-choice quizzes. Questigo transforms learning into an interactive experience where students progress through quests, solve coding challenges, earn rewards, and improve their programming skills through practice.

The platform combines educational content, gamification, coding exercises, progression systems, and AI-assisted content generation into a unified learning environment.

This project is being developed as an MCA Major Project.

---

# Problem Statement

Many students struggle to learn programming because:

* Learning is often passive and theory-focused.
* Traditional MCQ-based systems do not develop logical thinking.
* Programming concepts are difficult to visualize.
* Existing platforms provide limited engagement.
* Teachers spend significant time creating exercises manually.

Students require a more interactive and motivating environment that encourages practical problem solving rather than simple memorization.

---

# Vision

To create a learning platform where programming concepts are taught through game mechanics instead of traditional quizzes.

Students should feel like they are progressing through an adventure rather than completing academic exercises.

The platform should encourage:

* Consistent learning
* Practical coding skills
* Problem-solving ability
* Competitive motivation
* Long-term engagement

---

# Primary Objective

Develop a gamified learning platform that enables students to learn programming concepts through interactive coding challenges and structured progression systems.

---

# Learning Mechanics (as delivered)

The platform's central claim is that concepts are taught through **game mechanics rather than
quizzes**. Three distinct node types ship, each exercising a different kind of thinking, and all
three share one progression engine (XP, levels, achievements, leaderboard):

| Node type | What the student does | What it tests |
|---|---|---|
| **Sequence Builder** | Arranges shuffled process steps into the correct order, with per-link validation explaining *why* each step precedes the next. | Procedural understanding — order and causality. |
| **Code Forge** | Writes a real Python `solution(...)` in an embedded editor, graded against stored test cases. | Practical coding ability. |
| **Rapid Arena** | Answers timed multiple-choice questions under a countdown, with three hearts and a streak multiplier. | Recall speed and confidence under pressure. |

A fourth mechanic, **Data Detective** (a SQL-sandbox investigation), was built and then
**deliberately retired**: authoring a single case required a teacher to hand-write a database
schema, seed data, and expected queries — a far heavier burden than any other authoring path,
which conflicted with the objective of reducing teacher effort. Rapid Arena replaced it because
multiple choice is the format teachers already author fluently. This trade-off is documented as
a design decision rather than a dropped feature.

**Architectural note:** adding a node type requires a quest kind, one database table, one React
component, and one server-side validator — the progression engine is generic. This extensibility
is the platform's main structural claim.

---

# Key Features

## Student Features

* User Registration
* User Login
* Personalized Dashboard
* Subject Exploration
* Topic-Based Learning Paths
* Quest Selection
* Coding Challenges
* XP System
* Level Progression
* Achievements
* Badges
* Leaderboards
* Progress Tracking

## Teacher Features

* Teacher Authentication
* Subject Management
* Topic Management
* Quest Management
* Student Progress Monitoring
* Content Creation Tools

## Platform Features

* Secure Authentication
* Gamification Engine
* Coding Evaluation System
* Progress Analytics
* AI-Assisted Content Generation
* Scalable Architecture

---

# Core User Journey

## Student Flow

1. Register or Login
2. Enter Dashboard
3. Select Subject
4. Select Topic
5. Start Quest
6. Complete Learning Activity
7. Solve Coding Challenge
8. Receive XP Rewards
9. Level Up
10. Unlock Achievements
11. Improve Leaderboard Ranking

## Teacher Flow

1. Login
2. Create Subject
3. Create Topics
4. Create Quests
5. Monitor Student Progress
6. Analyze Learning Outcomes

---

# MVP Scope — ✅ delivered

The first implementation focused on demonstrating the complete platform architecture.

| MVP requirement | Status |
|---|---|
| Authentication System | ✅ JWT + bcrypt, role-gated student/teacher routes |
| Student Dashboard | ✅ XP bar, level, progress stats |
| Teacher Dashboard | ✅ backend-driven subject/quest/student counts |
| Subject Management | ✅ |
| Quest Management | ✅ hand-authoring **and** AI generation, with an approval gate |
| Progress Tracking | ✅ attempts persisted server-side |
| Leaderboard | ✅ |
| Basic Coding Challenge Module | ✅ Monaco editor + Python test runner, server-verified |
| XP and Leveling System | ✅ threshold-based levels + achievements |

**Delivered beyond the original MVP:** AI-assisted content generation from PDF or pasted text
(originally listed under Future Scope), a teacher review/approval workflow, two additional game
mechanics beyond the coding module, and a containerised three-service deployment.

---

# Future Scope

Explicitly *not* attempted, and stated as future work:

* **Hardened code execution sandbox** — the current runner is an isolated subprocess with a
  wall-clock timeout: adequate for a supervised local demo, deliberately not production-safe.
  A container- or Judge0-based judge is the correct production answer.
* Adaptive difficulty adjustment
* Multiplayer / real-time competitive arena
* Personalized learning paths
* Additional programming languages (the runner is Python-only)
* LMS integrations
* Advanced analytics
* Mobile application support

*(AI-generated quests moved out of Future Scope — implemented and live.)*

---

# Success Criteria — ✅ met

Verified end-to-end in a browser (2026-07-04, re-verified 2026-07-21 after the final feature
session), against both a local install and the Docker stack.

Students can:

* Register and use the platform ✅
* Complete quests across all three mechanics ✅
* Solve coding challenges ✅
* Earn rewards — XP, levels, achievements ✅
* Track progress ✅

Teachers can:

* Manage learning content — author by hand or generate with AI ✅
* Monitor student performance ✅
* Create and organize learning paths ✅

The platform demonstrates a modern, scalable, and maintainable architecture: a typed React
frontend, a layered FastAPI backend (routes → services → CRUD), PostgreSQL persistence, and a
generic progression engine that new game mechanics plug into without modification.

**Integrity note:** all grading is server-side. Coding submissions are re-executed and arena runs
re-graded on completion, and reward-affecting flags (such as the flawless-run bonus) are
recomputed by the server rather than trusted from the client.
