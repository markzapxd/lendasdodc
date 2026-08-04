# Deployment Guide

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

The server validates all required variables at startup. Keep values in the deployment provider's secret store, not in source control.

### Required variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_URL` | Supabase project URL (server-side) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `QSTASH_TOKEN` | QStash API token |
| `QSTASH_CURRENT_SIGNING_KEY` | Current QStash signing key |
| `QSTASH_NEXT_SIGNING_KEY` | Next QStash signing key |
| `ADMIN_SESSION_SECRET` | Secret of at least 32 characters for admin sessions |
| `TURNSTILE_SECRET_KEY` | Turnstile server secret |
| `CRON_SECRET` | Bearer token accepted by cron `POST` routes |
| `CONTENT_HMAC_SECRET` | Content HMAC secret |
| `SESSION_HMAC_SECRET` | Session HMAC secret |
| `RECEIPT_HMAC_SECRET` | Receipt HMAC secret |

`ALERT_WEBHOOK_URL` is optional and must be a URL when set.

## Deployment Options

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Configure every required variable from `.env.example` in the project settings.
4. Deploy

`vercel.json` schedules `POST /api/cron/publish` every minute and `POST /api/cron/worker` every five minutes. Set `CRON_SECRET` so the scheduled requests pass bearer authentication.

### Docker

```bash
# Build image. Public Supabase values are build arguments because Next.js bundles them for the browser.
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t lendas-do-dc .

# Run container
docker run -p 3000:3000 --env-file .env.local lendas-do-dc
```

### Docker Compose

```bash
# Build and start the application
docker compose up --build -d

# View logs
docker compose logs -f app
```

## Cron Jobs

The application exposes two cron `POST` routes:

1. `/api/cron/publish`, which runs the publication scheduler.
2. `/api/cron/worker`, which processes queues and up to 10 dead-letter entries.

Both require `Authorization: Bearer <CRON_SECRET>`. Vercel applies the schedules in `vercel.json`; Docker deployments need an external scheduler that sends this header. The unauthenticated `GET` routes provide basic cron health and worker metrics.

## Available commands

Use the scripts defined in `package.json`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm typecheck
pnpm test:unit
```
