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


## Admin login

- Admin email login is restricted to `abdulkareem.t@gmail.com`.
- Click **Verify** on the login page to send a 6-digit OTP to that email.
- Configure `SMTP_FROM_EMAIL` for sender identity.
- For Zoho SMTP, set `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE=false` (STARTTLS on port 587).
- If SMTP variables are not provided, the service falls back to a local `sendmail` binary.
- Enter the OTP and submit to access the dashboard.

Use App Management to connect external apps (keyword + endpoint) and then consume the generated app API key from your external service.
