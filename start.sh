#!/usr/bin/env bash
set -euo pipefail

cd backend

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build
exec npm start
