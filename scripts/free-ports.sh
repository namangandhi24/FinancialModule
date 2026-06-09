#!/usr/bin/env bash
# Stop stale Node dev servers on FinPilot ports (safe: only kills node on 3000/3001).
set -euo pipefail

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -z "$pids" ]; then
    return 0
  fi

  for pid in $pids; do
    local cmd
    cmd=$(ps -p "$pid" -o comm= 2>/dev/null || true)
    if [[ "$cmd" == *node* ]] || [[ "$cmd" == *next* ]]; then
      echo "Stopping stale process on port $port (pid $pid)"
      kill -9 "$pid" 2>/dev/null || true
    else
      echo "WARNING: Port $port is in use by '$cmd' (pid $pid), not a Node dev server."
      echo "         Stop it manually or change API_PORT / Next.js port."
    fi
  done
}

free_port 3000
free_port 3001
