# Backend build
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install --workspaces --include-workspace-root
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
RUN npm run build -w @whatsapp-platform/backend

FROM node:20-alpine AS backend-runtime
WORKDIR /app
COPY --from=backend-builder /app/apps/backend/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend/prisma ./apps/backend/prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
