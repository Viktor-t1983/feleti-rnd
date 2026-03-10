# FELETI R&D Management System — Context for AI Assistants

## 🎯 Project Overview

**FELETI R&D** — это enterprise-система управления исследованиями и разработками для производителя мясоперерабатывающего оборудования.

**Масштаб:** 150+ одновременных пользователей, критичные финансовые данные, интеллектуальная собственность.

**Текущая версия:** 1.1.0 (Engineering Platform v1.0)

### Tech Stack

| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| **Backend**     | Fastify 5.7 + TypeScript 5 (strict) + Prisma ORM + Zod             |
| **Frontend**    | React 18.3 + Vite 6 + TypeScript strict + Tailwind CSS + shadcn/ui |
| **Calc Engine** | Python 3.11 + FastAPI + NumPy + SciPy                              |
| **Database**    | PostgreSQL 16 (prod) / SQLite (dev)                                |
| **Testing**     | Vitest + Testing Library + Playwright + Pytest                     |
| **DevOps**      | Docker Compose + GitHub Actions                                    |
| **AI**          | DeepSeek API (openai-compatible)                                   |

### Architecture

```
feleti-rnd/
├── apps/
│   ├── api/              # Fastify backend (порт 3001)
│   ├── web/              # React frontend (порт 5173 dev / 80 prod)
│   └── calc-engine/      # Python FastAPI (порт 8000)
├── packages/
│   ├── types/            # Общие TypeScript типы
│   └── ui/               # Общие UI компоненты
├── prisma/               # Database schema & migrations
├── .github/workflows/    # CI/CD (ci.yml, deploy.yml)
├── docs/                 # Документация и отчеты
├── backups/              # Бэкапы БД
├── uploads/              # Загруженные файлы
└── scripts/              # Утилиты (backup, restore)
```

---

## 🚀 Quick Start Commands

### Development Setup

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка окружения
cp .env.production.example .env.production
# Отредактируйте .env.production (JWT_SECRET, DATABASE_URL и т.д.)

# 3. Запуск PostgreSQL
docker-compose up postgres -d

# 4. Миграции БД
npm run prisma:migrate

# 5. Загрузка демо-данных
npm run db:seed --workspace=apps/api

# 6. Запуск всех сервисов (3 терминала)
# Terminal 1: API
npm run dev:api

# Terminal 2: Frontend
npm run dev:web

# Terminal 3: Calc Engine (Python)
cd apps/calc-engine
.\venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --port 8000
```

### Production (Docker)

```bash
# Build и запуск всех сервисов
docker-compose up --build -d

# Деплой миграций
docker-compose exec api npx prisma migrate deploy

# Сидирование
docker-compose exec api npx prisma db seed

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f api
```

### URLs

| Сервис      | Development                | Production                 |
| ----------- | -------------------------- | -------------------------- |
| Frontend    | http://localhost:5173      | http://localhost           |
| API         | http://localhost:3001      | http://localhost:3001      |
| Swagger     | http://localhost:3001/docs | http://localhost:3001/docs |
| Calc Engine | http://localhost:8000      | http://localhost:8000      |
| Calc Docs   | http://localhost:8000/docs | http://localhost:8000/docs |

### Demo Credentials

- **Email:** `admin@feleti.com`
- **Password:** `admin123`

---

## 🧪 Testing Commands

```bash
# Unit тесты (все workspaces)
npm run test

# Backend тесты
npm run test:api

# Frontend тесты
npm run test:web

# Python тесты
cd apps/calc-engine && pytest

# E2E тесты (Playwright)
npx playwright test
npx playwright test --headed  # С открытым браузером

# Coverage
npm run test:coverage
```

**Требования к coverage:**

- Backend: 90%+
- Frontend: 80%+
- Python: 90%+

---

## 🔧 Code Quality Commands

```bash
# Lint всех workspace
npm run lint --workspaces

# Format всех workspace
npm run format --workspaces

# TypeScript build check
npm run build --workspaces

