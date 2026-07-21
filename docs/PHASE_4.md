# Phase 4 — Coding Challenge Module

## Goal

Add the platform's core differentiator: an in-browser coding challenge that students must solve to complete a quest. Teachers can attach a coding challenge to any quest. Students see a Monaco editor, write code, run it against test cases, and earn XP only when all tests pass. By the end of this phase, the full student learning loop is complete — browse → read → code → earn XP.

---

## Features

### 1. Database: CodingChallenge Model

```prisma
model CodingChallenge {
  id           String     @id @default(cuid())
  quest        Quest      @relation(fields: [questId], references: [id], onDelete: Cascade)
  questId      String     @unique
  prompt       String
  starterCode  String
  language     Language   @default(JAVASCRIPT)
  testCases    Json
  createdAt    DateTime   @default(now())
}

enum Language {
  JAVASCRIPT
}
```

`testCases` JSON shape (array of test cases):
```json
[
  {
    "id": "tc1",
    "description": "returns sum of two numbers",
    "input": "2, 3",
    "expectedOutput": "5"
  }
]
```

`Quest` gains optional relation:
```prisma
challenge    CodingChallenge?
```

Migration: `prisma migrate dev --name add-coding-challenges`

Seed: attach one `CodingChallenge` to each seeded quest. Use JavaScript challenges (sum, reverse string, find max, FizzBuzz, palindrome check, count vowels).

### 2. Code Execution Engine

`server/src/services/codeRunner.ts`:

Execution strategy for MVP: Node.js `vm` module (sandboxed context, no network or file system access).

```typescript
import vm from 'vm'

export function runCode(code: string, testCases: TestCase[]): TestResult[] {
  return testCases.map(tc => {
    try {
      const context = vm.createContext({})
      vm.runInContext(code, context, { timeout: 3000 })

      const callExpr = `(${tc.input})`
      const fnName = extractFunctionName(code)
      const result = vm.runInContext(`${fnName}${callExpr}`, context, { timeout: 1000 })

      const actual = String(result)
      const expected = String(tc.expectedOutput)
      return { id: tc.id, passed: actual === expected, actual, expected }
    } catch (err) {
      return { id: tc.id, passed: false, actual: String(err), expected: tc.expectedOutput }
    }
  })
}
```

Constraints:
- 3s timeout per execution
- No `require`, no `import`, no `process` — `vm.createContext({})` provides an empty sandbox
- Students write a single function; the runner calls it with the test input and compares string output
- JavaScript only in Phase 4

### 3. Teacher: Attach Coding Challenge to Quest

**New API endpoint:**
- `POST /api/v1/teacher/quests/:questId/challenge` — create challenge (`{ prompt, starterCode, testCases[] }`)
- `GET /api/v1/teacher/quests/:questId/challenge` — get existing challenge
- `PUT /api/v1/teacher/quests/:questId/challenge` — update challenge
- `DELETE /api/v1/teacher/quests/:questId/challenge` — remove challenge (quest reverts to "Mark as Complete" mode)

**Teacher Quest Management screen update:**
- Quest cards gain a "coding challenge" indicator badge if a challenge is attached
- "Add Challenge" / "Edit Challenge" button on each quest card
- Opens a Dialog with three tabs:
  - **Prompt tab:** textarea for the challenge description
  - **Starter Code tab:** code editor (Monaco, read mode for teacher) with the initial code given to students
  - **Test Cases tab:** list of test case rows (description, input, expected output) — "Add Test Case" button appends a new row, trash icon removes

### 4. Student: Coding Challenge Flow

**Quest Detail page update:**

If `quest.challenge` exists:
- "Mark as Complete" button is replaced by "Solve Challenge" button
- Clicking navigates to `/quests/:questId/challenge`

**Coding Challenge Page (`/quests/:questId/challenge`):**

Full-screen two-panel layout:
- **Left panel (40%):** challenge prompt, test cases listed (description only — not the input/expected values), hints section (static for now)
- **Right panel (60%):** Monaco editor + controls

**Monaco Editor setup:**
- `@monaco-editor/react` package
- Language: JavaScript
- Theme: custom dark theme matching the platform
- Pre-populated with `quest.challenge.starterCode`
- Font: JetBrains Mono (monospace)
- Basic options: `minimap: false`, `fontSize: 14`, `lineNumbers: on`

**Controls bar (below editor):**
- Language selector (JavaScript only, disabled — for future phases)
- "Reset Code" button: restores `starterCode` with a confirm dialog
- "Run Tests" primary button

