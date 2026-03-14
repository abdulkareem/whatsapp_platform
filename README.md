# WhatsApp SaaS Messaging Platform

Production-ready mini Twilio-like platform for WhatsApp Business Cloud API with multi-tenant app routing.

## Tech Stack
- Backend: Node.js, TypeScript, Express
- DB: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Dashboard: React + Vite + Tailwind
- Logging: Winston
- API Docs: Swagger at `/docs`

## Features
- Multi-App WhatsApp Gateway
- OTP Messaging
- Broadcast Queue
- Notification APIs
- Webhook Verification and Routing
- Message Logs + Conversation Tracking
- API Key Authentication
- Per-app Rate Limiting
- Admin Dashboard

## Quick start
```bash
cp .env.example .env
cd backend && npm install && npm run prisma:generate
cd ../dashboard && npm install
cd .. && docker compose up --build
```

## Important endpoints
- `GET /webhook` verification
- `POST /webhook` inbound messages
- `POST /api/messages/send`
- `POST /api/messages/otp/send`
- `POST /api/broadcast`
- `GET /api/messages/logs`
- `GET /api/apps`

## Example request
```bash
curl -X POST http://localhost:4000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-APP-KEY: your-app-key" \
  -d '{"mobile":"919747917623","message":"Welcome to MyCrowb"}'
```

## Railway + Cloudflare deployment
- **Backend (Railway):** Deploy from `backend/`, set start command to `npm run start` and build command to `npm run build`.
- **Worker (Railway):** Create a second service from `backend/` with command `npm run worker`.
- **Frontend (Cloudflare Pages):** Deploy from `dashboard/` with build command `npm run build` and output directory `dist`.
- Set `VITE_API_BASE_URL` in Cloudflare to your Railway backend URL.
- Set `CORS_ORIGINS` in Railway to your Cloudflare domain (comma-separated for multiple domains).
