# WhatsApp SaaS Platform Architecture

## Overview
This platform provides a shared WhatsApp Business Cloud API number and webhook to serve multiple downstream applications.

## High-level flow
1. Meta sends inbound events to `POST /webhook`.
2. Webhook controller extracts sender and message body.
3. Message router extracts app keyword (first token).
4. App lookup resolves app endpoint.
5. Gateway forwards payload to app endpoint.

## Components
- **Express API**: Core gateway + management APIs.
- **Prisma/Postgres**: Persistent storage for apps, logs, OTP, conversations.
- **Redis/BullMQ**: Queue for broadcast and high-volume sends.
- **Winston logging**: Structured logs for observability.

## Multi-app integration
Apps register with:
- `name`
- `keyword`
- `endpoint`
- generated `apiKey`

Apps call gateway APIs with `X-APP-KEY`.

## OTP flow
1. App calls `POST /api/messages/otp/send` with mobile + app name.
2. OTP generated and stored with expiry.
3. OTP message sent via WhatsApp Cloud API.

## Routing flow
Keyword convention: first token of incoming text, e.g. `MYCROWB LOGIN` routes to app with keyword `MYCROWB`.

## Deployment
- Containerized with Docker.
- Compatible with Railway/Fly.io.
- Worker runs separately via `npm run worker`.
