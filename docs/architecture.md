# SaaS WhatsApp Messaging Platform (Mini Twilio)

## System architecture

WhatsApp Cloud API → Webhook Controller → Message Router → Application Handler → External Apps

### Core backend modules
- Multi-app gateway with keyword routing.
- OTP service with DB persistence and expiry.
- Broadcast service powered by BullMQ.
- Notification/regular messaging API.
- API key auth and rate limiting.
- Message logs and conversation tracking.

## External app integration
1. Admin creates an app with `keyword`, `endpoint`, and generated `apiKey`.
2. App sends outgoing messages with `X-APP-KEY`.
3. Inbound messages starting with keyword are forwarded to app endpoint.

## OTP flow
- `POST /api/messages/otp/send` generates OTP.
- OTP stored in `OTP` table.
- WhatsApp message sent using Cloud API.

## Routing flow
Message `MYCROWB LOGIN`:
- keyword = `MYCROWB`
- matched app endpoint receives `{ mobile, message }`.

## Deployment guide
- Docker Compose includes backend, worker, dashboard, postgres, redis.
- For Railway/Fly.io:
  - Deploy backend service (`npm run start` after build).
  - Deploy worker service (`npm run worker`).
  - Provision managed Postgres + Redis.
  - Set env variables from `.env.example`.
