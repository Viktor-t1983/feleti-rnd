# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Build аргументы для DATABASE_URL
ARG DATABASE_URL
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ENV DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Увеличиваем память для Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Устанавливаем зависимости
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm install

# Копируем исходники
COPY apps/api ./apps/api
COPY apps/api/prisma ./apps/api/prisma

# Генерируем Prisma client
RUN cd apps/api && npx prisma generate

# Сборка TypeScript
RUN cd apps/api && npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Создаём непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Копируем только нужное
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma

# Права
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]