# WhatsApp Platform Monorepo

Clean monorepo structure for:
- **Frontend** deployment
- **Railway** backend + worker deployment
- **Single CI pipeline** across the whole stack

## Repository layout

```text
.
├── backend/            # Railway API + worker
├── frontend/           # React app
├── .github/workflows/  # CI checks
├── docker/             # Local/dev container builds
└── docker-compose.yml
```

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run build -w @whatsapp-platform/backend
npm run build -w @whatsapp-platform/frontend
docker compose up --build
```

## Workspace commands

```bash
# backend
npm run dev:backend

# frontend
npm run dev:frontend

# all lint/type checks
npm run lint
```

## Deployment

### Railway (backend + worker)
Use `backend/railway.json` or equivalent Railway service commands:
- Build: `npm run build -w @whatsapp-platform/backend`
- Start API: `npm run start -w @whatsapp-platform/backend`
- Start worker: `npm run worker -w @whatsapp-platform/backend`

### Frontend hosting
- Build command: `npm ci && npm run build -w @whatsapp-platform/frontend`
- Build output directory: `frontend/dist`
- Env var: `VITE_API_BASE_URL=https://<your-railway-backend>`

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs install + lint + builds for:
- backend
- frontend



## Database notes (Prisma + Railway)

- `postgres.railway.internal` works only from services running inside Railway private networking.
- If you run the backend locally, use a public DB URL (`DATABASE_PUBLIC_URL` / `POSTGRES_PUBLIC_URL`) or `PG*` variables so the backend can build a reachable `DATABASE_URL`.
- If no public DB variable is provided, backend falls back to `postgresql://postgres:***@tramway.proxy.rlwy.net:58990/railway`.
- Backend startup now runs Prisma DB initialization automatically:
  - `prisma migrate deploy` when migrations exist
  - `prisma db push` when no migrations exist

## Admin login

- Admin email login is restricted to `ADMIN_EMAIL` on the backend and `VITE_ADMIN_EMAIL` on the frontend (defaults to `abdulkareem.t@gmail.com` if omitted).
- Click **Verify** on the login page to send a 6-digit OTP to that email.
- Configure `SMTP_FROM_EMAIL` for sender identity.
- For Zoho SMTP, set `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE=false` (STARTTLS on port 587).
- Supported aliases are also accepted (`SMTP_FROM`, `SMTP_SERVER`, `SMTP_SERVER_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SSL`, `ADMIN_LOGIN_EMAIL`) to simplify Railway variable naming.
- If SMTP variables are not provided, the service falls back to a local `sendmail` binary.
- Enter the OTP and submit to access the dashboard.

Use App Management to connect external apps (keyword + endpoint) and then consume the generated app API key from your external service.

## External App Integration (APP_API_KEY)

### 1) Register an external app + keyword mapping
Create an app record (admin endpoint) and save returned `apiKey` as your external app's `APP_API_KEY`.

```bash
curl -X POST "$API_BASE_URL/api/apps" \
  -H "Content-Type: application/json" \
  -H "X-ADMIN-TOKEN: <ADMIN_TOKEN>" \
  -d '{
    "name": "Orders Service",
    "keyword": "ORDER",
    "endpoint": "https://orders.example.com/webhooks/whatsapp",
    "rateLimitRpm": 120
  }'
```

Example response:

```json
{
  "id": 7,
  "name": "Orders Service",
  "keyword": "ORDER",
  "endpoint": "https://orders.example.com/webhooks/whatsapp",
  "apiKey": "2f7d...",
  "rateLimitRpm": 120,
  "isActive": true
}
```

### 2) Send outbound WhatsApp using APP_API_KEY
The send endpoint accepts any one of: `X-APP-KEY`, `APP_API_KEY`, `X-API-KEY`, or `Authorization: Bearer <APP_API_KEY>`.

```bash
curl -X POST "$API_BASE_URL/api/messages/send" \
  -H "Content-Type: application/json" \
  -H "APP_API_KEY: <APP_API_KEY>" \
  -d '{
    "mobile": "2025550199",
    "countryCode": "+1",
    "message": "Your order has shipped"
  }'
```

`countryCode` is optional. The platform does **not** auto-prepend `+91`; pass the destination country code from your connected app when needed.

Example response:

```json
{
  "success": true,
  "provider": {
    "messaging_product": "whatsapp",
    "contacts": [{ "wa_id": "12025550199" }],
    "messages": [{ "id": "wamid.HBgL..." }]
  }
}
```

### 3) Inbound webhook auto-routing by keyword
Inbound text uses the **first token** as keyword (sanitized + uppercased). Remaining text is routed as `command`.

Webhook example that routes to `ORDER` app:

```bash
curl -X POST "$API_BASE_URL/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "wamid.INBOUND123",
            "type": "text",
            "from": "12025550199",
            "text": { "body": "order create shipment 7781" }
          }]
        }
      }]
    }]
  }'
```

Forwarded payload sent to the matched app endpoint:

```json
{
  "mobile": "12025550199",
  "message": "order create shipment 7781",
  "keyword": "ORDER",
  "command": "create shipment 7781",
  "trigger": {
    "keyword": "ORDER",
    "command": "create shipment 7781",
    "fullText": "order create shipment 7781"
  }
}
```

### Validation and routing behavior
- Malformed outbound requests return `400` with `error: "Invalid request body"` and field details.
- Unknown inbound keywords are logged as `unrouted` and safely acknowledged (`200`).
- Inactive app matches are logged as `inactive` and not forwarded.
- Outbound logs include app identity (`app` keyword) and `providerMessageId`.

### Rollout / migration notes
- **No Prisma schema migration is required** for this rollout.
- External apps should store the generated app `apiKey` in their `APP_API_KEY` secret.
- If you enforce strict CORS headers in custom clients, include one of supported app-key headers.

## Meta WhatsApp Webhook Setup (for inbound messages)

Use your backend webhook URL in **Meta Developer Dashboard**:

- **Callback URL**: `https://whatsappplatform-production.up.railway.app/webhook`
- **Verify token**: must be exactly the same value as backend env `VERIFY_TOKEN` (or `WHATSAPP_VERIFY_TOKEN`).

In this codebase, inbound webhook verification is handled at `GET /webhook` and checks `hub.verify_token === VERIFY_TOKEN`. If tokens do not match, Meta gets `403` and webhook subscription fails.

After verification, Meta sends inbound events to `POST /webhook`.

Checklist if messages are not arriving:

1. In Railway variables, set `VERIFY_TOKEN` and redeploy.
2. In Meta dashboard webhook config, paste the same token in **Verify token** and re-verify.
3. Ensure your app subscribed WhatsApp webhook fields (at minimum `messages`).
4. Ensure the phone number is added to the same WhatsApp Business Account connected to the app.
5. For test numbers, ensure sender/recipient are added in Meta test recipients.

## Multi-tenant SaaS APIs (v2)

- `POST /api/auth/login` - issue JWT token.
- `GET/POST /api/tenants` - tenant lifecycle.
- `GET /api/workflows/:tenantId` and `POST /api/workflows` - workflow builder persistence.
- `GET /api/analytics/tenant/:tenantId/overview` - analytics summary.
- `GET /api/analytics/metrics` - Prometheus metrics endpoint.
- `GET /api/billing/plans` - SaaS plans.
- `POST /api/billing/tenant/:tenantId/subscribe` - plan assignment.
- `POST /api/billing/tenant/:tenantId/checkout` - Stripe Checkout session.
- `POST /app/:slug` - auto-provisioned app endpoint.

See `backend/src/docs/architecture.md` for deployment and operational details.
