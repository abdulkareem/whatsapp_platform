# Architecture

## Monorepo
- `apps/backend`: Express API, Prisma, BullMQ worker (Railway).
- `apps/dashboard`: React + Vite admin UI (Cloudflare Pages).
- `packages/shared`: Shared TypeScript types imported by both apps.

## Runtime topology
- Dashboard calls backend API using `VITE_API_BASE_URL`.
- Backend processes API and webhook traffic.
- Worker consumes queued jobs from Redis for broadcast delivery.
- PostgreSQL stores app records, logs, OTPs, and related metadata.

## Deployment model
- Railway service 1: API server (`npm run start -w @whatsapp-platform/backend`).
- Railway service 2: Worker (`npm run worker -w @whatsapp-platform/backend`).
- Cloudflare Pages: Dashboard static bundle from `apps/dashboard/dist`.

## CI/CD
- GitHub Actions validates lint + builds for shared, backend, and dashboard.
- Deployment platforms pull from main branch using their service-specific commands.
