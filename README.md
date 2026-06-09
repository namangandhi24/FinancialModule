# FinPilot AI

AI-powered Personal CFO platform.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, Zustand
- **Backend:** NestJS, PostgreSQL, Prisma, Redis, BullMQ
- **AI:** Ollama (dev), OpenAI (production)

## Prerequisites

- Node.js 20+
- pnpm 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + Redis)

## Docker Setup (macOS)

Docker is **not bundled** with the project — you install it once on your machine, then FinPilot uses it to run PostgreSQL and Redis locally.

### 1. Install Docker Desktop

1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Install and open **Docker Desktop**
3. Wait until the whale icon in the menu bar shows **Docker Desktop is running**

Verify in terminal:

```bash
docker --version
docker compose version
```

### 2. Start infrastructure

From the project root:

```bash
pnpm docker:up
```

This starts:
| Service    | Port  | Purpose              |
|------------|-------|----------------------|
| PostgreSQL | 5432  | Main database        |
| Redis      | 6379  | BullMQ job queues    |

Check containers are healthy:

```bash
docker compose -f docker/docker-compose.yml ps
```

Both `finpilot-postgres` and `finpilot-redis` should show `healthy`.

### 3. First-time setup (one command)

```bash
pnpm setup
```

Or step by step:

```bash
pnpm install
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### 4. Useful Docker commands

```bash
pnpm docker:up      # Start postgres + redis
pnpm docker:down    # Stop containers (data persists in volumes)
pnpm docker:logs    # Tail container logs
```

To **reset the database** completely:

```bash
pnpm docker:down
docker volume rm finpilot_postgres_data finpilot_redis_data 2>/dev/null || true
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

### 5. Optional: Ollama (Phase 4 AI)

```bash
docker compose -f docker/docker-compose.yml --profile ai up -d
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: command not found` | Install Docker Desktop and ensure it is running |
| Port 5432 already in use | Stop local Postgres or change port in `docker/docker-compose.yml` |
| `Can't reach database` | Run `pnpm docker:up` and wait ~10s for health checks |
| Redis connection refused | Same — ensure `finpilot-redis` is running |

## Getting Started

**Recommended — one command (Docker + migrate + dev):**

```bash
pnpm start
```

**First-time full setup** (install deps + seed demo data):

```bash
pnpm setup
pnpm start
```

**Manual steps** if you prefer:

```bash
# Install dependencies
pnpm install

# Start infrastructure (requires Docker Desktop running)
pnpm docker:up

# Copy environment variables
cp .env.example .env
cp .env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Demo Credentials

- Email: `demo@finpilot.ai`
- Password: `Demo1234`

## Project Structure

```
apps/web          Next.js frontend
apps/api          NestJS backend
packages/shared   Shared Zod schemas and enums
docker/           Docker Compose and Dockerfile
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Docker, migrate, free ports, run dev |
| `pnpm setup` | First-time install + Docker + migrate + seed |
| `pnpm dev` | Start web + API only (Docker must already be running) |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |

## Phase 2 Features

- **Statement import** — Upload CSV, Excel, or PDF at `/imports`
- **Smart categorization V1** — Rule engine matches merchants (SWIGGY → Food, UBER → Transport, etc.)
- **BullMQ pipeline** — Background processing via Redis queues
- **Net worth snapshots** — Materialized daily history in `net_worth_snapshots`

After starting the app, try importing `docker/sample-statement.csv` against a demo account.

## Phase 3 Features

- **Budgets** — Monthly category limits with budget vs actual charts at `/budgets`
- **Goals** — Progress tracking, required monthly savings, achievement probability at `/goals`
- **Investments** — Holdings, gain/loss, asset allocation by type at `/investments`
- **Dashboard widgets** — Live budget status, goal progress, and investment allocation cards

## Phase 4 Features

- **AI Copilot** — Chat with your personal CFO at `/copilot` (Ollama local or OpenAI)
- **Tool calling** — AI reads accounts, transactions, net worth, budgets, goals, and investments
- **Financial forecasts** — 1/5/10/20 year net worth projections at `/forecasts`
- **Retirement planner** — Monte Carlo simulation and safe withdrawal analysis at `/retirement`
- **AI insights widget** — Dashboard card with budget warnings, spending anomalies, and savings tips
- **Command palette** — Press `Cmd+K` / `Ctrl+K` to jump to any page

### AI Setup

**Local (Ollama):**
```bash
docker compose -f docker/docker-compose.yml --profile ai up -d
```

**Production (OpenAI):** Set `OPENAI_API_KEY` in `apps/api/.env`

## Phase 5 Features

- **Insights engine** — Auto-generated budget warnings, spending spikes, and cash flow alerts
- **Notifications** — In-app notifications at `/notifications` with unread badges
- **Email notifications** — Configure SMTP in `.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)
- **Admin dashboard** — User list, queue monitoring, audit logs at `/admin` (admin role only)
- **2FA (TOTP)** — Enable in Settings with any authenticator app
- **Session management** — View and revoke active sessions in Settings
- **Categorization rules API** — `GET/POST /categorization/rules`

### Admin Credentials

- Email: `admin@finpilot.ai`
- Password: `Demo1234`
