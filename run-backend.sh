#!/usr/bin/env bash
# Start the Questigo backend (FastAPI via uvicorn) at http://localhost:8000
# Activates the server's virtualenv, then runs uvicorn with auto-reload.
set -e

# Resolve repo root from this script's location so it works from any cwd.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/server"

# Activate the venv. On Windows the venv lives in .venv/Scripts; on Unix it's .venv/bin.
if [ -f ".venv/Scripts/activate" ]; then
  source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
else
  echo "Error: virtualenv not found at server/.venv — create it with: python -m venv .venv && pip install -r requirements.txt" >&2
  exit 1
fi

echo "Starting Questigo backend (FastAPI) on http://localhost:8000 ..."
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
