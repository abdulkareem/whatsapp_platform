FROM node:20-alpine AS builder
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm install
COPY dashboard .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dashboard/dist /usr/share/nginx/html
EXPOSE 80
