#!/usr/bin/env bash
set -euo pipefail

DEPLOY_TARGET="${DEPLOY_TARGET:-backend}"

if [ "$DEPLOY_TARGET" = "frontend" ]; then
  if [ -d "frontend/dist" ]; then
    PORT="${PORT:-8080}"
    exec python3 -m http.server "$PORT" --directory frontend/dist
  fi

  echo "Frontend target selected, but frontend/dist was not found. Build frontend before running this container." >&2
  exit 1
fi

if [ ! -d "backend" ]; then
  echo "backend directory not found." >&2
  exit 1
fi

if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ] && [ ! -d node_modules ]; then
    npm ci
  elif [ ! -d node_modules ]; then
    npm install
  fi

  if [ ! -d backend/dist ]; then
    npm run build -w @whatsapp-platform/backend
  fi

  exec npm run start -w @whatsapp-platform/backend
fi

echo "Node/npm is not available in this runtime. Deploy backend to Railway and frontend to Cloudflare Pages, or provide a node runtime." >&2
exit 1
