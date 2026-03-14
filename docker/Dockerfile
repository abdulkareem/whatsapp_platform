# Backend build
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend .
RUN npm run build

FROM node:20-alpine AS backend-runtime
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY backend/package.json ./package.json
COPY backend/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
