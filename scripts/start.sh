#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> FinPilot start"

chmod +x scripts/docker-check.sh scripts/wait-for-docker.sh scripts/free-ports.sh
./scripts/docker-check.sh

echo "==> Ensuring environment files"
if [ ! -f .env ]; then cp .env.example .env; fi
if [ ! -f apps/api/.env ]; then cp .env.example apps/api/.env; fi
if [ ! -f apps/web/.env.local ]; then cp apps/web/.env.local.example apps/web/.env.local; fi

echo "==> Starting Docker (Postgres + Redis)"
docker compose -f docker/docker-compose.yml up -d postgres redis

echo "==> Waiting for Postgres and Redis"
./scripts/wait-for-docker.sh

echo "==> Applying database migrations"
pnpm db:generate
pnpm db:migrate

echo "==> Freeing dev ports 3000 and 3001"
./scripts/free-ports.sh

echo "==> Building shared package (required by API)"
pnpm --filter @finpilot/shared build

echo ""
echo "==> Starting web + API (Ctrl+C to stop)"
echo "    Wait until you see: FinPilot API running on http://localhost:3001"
echo "    Web:  http://localhost:3000  (use localhost, not 127.0.0.1)"
echo "    Demo: demo@finpilot.ai / Demo1234"
echo ""

pnpm dev
