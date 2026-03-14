#!/usr/bin/env bash
set -euo pipefail

DEPLOY_TARGET="${DEPLOY_TARGET:-backend}"

if [ "$DEPLOY_TARGET" = "frontend" ]; then
  if [ -d "dashboard/dist" ]; then
    PORT="${PORT:-8080}"
    exec python3 -m http.server "$PORT" --directory dashboard/dist
  fi

  echo "Frontend target selected, but dashboard/dist was not found. Build frontend before running this container." >&2
  exit 1
fi

if [ ! -d "backend" ]; then
  echo "backend directory not found." >&2
  exit 1
fi

cd backend

if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ] && [ ! -d node_modules ]; then
    npm ci
  elif [ ! -d node_modules ]; then
    npm install
  fi

  if [ ! -d dist ]; then
    npm run build
  fi

  exec npm start
fi

if command -v node >/dev/null 2>&1 && [ -f dist/server.js ]; then
  exec node dist/server.js
fi

echo "Node/npm is not available in this runtime. Deploy backend to Railway and frontend to Cloudflare Pages, or provide a prebuilt dist/ with node runtime." >&2
exit 1
