FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build:server
RUN pnpm run build:web

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/dist/web ./dist/web
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

RUN addgroup -g appgroup && adduser -u 1001 -G appgroup -D appuser
RUN chown -R appuser:appgroup /app/dist
USER appuser

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
