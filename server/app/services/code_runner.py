"""Runs student-submitted code against stored test cases.

MVP, not a hardened sandbox (see docs/PHASE_4.md "Out of Scope"). Student code runs
in a short-lived, isolated (`-I`) Python subprocess with a wall-clock timeout. The
student defines `solution(...)`; each test calls `solution(<input>)` and compares
`str(result)` to the expected string.
"""
import json
import subprocess
import sys

from app.schemas.coding import TestResult

TIMEOUT_SECONDS = 5
SUPPORTED_LANGUAGES = {"python"}

# Reads {"code", "tests"} from stdin, runs each test, writes {"results", "error"} to stdout.
_HARNESS = r"""
import sys, json
data = json.loads(sys.stdin.read())
code, tests = data["code"], data["tests"]
ns = {}
try:
    exec(code, ns)
except Exception as e:
    print(json.dumps({"results": [], "error": "%s: %s" % (type(e).__name__, e)}))
    sys.exit(0)
fn = ns.get("solution")
if not callable(fn):
    print(json.dumps({"results": [], "error": "Define a function named solution(...)."}))
    sys.exit(0)
results = []
for t in tests:
    try:
        value = eval("solution(%s)" % t["input"], ns)
        actual = str(value)
        results.append({"id": t["id"], "actual": actual, "error": None})
    except Exception as e:
        results.append({"id": t["id"], "actual": "%s: %s" % (type(e).__name__, e), "error": True})
print(json.dumps({"results": results, "error": None}))
"""


def run_tests(language: str, code: str, test_cases: list[dict]) -> tuple[list[TestResult], bool, str | None]:
    """Execute `code` against `test_cases`. Returns (results, all_passed, setup_error)."""
    if language not in SUPPORTED_LANGUAGES:
        return [], False, f"Unsupported language: {language}."

    payload = json.dumps({
        "code": code,
        "tests": [{"id": tc["id"], "input": tc["input"]} for tc in test_cases],
    })

    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-c", _HARNESS],
            input=payload,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        results = [
            TestResult(id=tc["id"], description=tc.get("description", ""), passed=False,
                       actual=f"Execution timed out ({TIMEOUT_SECONDS}s limit)",
                       expected=str(tc.get("expectedOutput", "")))
            for tc in test_cases
        ]
        return results, False, f"Execution timed out ({TIMEOUT_SECONDS}s limit)."

    try:
        out = json.loads(proc.stdout)
    except (json.JSONDecodeError, ValueError):
        err = (proc.stderr or "Code execution failed.").strip().splitlines()[-1]
        return [], False, err

    if out.get("error"):
        return [], False, out["error"]

    actual_by_id = {r["id"]: r for r in out["results"]}
    results: list[TestResult] = []
    for tc in test_cases:
        expected = str(tc.get("expectedOutput", ""))
        run = actual_by_id.get(tc["id"])
        actual = run["actual"] if run else "(no result)"
        passed = bool(run) and not run["error"] and actual == expected
        results.append(TestResult(
            id=tc["id"], description=tc.get("description", ""),
            passed=passed, actual=actual, expected=expected,
        ))

    all_passed = bool(results) and all(r.passed for r in results)
    return results, all_passed, None
