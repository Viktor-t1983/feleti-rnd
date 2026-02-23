# Руководство для контрибьюторов

Спасибо за интерес к проекту FELETI R&D! 🎉

## 🚀 Быстрый старт

1. **Клонируй репозиторий:**

```bash
git clone <url>
cd feleti-rnd
```

1. **Установи зависимости:**

```bash
npm install
```

1. **Настрой окружение:**

```bash
cp apps/api/.env.example apps/api/.env
# Отредактируй apps/api/.env
```

1. **Запусти Docker:**

```bash
npm run docker:up
```

1. **Запусти миграции:**

```bash
npm run prisma:migrate
```

1. **Запусти dev серверы:**

```bash
npm run dev
```

## 📝 Стандарты кода

- **Тесты:** TDD подход, пиши тесты ПЕРВЫМИ
- **TypeScript:** Строгий режим
- **Форматирование:** Prettier + ESLint
- **Коммиты:** Conventional Commits

## 🧪 Запуск тестов

```bash
npm run test          # Все тесты
npm run test:api      # Только backend
npm run test:web      # Только frontend
```

## 🐛 Баг репорты

Используй GitHub Issues с меткой `bug`.

## ✨ Новые фичи

1. Создай issue с описанием
2. Дождись одобрения
3. Создай feature branch
4. Сделай PR с тестами

## 📖 Документация

- Обновляй CHANGELOG.md
- Пиши JSDoc для публичных функций
- Обновляй README при необходимости
