# FELETI R&D Management System

Enterprise система управления R&D проектами.

## 🚀 Быстрый старт

### Требования

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16+

### Development

```bash
# 1. Клонируй репозиторий
git clone https://github.com/your-org/feleti-rnd

# 2. Установи зависимости
npm install

# 3. Создай .env файлы
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 4. Запусти PostgreSQL
docker-compose up postgres -d

# 5. Запусти миграции
npm run db:migrate --workspace=apps/api

# 6. Загрузи демо-данные
npm run db:seed --workspace=apps/api

# 7. Запусти Python venv
cd apps/calc-engine
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ../..

# 8. Запусти всё
# Terminal 1:
npm run dev --workspace=apps/api

# Terminal 2:
npm run dev --workspace=apps/web

# Terminal 3:
cd apps/calc-engine && uvicorn app.main:app --reload --port 8000
```

### Production (Docker)

```bash
cp .env.example .env
# Отредактируй .env

docker-compose up --build -d
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma db seed
```

## 📊 Архитектура

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

## 🌐 URLs

| Сервис | Development | Production |
| -------- | ------------- | ------------ |
| Frontend | <http://localhost:5173> | <http://localhost> |
| API | <http://localhost:3001> | <http://localhost:3001> |
| Swagger | <http://localhost:3001/docs> | <http://localhost:3001/docs> |
| Calc Engine | <http://localhost:8000> | <http://localhost:8000> |
| Calc Docs | <http://localhost:8000/docs> | <http://localhost:8000/docs> |

## 🔑 Demo Credentials

**Email:** <admin@feleti.com>
**Password:** admin123

## 🧪 Тестирование

```bash
npm run test              # Unit тесты
npm run test:coverage     # С coverage
npx playwright test       # E2E тесты
cd apps/calc-engine && pytest  # Python тесты
```

## 🔧 Code Quality

Проект использует строгие правила Code Quality:

- **ESLint** с TypeScript strict rules
- **Prettier** для форматирования
- **Husky** pre-commit hooks
- **TypeScript** strict mode

Запуск проверок:

```bash
npm run lint --workspaces
npm run format --workspaces
npm run build --workspaces
```

## 🐳 Docker

Проект полностью контейнеризирован:

```bash
# Build всех образов
docker-compose build

# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f
```

### Сервисы в Docker

1. **postgres** - PostgreSQL 16
2. **api** - Fastify API (порт 3001)
3. **web** - React Frontend (порт 80)
4. **calc-engine** - Python FastAPI (порт 8000)

## 📁 Структура проекта

### Backend (apps/api)

- Fastify 5.7.4 + TypeScript strict
- Prisma ORM + PostgreSQL
- JWT аутентификация
- RBAC авторизация
- Swagger документация

### Frontend (apps/web)

- React 18.3 + TypeScript strict
- Vite 6 + Tailwind CSS
- React Query для state management
- Recharts для графиков
- Полная русская локализация

### Calc Engine (apps/calc-engine)

- Python 3.11 + FastAPI
- Финансовые расчеты (NPV, IRR, ROI, Payback)
- NumPy для математических операций
- Автоматическая документация OpenAPI

## 🔒 Безопасность

- JWT tokens с refresh механизмом
- Helmet security headers
- Rate limiting
- CORS настройки
- SQL injection protection через Prisma
- XSS protection
- Password hashing с bcrypt

## 📈 Функциональность

### Модули

1. **Аутентификация** - регистрация, вход, refresh tokens
2. **Проекты** - полный CRUD для R&D проектов
3. **Финансовые расчеты** - NPV, IRR, ROI, Payback Period
4. **Аналитика** - KPI dashboard, графики, отчеты
5. **Пользователи** - управление ролями (admin, manager, user)

### Особенности

- Мультиязычность (RU/EN)
- Mobile-first responsive дизайн
- Real-time обновления данных
- Экспорт отчетов
- Уведомления
- История изменений

## 🚀 Deployment

### Варианты деплоя

1. **Docker Compose** (рекомендуется для production)
2. **Kubernetes** (helm charts в `.github/`)
3. **Cloud Providers**:
   - AWS ECS/EKS
   - Google Cloud Run
   - Azure Container Instances

### Environment Variables

Создайте `.env` файл на основе `.env.example`:

```bash
# Database
POSTGRES_USER=feleti
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=feleti_rnd

# API
NODE_ENV=production
JWT_SECRET=32_char_random_string_here
JWT_REFRESH_SECRET=another_32_char_string
CORS_ORIGIN=https://your-domain.com

# Frontend
VITE_API_URL=https://api.your-domain.com
VITE_CALC_ENGINE_URL=https://calc.your-domain.com
```

## 🤝 Contributing

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Запустите тесты (`npm run test`)
4. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
5. Запушьте branch (`git push origin feature/amazing-feature`)
6. Откройте Pull Request

## 📄 Лицензия

Проприетарное ПО - FELETI Corporation

## 📞 Контакты

FELETI R&D Department
Email: <rnd@feleti.com>
Website: <https://feleti.com>

---

**FELETI R&D Management System** © 2026 FELETI Corporation. Все права защищены.
