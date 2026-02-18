# ДЕНЬ 6: Production Ready - Code Quality + Docker + Deployment

## 📋 Обзор

Этот документ содержит детальный план для реализации ДЕНЬ 6 проекта FELETI R&D Management System. План разбит на логические этапы с четкими инструкциями для выполнения в режиме Code.

## 🎯 Цели

1. Настроить Code Quality инструменты (ESLint, Prettier, Husky)
2. Создать Docker контейнеры для всех сервисов
3. Настроить окружение для production
4. Провести полное тестирование и проверку
5. Создать документацию

## 📁 Структура проекта

```text
feleti-rnd/
├── apps/
│   ├── api/          # Fastify 5 + Prisma + TypeScript
│   ├── web/          # React 18 + Vite + Tailwind
│   └── calc-engine/  # Python 3.11 + FastAPI
├── prisma/           # Database schema
├── .github/          # CI/CD workflows
└── docker-compose.yml
```

## 🔧 ЧАСТЬ 1: Code Quality Setup

### ШАГ 1: Установка ESLint пакетов

Выполнить в корне проекта:

```bash
# API
npm install --workspace=apps/api -D \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier \
  eslint-plugin-import

# Frontend
npm install --workspace=apps/web -D \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-config-prettier \
  eslint-plugin-import

# Prettier (корень)
npm install -D prettier husky lint-staged
```

### ШАГ 2: .prettierrc (уже существует, проверить)

Файл `.prettierrc` уже существует с правильной конфигурацией. Убедиться, что он содержит:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ШАГ 3: ESLint для API (apps/api/.eslintrc.cjs)

Заменить содержимое файла `apps/api/.eslintrc.cjs` на:

```javascript
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-floating-promises': 'error',
    'no-eval': 'error',
  },
};
```

### ШАГ 4: ESLint для Frontend (apps/web/.eslintrc.cjs)

Заменить содержимое файла `apps/web/.eslintrc.cjs` на:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-key': 'error',
  },
};
```

### ШАГ 5: Husky pre-commit hook

Инициализировать Husky:

```bash
npx husky init
```

Создать файл `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

Обновить корневой `package.json` (раздел `lint-staged` уже существует, проверить):

```json
{
  "lint-staged": {
    "apps/api/src/**/*.ts": ["eslint --fix", "prettier --write"],
    "apps/web/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

### ШАГ 6: Запуск lint на весь проект

```bash
npm run lint --workspace=apps/api
npm run lint --workspace=apps/web
```

Исправить все ошибки ESLint.

### ШАГ 7: VS Code settings (.vscode/settings.json)

Обновить файл `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### ШАГ 8: VS Code extensions (.vscode/extensions.json)

Создать файл `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "streetsidesoftware.code-spell-checker-russian"
  ]
}
```

## 🐳 ЧАСТЬ 2: Docker Setup

### ШАГ 1: .dockerignore (корень)

Создать файл `.dockerignore`:

```text
node_modules
*/node_modules
dist
*/dist
.git
.env
*.log
coverage
*/coverage
.vscode
```

### ШАГ 2: Dockerfile для API (apps/api/Dockerfile)

Создать файл `apps/api/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api

# Копируем исходники
COPY apps/api ./apps/api
COPY prisma ./prisma

# Генерируем Prisma client
RUN cd apps/api && npx prisma generate

# Сборка TypeScript
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Создаём непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Копируем только нужное
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Права
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
```

### ШАГ 3: nginx.conf (apps/web/nginx.conf)

Создать файл `apps/web/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### ШАГ 4: Dockerfile для Frontend (apps/web/Dockerfile)

Создать файл `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci --workspace=apps/web

COPY apps/web ./apps/web

# Build переменные
ARG VITE_API_URL=http://localhost:3001
ARG VITE_CALC_ENGINE_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CALC_ENGINE_URL=$VITE_CALC_ENGINE_URL

RUN npm run build --workspace=apps/web

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### ШАГ 5: Dockerfile для Calc Engine (apps/calc-engine/Dockerfile)

Создать файл `apps/calc-engine/Dockerfile`:

```dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY apps/calc-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/calc-engine/app ./app

RUN addgroup --system appgroup && adduser --system --group appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### ШАГ 6: docker-compose.yml (корень)

Создать файл `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: feleti-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-feleti}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-feleti_dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-feleti_rnd}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-feleti}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - feleti-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: feleti-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-feleti}:${POSTGRES_PASSWORD:-feleti_dev_password}@postgres:5432/${POSTGRES_DB:-feleti_rnd}
      JWT_SECRET: ${JWT_SECRET:-dev_secret_change_in_production}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev_refresh_secret}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - feleti-network
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:3001}
        VITE_CALC_ENGINE_URL: ${VITE_CALC_ENGINE_URL:-http://localhost:8000}
    container_name: feleti-web
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - feleti-network
    restart: unless-stopped

  calc-engine:
    build:
      context: .
      dockerfile: apps/calc-engine/Dockerfile
    container_name: feleti-calc
    ports:
      - "8000:8000"
    networks:
      - feleti-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  feleti-network:
    driver: bridge
```

### ШАГ 7: .env.example (корень)

Создать файл `.env.example`:

```bash
# Database
POSTGRES_USER=feleti
POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION
POSTGRES_DB=feleti_rnd

# API
NODE_ENV=production
JWT_SECRET=CHANGE_ME_MIN_32_CHARS_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_ME_ANOTHER_32_CHARS_STRING
CORS_ORIGIN=http://localhost

# Frontend
VITE_API_URL=http://localhost:3001
VITE_CALC_ENGINE_URL=http://localhost:8000
```

## ✅ ЧАСТЬ 3: API Environment Config

### Обновить apps/api/src/config/index.ts

Заменить содержимое файла `apps/api/src/config/index.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  },
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;
```

### Обновить apps/web/src/config/api.config.ts

Создать файл `apps/web/src/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  calcEngineUrl: import.meta.env.VITE_CALC_ENGINE_URL || 'http://localhost:8000',
} as const;
```

Обновить `apps/web/src/lib/api.ts` и `apps/web/src/lib/financialApi.ts` чтобы использовали `API_CONFIG`.

## 🧪 ЧАСТЬ 4: Final Testing

### ШАГ 1: Запуск ВСЕХ тестов

```bash
# Backend unit tests
npm run test --workspace=apps/api

