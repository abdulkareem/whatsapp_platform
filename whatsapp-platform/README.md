# WhatsApp Gateway Service

Production-ready Express middleware between Meta WhatsApp Cloud API and downstream client apps (e.g. MYCROWB).

## Features
- Webhook verification (`GET /webhook`)
- Webhook signature validation (`POST /webhook`, `X-Hub-Signature-256`)
- Incoming message parsing and forwarding to client apps
- Outbound WhatsApp send API (`POST /send-message`)
- Rate limiting, structured logging, centralized error handling
- Future-ready routing through `CLIENT_ROUTE_CONFIG` (keywords/phone prefixes)

## Run
```bash
cp .env.example .env
npm install
npm start
```

## Endpoints
### `GET /webhook`
Meta webhook subscription verification.

### `POST /webhook`
Receives webhook events, validates signature, extracts:
- `entry[0].changes[0].value.messages[0].from`
- `entry[0].changes[0].value.messages[0].text.body`

Forwards to mapped clients with payload:
```json
{
  "api_key": "<client-api-key>",
  "from": "<phone>",
  "message": "<text>"
}
```

### `POST /send-message`
Request body:
```json
{
  "to": "<phone>",
  "message": "<text>"
}
```
Sends through `https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`.
