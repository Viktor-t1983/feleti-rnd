# CHANGELOG

Все важные изменения в проекте FELETI R&D.

## [1.1.0] - 2026-02-20

### ✨ Added - Engineering Platform v1.0

#### Backend

- ✅ Product Classes Framework
- ✅ Engineering Rules Engine с DSL
- ✅ Validation Gates System
- ✅ Calculation Blocks с Formula Evaluator
- ✅ Knowledge Graph с traceability
- ✅ AI Agents с DeepSeek интеграцией
- ✅ Agent Memory Layer
- ✅ Context Management

#### Frontend

- ✅ Engineering Console
- ✅ Product Classes UI
- ✅ Rules Dashboard
- ✅ Gates Progress component
- ✅ AI Engineering Assistant

#### Database

- ✅ 13 новых таблиц
- ✅ Composite indexes
- ✅ Граф связей

#### Tests

- ✅ Integration tests
- ✅ E2E flow tests
- ✅ Seed verification tests

#### Documentation

- ✅ Engineering Platform guide
- ✅ API documentation
- ✅ Architecture overview

#### Technical Details

- ✅ TypeScript strict mode
- ✅ Clean Architecture
- ✅ Product-Agnostic Design
- ✅ OpenAI-compatible LLM interface
- ✅ Formula Evaluator (безопасный)
- ✅ Rule DSL

---

## [1.0.0] - 2026-02-17

### ✨ Добавленные функции

#### Основа системы

- ✅ JWT авторизация с refresh tokens
- ✅ RBAC (Admin, Manager, Engineer, Viewer)
- ✅ PostgreSQL база данных
- ✅ Docker контейнеризация
- ✅ 110+ тестов (Vitest)

#### UI/UX

- ✅ Dark/Light тема
- ✅ Полная русская локализация
- ✅ Toast уведомления
- ✅ Responsive дизайн
- ✅ PWA (установка на телефон)

#### Проекты

- ✅ CRUD операции
- ✅ Стадии: Идея → Концепт → Дизайн → Прототип → Тестирование → Производство
- ✅ Статусы: Активен, На паузе, Отменён, Завершён
- ✅ Бюджетирование и трекинг затрат
- ✅ Команды проектов
- ✅ Комментарии
- ✅ Файловые вложения (PDF, DOC, изображения, архивы)

#### Калькуляторы

- ✅ NPV (Net Present Value)
- ✅ IRR (Internal Rate of Return)
- ✅ ROI (Return on Investment)
- ✅ Payback Period
- ✅ Python backend для вычислений

#### Аналитика

- ✅ Dashboard с KPI
- ✅ Графики (Recharts)
- ✅ PDF экспорт отчётов
- ✅ Excel/CSV экспорт
- ✅ Календарь дедлайнов
- ✅ Timeline проектов

#### Коммуникации

- ✅ Email уведомления (NodeMailer)
- ✅ Сброс пароля
- ✅ Приветственные письма
- ✅ Уведомления о дедлайнах

#### Дополнительно

- ✅ Admin Panel (управление пользователями)
- ✅ Global Search (Ctrl+K)
- ✅ User Profile
- ✅ Регистрация новых пользователей

### 🔒 Безопасность

- 🔴 Исправлены 4 критические уязвимости JWT secrets
- ✅ Rate limiting для авторизации (5 попыток / 15 минут)
- ✅ Проверка заблокированных аккаунтов
- ✅ Усиленные требования к паролям:
  - Минимум 12 символов
  - Заглавные + строчные буквы
  - Цифры + специальные символы
- ✅ Bcrypt для хэширования паролей (cost: 12)
- ✅ Валидация всех env переменных при старте

### ⚡ Производительность

- ✅ Minification production build (Terser)
- ✅ Code splitting (vendor chunks)
- ✅ Индексы БД для частых запросов
- ✅ Кэширование статики в PWA
- ✅ Lazy loading компонентов

### 🛠️ Инфраструктура

- ✅ Docker Compose (4 сервиса)
- ✅ PostgreSQL 16
- ✅ Nginx для frontend
- ✅ Health checks всех контейнеров
- ✅ Volume для uploads

### 📝 Документация

- ✅ README.md
- ✅ .cursorrules для AI
- ✅ API документация (inline)
- ✅ Prisma schema с комментариями

---

## [Unreleased]

### 🚧 В разработке

- 📊 Расширенная аналитика
- 🔔 Notifications Center
- 📋 Activity Log
- 🎨 Project Templates

### 🔮 Планируется

- 🤖 AI ассистент
- 📱 Mobile приложение
- 🔗 Интеграции (Telegram, 1С)
- 🌐 Мультиязычность (EN/RU)
- 🔐 2FA авторизация
- 💾 Redis кэширование

---

## Легенда

- ✅ Реализовано
- 🚧 В разработке
- 🔮 Запланировано
- 🔴 Критическое исправление
- 🔒 Безопасность
- ⚡ Производительность
- 🐛 Исправление бага
