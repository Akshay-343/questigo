#!/usr/bin/env bash
# Start the Questigo frontend (Vite dev server) at http://localhost:5173
set -e

# Resolve repo root from this script's location so it works from any cwd.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/client"

echo "Starting Questigo frontend (Vite) on http://localhost:5173 ..."
npm run dev
