#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"
MAX_ATTEMPTS=30

echo "Waiting for Docker services to be healthy..."

for i in $(seq 1 $MAX_ATTEMPTS); do
  STATUS=$(docker compose -f "$COMPOSE_FILE" ps postgres redis 2>/dev/null || true)

  if echo "$STATUS" | grep -q "postgres" && echo "$STATUS" | grep -q "healthy" && \
     echo "$STATUS" | grep -q "redis" && echo "$STATUS" | grep -q "healthy"; then
    echo "Postgres and Redis are healthy."
    exit 0
  fi

  # Fallback: direct TCP checks once containers are up
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U finpilot -d finpilot >/dev/null 2>&1 && \
     docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "Postgres and Redis are ready."
    exit 0
  fi

  echo "  attempt $i/$MAX_ATTEMPTS — not ready yet..."
  sleep 2
done

echo "Timed out waiting for Docker services. Run: pnpm docker:logs"
exit 1