# Pre-commit hooks (автоматически через Husky)
# ESLint + Prettier + TypeScript check
```

---

## 📋 Development Workflow (TDD)

### Обязательный workflow для КАЖДОЙ задачи:

1. **Понять задачу** — прочитать промпт, проверить существующие паттерны
2. **Написать тесты ПЕРВЫМИ** — создать `__tests__/feature.test.ts`, запустить (должны FAIL)
3. **Написать код** — реализовать функционал
4. **Запустить тесты** — должны PASS
5. **Проверить качество** — `npm run lint`, `npm run format`, `npm run build`
6. **Запустить сервисы и проверить в браузере** — открыть http://localhost:5173, проверить Console (0 errors)
7. **E2E тесты** — для критичного функционала (auth, payments, data submission)
8. **Обновить документацию** — Swagger, JSDoc, README
9. **Финальная проверка** — все тесты OK, линтер OK, browser console чистая
10. **Показать результат** — скриншоты UI изменений, список файлов

---

## 🔒 Security Rules

### ЗАПРЕЩЕНО

```typescript
// ❌ Возвращать пароль в response
return user; // содержит password hash!

// ❌ Использовать any
function process(data: any) { }

// ❌ Нет валидации
prisma.project.create({ data: req.body });

// ❌ Нет проверки авторизации
async function deleteProject(id) {
  await prisma.project.delete({ where: { id } });
}

// ❌ Игнорировать ошибки
try { ... } catch (e) { }

// ❌ console.log в production
console.log('debug:', data);
```

### ОБЯЗАТЕЛЬНО

```typescript
// ✅ Исключать password из response
select: { id: true, email: true } // password: false

// ✅ Строгая типизация
interface CreateInput { name: string; email: string; }

// ✅ Zod валидация
const validated = schema.parse(req.body);

// ✅ Проверка авторизации (RBAC)
if (project.creatorId !== userId && role !== 'Admin') {
  throw new AuthorizationError();
}

// ✅ Обработка ошибок
try { ... } catch (error) {
  logger.error(error);
  throw new AppError();
}

// ✅ Проверка на null
if (!project) throw new NotFoundError();

// ✅ Middleware authenticate на всех endpoint
fastify.get('/api/projects', { preHandler: [authenticate] }, handler);
```

---

## 📝 Code Style Summary

### TypeScript

- **Strict mode** во всех проектах
- **NO `any`** — использовать конкретные типы или `unknown`
- **Явные return types** у функций
- **JSDoc** для публичных API

### Именование

| Тип        | Стиль      | Пример            |
| ---------- | ---------- | ----------------- |
| Файлы      | kebab-case | `user-service.ts` |
| Компоненты | PascalCase | `UserCard.tsx`    |
| Функции    | camelCase  | `getUserById`     |
| Константы  | UPPER_CASE | `MAX_RETRIES`     |
| Интерфейсы | PascalCase | `UserData`        |

### Импорты (порядок)

```typescript
// 1. Внешние зависимости
import { FastifyInstance } from 'fastify';

// 2. Внутренние импорты (пустая строка между группами)
import { prisma } from '@/lib/prisma';
import { UserService } from '@/modules/user/user.service';

// 3. Типы
interface UserInput { ... }

// 4. Константы
const MAX_RETRIES = 3;

