FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install --workspaces --include-workspace-root
COPY apps/dashboard ./apps/dashboard
COPY packages/shared ./packages/shared
RUN npm run build -w @whatsapp-platform/dashboard

FROM nginx:alpine
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
