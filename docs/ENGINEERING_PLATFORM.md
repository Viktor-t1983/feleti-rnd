# FELETI Engineering Platform v1.0

## 🎯 Обзор

Enterprise-grade инженерная платформа для управления R&D проектами.

## 🏗️ Архитектура

### Ключевые компоненты

1. **Product Classes** - Классы продуктов
2. **Engineering Rules** - Правила и проверки
3. **Validation Gates** - Контрольные точки
4. **Calculation Blocks** - Расчётные блоки
5. **Knowledge Graph** - Граф знаний
6. **AI Agents** - DeepSeek интеграция

## 📊 Структура данных

### Product Class

- Типовые требования
- Расчётные блоки
- Validation критерии
- KPI метрики

### Engineering Rule

- Условия (DSL)
- Уровень риска
- Действие (WARN/BLOCK)
- Рекомендации

### Validation Gate

- Критерии прохождения
- Passing score
- Блокировка/Waiver

### Calculation Block

- Input/Output схемы
- Формулы (JS expressions)
- Валидация результатов

## 🚀 Использование

### Создание Product Class

```typescript
POST /api/product-classes
{
  "code": "NEW_CLASS",
  "name": "Новый класс",
  "category": "processing"
}
```

### Выполнение расчёта

```typescript
POST /api/calculations/execute
{
  "projectId": "...",
  "blockCode": "THERM-HEAT-BALANCE",
  "inputs": {
    "volume": 5,
    "targetTemp": 80
  }
}
```

### Валидация Gate

```typescript
POST /api/validation/gates/GATE-1/validate
{
  "projectId": "..."
}
```

### AI Запрос

```typescript
POST /api/ai/agents/execute
{
  "agentType": "ARCHITECTURE",
  "projectId": "...",
  "query": "Какие варианты архитектуры?"
}
```

## 🔧 API Endpoints

### Product Classes

- `GET /api/product-classes` - Список
- `GET /api/product-classes/:id` - Детали
- `POST /api/product-classes` - Создать (Admin)

### Rules

- `GET /api/rules` - Список правил
- `POST /api/rules/evaluate` - Оценить
- `GET /api/rules/blockers/:projectId` - Blockers

### Gates

- `GET /api/validation/gates` - Список
- `POST /api/validation/gates/:code/validate` - Валидация
- `GET /api/validation/projects/:id/status` - Статус

### Calculations

- `GET /api/calculations/blocks` - Блоки
- `POST /api/calculations/execute` - Выполнить

### Knowledge Graph

- `POST /api/knowledge/nodes` - Создать узел
- `POST /api/knowledge/relations` - Создать связь
- `POST /api/knowledge/query` - Запрос к графу

### AI

- `GET /api/ai/status` - Статус AI
- `POST /api/ai/agents/execute` - Запрос к агенту

## 🎨 Frontend

- `/engineering` - Главная
- `/engineering/product-classes` - Product Classes
- `/engineering/rules` - Rules Dashboard
- `/engineering/gates` - Gates (в ProjectDetail)
- `/engineering/calculations` - Calculations

## 🧪 Тестирование

```bash
npm run test
npm run health-check
```

## 📦 Seed Data

```bash
npm run seed:engineering
npm run seed:demo-project
```

## 🔐 Permissions

- **Admin**: Все операции
- **Manager**: Просмотр + создание проектов
- **Member**: Просмотр + работа с назначенными

## 🚀 Deployment

1. Seed данные
2. Health check
3. Integration tests
4. Deploy

## 📚 Дополнительно

- Clean Architecture
- Product-Agnostic Design
- Масштабируемость 5-10 лет
- DeepSeek AI интеграция
- Formula Evaluator (безопасный)
- Rule DSL