# Frontend unit tests
npm run test --workspace=apps/web

# Python tests
cd apps/calc-engine
.\venv\Scripts\activate
pytest -v --cov=app

# E2E tests (нужны запущенные серверы)
cd apps/web
npx playwright test
```

Все тесты должны пройти.

### ШАГ 2: TypeScript проверка

```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

### ШАГ 3: Lint проверка

```bash
npm run lint --workspace=apps/api
npm run lint --workspace=apps/web
```

## 🐳 ЧАСТЬ 5: Docker Build & Test

### ШАГ 1: Создать .env из примера

```powershell
# Windows PowerShell
Copy-Item .env.example .env
# Отредактировать .env если нужно
notepad .env
```

### ШАГ 2: Запустить через Docker

```bash
# Build и запуск всех сервисов
docker-compose up --build -d

# Проверить статус
docker-compose ps

# Логи
docker-compose logs -f
```

### ШАГ 3: Database migrations в Docker

```bash
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma db seed
```

### ШАГ 4: Проверить все сервисы

```bash
# PowerShell - открыть все endpoints
Start-Process "http://localhost"           # Frontend
Start-Process "http://localhost:3001/health"  # API health
Start-Process "http://localhost:3001/docs"    # Swagger
Start-Process "http://localhost:8000/docs"    # Calc Engine docs
```

### ШАГ 5: Browser Verification (ОБЯЗАТЕЛЬНО!)

1. Открыть: <http://localhost>
2. Проверить:
   ✅ Login работает (<admin@feleti.com> / admin123)
   ✅ Dashboard открывается
   ✅ Projects CRUD работает
   ✅ Financial Calculators работают
   ✅ Console ЧИСТАЯ (F12, 0 errors)
   ✅ Network requests 200 OK
   ✅ Mobile responsive (320px)

3. Сделать скриншоты ВСЕГО!

## 📚 ЧАСТЬ 6: Documentation

### Создать README.md (корень)

Создать файл `README.md` с содержимым из задания.

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

```text
CODE QUALITY:
✅ ESLint настроен для API
✅ ESLint настроен для Frontend
✅ Prettier настроен
✅ Husky pre-commit hooks
✅ VS Code settings
✅ STYLE_GUIDE.md создан

DOCKER:
✅ Dockerfile для API
✅ Dockerfile для Frontend
✅ Dockerfile для Calc Engine
✅ docker-compose.yml
✅ .dockerignore
✅ .env.example

TESTING:
✅ Backend unit tests pass
✅ Frontend unit tests pass
✅ Python tests pass
✅ E2E tests pass
✅ TypeScript compiles
✅ Lint passes

BROWSER:
✅ docker-compose работает
✅ All services healthy
✅ Login/Register работают
✅ Dashboard загружается
✅ Projects CRUD работает
✅ Calculators работают
✅ Console CLEAN
✅ Mobile OK

DOCS:
✅ README.md полный
✅ Swagger docs
✅ STYLE_GUIDE.md
✅ .env.example
```

## 📊 ФИНАЛЬНЫЙ ОТЧЁТ

После выполнения всех шагов создать финальный отчет:

```markdown
## ✅ ДЕНЬ 6 ЗАВЕРШЁН: Production Ready!

### Code Quality:
✅ ESLint: X errors fixed
✅ Prettier: formatted
✅ Husky: hooks installed
✅ TypeScript: strict mode

### Docker:
✅ All images built
✅ docker-compose up works
✅ All services healthy:
   - postgres: healthy
   - api: healthy (3001)
   - web: running (80)
   - calc: healthy (8000)

### Tests (ФИНАЛЬНЫЕ):
✅ API unit: X/X passed
✅ Frontend unit: X/X passed
✅ Python: X/X passed
✅ E2E: X/X passed
✅ Coverage: X%

### Browser (Docker):
✅ http://localhost - works
✅ Login: admin@feleti.com ✓
✅ Dashboard: charts visible ✓
✅ Projects: CRUD works ✓
✅ Calculators: NPV works ✓
✅ Console: 0 errors ✓
✅ Mobile: responsive ✓

### Screenshots:
[Frontend в Docker]
[Dashboard]
[Projects page]
[Calculator]
[Console clean]
[docker-compose ps - all healthy]

🎉 ПРОЕКТ ПОЛНОСТЬЮ ГОТОВ К PRODUCTION!
```

## 🚀 Порядок выполнения

1. Переключиться в режим Code
2. Выполнить ЧАСТЬ 1 (Code Quality)
3. Выполнить ЧАСТЬ 2 (Docker Setup)
4. Выполнить ЧАСТЬ 3 (Environment Config)
5. Выполнить ЧАСТЬ 4 (Testing)
6. Выполнить ЧАСТЬ 5 (Docker Build & Test)
7. Выполнить ЧАСТЬ 6 (Documentation)
8. Создать финальный отчет

## ⚠️ Важные замечания

- Все команды выполняются из корня проекта
- Для Windows использовать PowerShell
- Проверять наличие ошибок на каждом этапе
- Делать скриншоты для документации
- Убедиться, что все тесты проходят перед переходом к следующему этапу
