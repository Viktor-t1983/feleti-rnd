# ==========================================
# Build stage (лёгкий, только для сборки)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Устанавливаем зависимости
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm install

# Копируем исходники
COPY apps/api ./apps/api

# Генерируем Prisma client для Alpine (builder)
RUN cd apps/api && npx prisma generate

# Сборка TypeScript
RUN cd apps/api && npm run build

# ==========================================
# Production stage (Playwright + Chromium)
# ==========================================
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS production

WORKDIR /app

# Устанавливаем Node.js 20 (в playwright image старая версия)
RUN apt-get update && apt-get install -y curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Устанавливаем зависимости для Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Копируем package.json
COPY --from=builder /app/apps/api/package*.json ./

# Устанавливаем production зависимости (НЕ копируем из builder!)
RUN npm install --omit=dev

# Копируем Prisma schema
COPY --from=builder /app/apps/api/prisma ./prisma

# Генерируем Prisma Client для Debian (production)
RUN npx prisma generate

# Копируем собранное приложение
COPY --from=builder /app/apps/api/dist ./dist

# Копируем шрифты для PDF
COPY --from=builder /app/apps/api/fonts ./fonts

# Playwright уже есть в системе
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
