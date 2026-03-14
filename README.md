# WhatsApp Platform Monorepo

Clean monorepo structure for:
- **Cloudflare Pages** frontend deployment
- **Railway** backend + worker deployment
- **Shared TypeScript contracts**
- **Single CI pipeline** across the whole stack

## Repository layout

```text
.
├── apps/
│   ├── backend/        # Railway API + worker
│   └── dashboard/      # Cloudflare Pages React app
├── packages/
│   └── shared/         # Shared TS types/contracts
├── .github/workflows/  # CI checks
├── docker/             # Local/dev container builds
└── docker-compose.yml
```

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run build -w @whatsapp-platform/backend
npm run build -w @whatsapp-platform/dashboard
docker compose up --build
```

## Workspace commands

```bash
# backend
npm run dev:backend

# dashboard
npm run dev:dashboard

# all lint/type checks
npm run lint
```

## Shared types

Shared contracts are in `packages/shared/src/index.ts` and imported as:

```ts
import type { AppRecord, MessageLog, WhatsAppInboundPayload } from '@whatsapp-platform/shared';
```

## Deployment

### Railway (backend + worker)
Use `apps/backend/railway.json` or equivalent Railway service commands:
- Build: `npm ci && npm run build -w @whatsapp-platform/backend`
- Start API: `npm run start -w @whatsapp-platform/backend`
- Start worker: `npm run worker -w @whatsapp-platform/backend`

### Cloudflare Pages (dashboard)
Use `apps/dashboard/wrangler.toml` settings:
- Build command: `npm ci && npm run build -w @whatsapp-platform/dashboard`
- Build output directory: `apps/dashboard/dist`
- Env var: `VITE_API_BASE_URL=https://<your-railway-backend>`

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs install + lint + builds for:
- shared package
- backend
- dashboard
