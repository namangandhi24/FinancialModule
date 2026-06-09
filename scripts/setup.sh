#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> FinPilot setup"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed."
  echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running. Open Docker Desktop first."
  exit 1
fi

echo "==> Installing dependencies"
pnpm install

echo "==> Syncing environment files"
if [ ! -f .env ]; then cp .env.example .env; fi
if [ ! -f apps/api/.env ]; then cp .env.example apps/api/.env; fi
if [ ! -f apps/web/.env.local ]; then cp apps/web/.env.local.example apps/web/.env.local; fi

echo "==> Starting Docker (Postgres + Redis)"
chmod +x scripts/docker-check.sh
./scripts/docker-check.sh
docker compose -f docker/docker-compose.yml up -d postgres redis

echo "==> Waiting for services"
chmod +x scripts/wait-for-docker.sh
./scripts/wait-for-docker.sh

echo "==> Building shared package"
pnpm --filter @finpilot/shared build

echo "==> Generating Prisma client"
pnpm db:generate

echo "==> Running migrations"
cd apps/api && npx prisma migrate deploy && cd "$ROOT"

echo "==> Seeding demo data"
pnpm db:seed

echo ""
echo "Setup complete! Run: pnpm dev"
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:3001"
echo "  Demo: demo@finpilot.ai / Demo1234"
