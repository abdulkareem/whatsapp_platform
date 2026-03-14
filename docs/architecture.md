# Architecture Overview

- `backend`: Express API, Prisma, BullMQ worker (Railway).
- `frontend`: React + Vite admin UI.

## Backend flow

1. Webhook/message requests hit Express routes.
2. Business logic services validate and persist with Prisma/PostgreSQL.
3. Async or broadcast jobs are queued in Redis via BullMQ.
4. Worker processes queued jobs and sends WhatsApp API requests.

## Frontend flow

- React frontend calls backend REST endpoints using `VITE_API_BASE_URL`.
- Frontend build output is generated at `frontend/dist`.

## Deployment

- Railway: backend API and worker from `backend` workspace.
- Frontend hosting: static bundle from `frontend/dist`.
