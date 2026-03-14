# Backend build
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --workspaces --include-workspace-root
COPY backend ./backend
RUN npm run prisma:generate -w @whatsapp-platform/backend
RUN npm run build -w @whatsapp-platform/backend

FROM node:20-alpine AS backend-runtime
WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY backend/package.json ./backend/package.json
COPY backend/prisma ./backend/prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