// 5. Функции/Классы
export class UserController { ... }
```

### React

```tsx
// ✅ Правильно
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps): JSX.Element {
  const handleClick = (): void => {
    onEdit?.(user.id);
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      {onEdit && <button onClick={handleClick}>Edit</button>}
    </div>
  );
}
```

---

## 🗂️ Module Structure

### Backend (apps/api/src)

```
src/
├── config/           # Конфигурация (database, env)
├── errors/           # Классы ошибок
├── lib/              # Утилиты (prisma singleton, logger)
├── middlewares/      # Auth, RBAC, validation
├── modules/          # Бизнес-логика по фичам
│   ├── ai-agents/
│   ├── auth/
│   ├── engineering/  # Engineering Platform v1.0
│   │   ├── calculations/
│   │   ├── knowledge/
│   │   ├── product-classes/
│   │   ├── rules/
│   │   └── validation/
│   ├── projects/
│   ├── search/
│   └── users/
├── plugins/          # Fastify плагины (jwt, rate-limit, security)
├── scripts/          # Скрипты (seed, migrate, health-check)
├── types/            # TypeScript типы
└── utils/            # Вспомогательные функции
```

### Frontend (apps/web/src)

```
src/
├── components/       # UI компоненты
├── hooks/            # Custom React хуки
├── layouts/          # Layout компоненты
├── lib/              # Утилиты (axios, query client)
├── pages/            # Страницы приложения
├── services/         # API сервисы
├── store/            # State management
└── types/            # TypeScript типы
```

---

## 🧩 Key Features

### Модули системы

1. **Аутентификация** — JWT с refresh tokens, bcrypt hashing
2. **RBAC** — роли: Admin, Manager, Engineer, Viewer
3. **Проекты** — полный CRUD, стадии жизненного цикла, бюджетирование
4. **Engineering Platform v1.0** (v1.1.0):
   - Product Classes Framework
   - Rules Engine с DSL
   - Validation Gates System
   - Calculation Blocks с Formula Evaluator
   - Knowledge Graph с traceability
   - AI Agents с DeepSeek интеграцией
5. **Финансовые расчеты** — NPV, IRR, ROI, Payback Period
6. **Аналитика** — KPI dashboard, графики, экспорт отчетов
7. **Поиск** — полнотекстовый поиск по проектам и документам

### Особенности

- Мультиязычность (RU/EN)
- Mobile-first responsive (320px, 768px, 1024px)
- Dark/Light тема
- PWA поддержка
- Real-time обновления
- Экспорт: PDF, Excel, CSV
- Файловые вложения

---

## 🐳 Docker Services

```yaml
services:
  postgres: # PostgreSQL 16 (порт 5432)
  api: # Fastify backend (порт 3001)
  web: # React frontend (порт 80)
  calc-engine: # Python FastAPI (порт 8000)
```

### Docker Commands

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Rebuild
docker-compose up -d --build

# Логи
docker-compose logs -f api

# В контейнер
docker-compose exec api sh

# Prisma в Docker
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma studio
```

---

## 📊 Performance Targets

| Метрика             | Цель    |
| ------------------- | ------- |
| API response        | < 300ms |
| Page load           | < 2s    |
| First paint         | < 1.5s  |
| Database query      | < 100ms |
| Coverage (backend)  | 90%+    |
| Coverage (frontend) | 80%+    |

---

## 📁 Important Files

| Файл                           | Описание                          |
| ------------------------------ | --------------------------------- |
| `README.md`                    | Основная документация проекта     |
| `STYLE_GUIDE.md`               | Детальный гайд по стилю кода      |
| `CONTRIBUTING.md`              | Руководство для контрибьюторов    |
| `CHANGELOG.md`                 | История изменений                 |
| `.cursorrules`                 | AI assistant правила (3.3)        |
| `docker-compose.yml`           | Docker конфигурация               |
| `.env.production.example`      | Шаблон production переменных      |
| `package.json`                 | Root workspace конфигурация       |
| `apps/api/src/server.ts`       | Точка входа backend               |
| `docs/ENGINEERING_PLATFORM.md` | Документация Engineering Platform |

---

## 🆘 Known Limitations

### Calc Engine (Python)

Реализованы финансовые расчёты:

- ✅ NPV (Net Present Value)
- ✅ IRR (Internal Rate of Return)
- ✅ ROI (Return on Investment)
- ✅ Payback Period

Реализованы инженерные расчёты (v1.1.1):

- ✅ Прочность валов (strength) — ГОСТ 21354-87
- ✅ Тепловой баланс (thermal) — расчёт КПД и потерь
- ✅ Вентиляция (ventilation) — СП 60.13330.2020

### Endpoints

- `POST /engineering/shaft-strength` — расчёт прочности вала
- `POST /engineering/thermal-balance` — тепловой баланс оборудования
- `POST /engineering/ventilation` — расчёт вентиляции помещений

### Тесты

17 интеграционных тестов используют `skipIf` — требуют настройки тестовой БД.

---

## 📞 Contact & Resources

- **Location:** `D:\Projects\feleti-rnd`
- **Email:** rnd@feleti.com
- **Website:** https://feleti.com

---

**Last Updated:** 2026-03-10  
**Version:** 1.1.0 (Engineering Platform)
