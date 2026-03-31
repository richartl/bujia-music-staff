# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=builder /app/dist /usr/share/nginx/html


EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
