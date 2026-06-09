# Deployment Guide

FinPilot is a monorepo: **Next.js web** (Vercel) + **NestJS API** (Railway/Render/Fly) + **Postgres + Redis**.

## 1. Web — Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set **Root Directory** to `apps/web`.
4. Vercel reads `apps/web/vercel.json` for install/build commands.
5. Add environment variable:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app` |

6. Deploy. Your site will be at `https://your-project.vercel.app`.

## 2. API — Railway (recommended)

NestJS needs a long-running Node server (not Vercel serverless).

1. Create a [Railway](https://railway.app) project from the same GitHub repo.
2. Add **PostgreSQL** and **Redis** plugins.
3. Create a service with:
   - **Root directory:** `/` (repo root)
   - **Build:** `pnpm install && pnpm --filter @finpilot/shared build && pnpm --filter @finpilot/api build`
   - **Start:** `node apps/api/dist/main.js`
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | From Railway Postgres |
| `REDIS_URL` | From Railway Redis |
| `JWT_SECRET` | Long random string |
| `WEB_URL` | Your Vercel URL (e.g. `https://finpilot.vercel.app`) |
| `API_URL` | Your Railway API URL |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | Optional — enables AI copilot in production |

5. Run migrations once:

```bash
railway run pnpm db:migrate
railway run pnpm db:seed
```

6. Copy the public API URL into Vercel as `NEXT_PUBLIC_API_URL`.

## 3. AI in production

| Provider | Setup |
|----------|--------|
| **OpenAI** | Set `OPENAI_API_KEY` on the API host. Copilot, insights, and forecasts use GPT. |
| **Ollama** | Local/dev only (`docker compose --profile ai up`). Not available on Vercel/Railway by default. |

Without `OPENAI_API_KEY`, the copilot returns helpful fallback text using your real account data but no LLM reasoning.

## 4. Still pending (not in this release)

- OAuth social login (`POST /auth/oauth/:provider` returns 501)
- Azure Blob storage for imports (uses local disk in dev)
- Email notifications require SMTP env vars on the API host

## 5. Local vs production checklist

- [ ] `WEB_URL` on API matches Vercel domain (CORS)
- [ ] `NEXT_PUBLIC_API_URL` on Vercel matches Railway API URL
- [ ] Postgres migrated and seeded
- [ ] Redis running (required for insights/notifications queues)
- [ ] `OPENAI_API_KEY` set if you want live AI