**"Run Tests" flow:**
1. Button click → `POST /api/v1/student/challenges/:challengeId/run` with `{ code: string }`
2. Button shows loading spinner while waiting
3. Response: `{ results: TestResult[], allPassed: boolean, message?: string }`
4. Test results panel slides up from the bottom of the right panel:
   - Each test case row: pass (green check) or fail (red X) + label from `description`
   - On fail: shows the actual output vs expected output
5. If `allPassed: true`:
   - "Run Tests" button is replaced by "Submit & Earn XP" button
   - Test results panel shows a green success banner

**"Submit & Earn XP" flow:**
1. `POST /api/v1/student/quests/:questId/complete` (same endpoint as Phase 3)
2. Backend re-runs the code server-side to confirm results before awarding XP (prevents spoofing)
3. Response: `{ xpEarned, newXp, newLevel, leveledUp }`
4. XP gain animation + optional level-up overlay (same as Phase 3)
5. Redirect to `/quests/:questId` (quest detail) which now shows "Completed" status

### 5. Student API: Code Execution Endpoint

**`POST /api/v1/student/challenges/:challengeId/run`**
- Requires `STUDENT` JWT
- Body: `{ code: string }`
- Validates: code must be a non-empty string, max 10,000 characters
- Calls `codeRunner.runCode(code, challenge.testCases)`
- Returns: `{ data: { results, allPassed } }`
- Does NOT award XP or update attempts — this is a dry run

**`POST /api/v1/student/quests/:questId/complete`** (updated from Phase 3)
- Now checks if the quest has a `CodingChallenge`
- If yes: requires `{ code: string }` in the body, re-runs code server-side to verify `allPassed: true` before completing
- If no: proceeds as before (direct completion)
- Returns consistent `{ xpEarned, newXp, newLevel, leveledUp }` shape in both cases

### 6. Error Handling for Code Execution

Runtime errors (syntax errors, ReferenceError, timeout):
- Caught in `codeRunner.runCode`, returned as a failed test case with the error message as `actual`
- Frontend shows a red error banner above the test results: "Your code threw an error: [message]"

Timeout (>3s):
- `vm.runInContext` with `{ timeout: 3000 }` throws a `Script execution timed out` error
- Returned as failed test with message "Execution timed out (3s limit)"

Malicious patterns (not a security concern for MVP — just defensive):
- `vm.createContext({})` provides an empty sandbox — `require`, `process`, `fetch` are simply undefined

### 7. Teacher Dashboard: Content Completeness Indicator

Teacher quest cards now show:
- "No Challenge" badge (amber) if no coding challenge is attached
- "Challenge Ready" badge (green) if a challenge with at least one test case is attached

This gives teachers visibility into which quests are fully configured.

---

## Deliverables

- `CodingChallenge` model migrated with `testCases` JSON field
- `Language` enum (JAVASCRIPT)
- Seed: 6 JavaScript coding challenges attached to seeded quests
- `codeRunner.ts` using Node.js `vm` module
- Teacher API endpoints for challenge CRUD
- Teacher quest management UI updated with "Add/Edit Challenge" dialog (3-tab form)
- Student challenge page (`/quests/:questId/challenge`) with Monaco editor
- "Run Tests" flow with test result panel
- "Submit & Earn XP" flow with server-side re-verification
- Quest detail page updated to show "Solve Challenge" vs "Mark as Complete" based on challenge presence
- Code execution error handling (runtime errors, timeouts)

---

## Out of Scope

- Languages other than JavaScript
- Real sandboxed code execution (Judge0, Docker)
- Hints system beyond static placeholder text
- Code saving/autosave between sessions
- Collaborative or multiplayer challenges
- AI-generated test cases
- Achievements (counter still shows 0)
- Leaderboard (still placeholder)

---

## Acceptance Criteria

- [ ] Teacher can attach a coding challenge to a quest via the 3-tab dialog
- [ ] Teacher can add, edit, and remove test cases from the challenge
- [ ] Quest cards in teacher dashboard show "Challenge Ready" or "No Challenge" badges
- [ ] Student sees a "Solve Challenge" button on quests that have a coding challenge
- [ ] Coding challenge page renders Monaco editor pre-populated with starter code
- [ ] "Reset Code" restores the starter code after confirmation
- [ ] "Run Tests" sends the code to the server and displays per-test pass/fail results
- [ ] Syntax errors and runtime errors in student code are shown as failed tests with the error message
- [ ] Code that times out (>3s) shows a timeout error message
- [ ] "Submit & Earn XP" is only available when all tests pass
- [ ] Submitting re-verifies code on the server; XP is awarded only if server-side verification passes
- [ ] XP and level are updated in the database after successful submission
- [ ] Quest detail page shows "Completed" status after a successful submission
- [ ] A student cannot earn XP for the same quest twice
- [ ] All Phase 0, 1, 2, and 3 functionality remains working
