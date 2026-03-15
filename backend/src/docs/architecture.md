# Production Multi-Tenant WhatsApp Automation SaaS Architecture

## 1) Platform topology
- **Backend API (Express + TypeScript)** on Railway.
- **Worker runtime (BullMQ + Redis)** on Railway worker service.
- **PostgreSQL + Prisma** for tenant-isolated state.
- **Frontend (React + Tailwind)** on Cloudflare Pages.
- **Prometheus-compatible metrics** at `GET /api/analytics/metrics`.

## 2) Tenant model
- `Tenant` is the root boundary for business data.
- Tenant has many `App` definitions (multiple WhatsApp use-cases per business).
- Tenant data entities: `Contact`, `Conversation`, `MessageLog`, `Campaign`, `Workflow`, `Subscription`, `ApiKey`, `User`.

## 3) WhatsApp Cloud API integration
- Webhook verification: `GET /webhook`.
- Signed webhook ingestion: `POST /webhook` with optional `x-hub-signature-256` validation.
- Message parser supports text + captions for image/document/video and interactive payloads.
- Delivery status and message IDs are preserved in `MessageLog.providerMessageId` and metadata.

## 4) Routing engine
Routing order:
1. **Session routing** (`Conversation.sessionExpiresAt`).
2. **Keyword routing** (first token, uppercased/sanitized).
3. **Default app routing** (`App.defaultApp=true` and `keywordRequired=false`).
4. **Fallback response** (`App.fallbackMessage` or platform default).

Each app gets a generated endpoint path in the form:
- `/app/{slug}`

## 5) Queueing model
Queues/jobs:
- `incoming.route`
- `outgoing.send`
- `campaign.process`
- `retry.failed`

Primary runtime uses BullMQ + Redis; if Redis is unavailable at runtime, queue producers can fallback to in-memory buffering for graceful degradation.

## 6) Workflow automation
- Stored as JSON graph in `Workflow.definition`.
- `triggerType` supports inbound message and scheduled triggers.
- Nodes support conditions (keyword, contains, time) and actions (send message, call API, tag contact, create lead).

## 7) AI chatbot runtime
- OpenAI-compatible chat completion in `aiChatService`.
- Per-conversation context memory persisted in `Conversation.contextMemory`.
- Supports KB + document-answering extensions by enriching system/context messages.

## 8) Campaign engine
- CSV contact import metadata in `Campaign.csvUrl` and `Campaign.metadata`.
- Scheduled dispatch via queue workers.
- Delivery/read counters: `deliveredCount`, `readCount`, `failedCount`.

## 9) Billing and plans
Stripe-backed subscriptions with `Subscription.plan`:
- FREE
- STARTER
- BUSINESS
- ENTERPRISE

Enforced quotas:
- contacts
- campaigns
- AI tokens
- API calls

## 10) Security controls
- JWT auth (`/api/auth/login` token issuer).
- API-key auth for app endpoints (`X-APP-KEY`, `APP_API_KEY`, etc.).
- Tenant isolation at query layer with `tenantId`.
- Request validation via existing zod validators + controller guards.
- Webhook signature verification middleware.

## 11) Admin panel responsibilities
Admin endpoints support:
- tenant visibility
- queue/job health monitoring
- failed job inspection
- billing plan updates
- app suspension (`isActive=false`)

## 12) Deployment
### Railway backend
1. Provision PostgreSQL + Redis plugins/services.
2. Set backend service vars from `.env` section below.
3. Start API: `npm run start -w @whatsapp-platform/backend`.
4. Start worker: `npm run worker -w @whatsapp-platform/backend`.

### Cloudflare Pages frontend
1. Build command: `npm ci && npm run build -w @whatsapp-platform/frontend`.
2. Output directory: `frontend/dist`.
3. Set `VITE_API_BASE_URL` to Railway API URL.

### Required environment variables
- `WHATSAPP_TOKEN`
- `PHONE_NUMBER_ID` (or `WHATSAPP_PHONE_ID`)
- `VERIFY_TOKEN`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `PLATFORM_BASE_URL`
