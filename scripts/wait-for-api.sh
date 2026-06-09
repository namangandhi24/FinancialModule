#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MAX_ATTEMPTS=60

echo "Waiting for API at http://localhost:3001 ..."
for i in $(seq 1 $MAX_ATTEMPTS); do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    echo "API is ready."
    exit 0
  fi
  sleep 1
done

echo "ERROR: API did not start within ${MAX_ATTEMPTS}s."
echo "Check the terminal for errors (Postgres, Redis, or port 3001 in use)."
exit 1
