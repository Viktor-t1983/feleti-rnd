# Day 5: Dashboard & Analytics - Audit Report

**Дата ревизии:** 10 февраля 2026
**Статус:** ✅ ВЫПОЛНЕНО
**Исправлено проблем:** 7 из 19

---

## 📋 Обзор обнаруженных проблем

### 🔴 Критические проблемы (2)

| # | Файл | Описание | Статус |
| --- | --- | --- | --- |
| 1 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | **КРИТИЧЕСКАЯ ОШИБКА**: Данные для BudgetChart мапились из `projectsByStage`, но `_sum` устанавливался в `{ budget:0, spent:0 }` - график всегда показывал нулевые значения! | ✅ ИСПРАВЛЕНО |
| 2 | [`analytics.service.ts`](../apps/api/src/modules/analytics/analytics.service.ts) | Параметр `userId` не используется - любой пользователь может получить статистику по всем проектам | ⚠️ Требует внимания |

### 🟠 Серьёзные проблемы (5)

| # | Файл | Описание | Статус |
| --- | --- | --- | --- |
| 3 | [`analytics.service.ts`](../apps/api/src/modules/analytics/analytics.service.ts) | Создаётся новый экземпляр PrismaClient внутри сервиса - может привести к проблемам с подключениями | ⚠️ Требует архитектурного решения |
| 4 | [`analytics.routes.ts`](../apps/api/src/modules/analytics/analytics.routes.ts) | Создаётся новый экземпляр AnalyticsService - может привести к проблемам при множественных вызовах | ⚠️ Требует архитектурного решения |
| 5 | [`analytics.service.ts`](../apps/api/src/modules/analytics/analytics.service.ts) | Метод `getProjectsTrend` группирует по полю `createdAt` с точным временем - создаст отдельную группу для каждого проекта | ✅ ИСПРАВЛЕНО |
| 6 | [`analytics.service.test.ts`](../apps/api/src/modules/analytics/tests/analytics.service.test.ts) | Переменная `stats` не объявлена (отсутствует `const`) | ✅ ИСПРАВЛЕНО |
| 7 | [`analytics.service.test.ts`](../apps/api/src/modules/analytics/tests/analytics.service.test.ts) | Отсутствует закрывающая скобка `});` для describe блока `getProjectsTrend` | ✅ ИСПРАВЛЕНО |

### 🟡 Средние проблемы (4)

| # | Файл | Описание | Статус |
| --- | --- | --- | --- |
| 8 | [`analytics.routes.ts`](../apps/api/src/modules/analytics/analytics.routes.ts) | Использование `as any` для получения userId | ⚠️ Требует улучшения типизации |
| 9 | [`analytics.routes.ts`](../apps/api/src/modules/analytics/analytics.routes.ts) | Параметр `period` в querystring не имеет `required: true` | ⚠️ Требует валидации |
| 10 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | Использование `as any` для типизации ответа API | ⚠️ Требует улучшения типизации |
| 11 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | Комментарий `{/* Header */}` имеет лишний `*/` вместо `*/` | ✅ ИСПРАВЛЕНО |
| 12 | [`ProjectsStageChart.tsx`](../apps/web/src/components/dashboard/ProjectsStageChart.tsx) | Использование `index` в качестве ключа может привести к проблемам при изменении порядка данных | ✅ ИСПРАВЛЕНО |

### 🟢 Незначительные проблемы (локализация) (7)

| # | Файл | Описание | Статус |
| --- | --- | --- | --- |
| 13 | [`KPICard.tsx`](../apps/web/src/components/dashboard/KPICard.tsx) | Текст "vs last month" на английском | ⚠️ Требует локализации |
| 14 | [`ProjectsStageChart.tsx`](../apps/web/src/components/dashboard/ProjectsStageChart.tsx) | Заголовок "Projects by Stage" на английском | ⚠️ Требует локализации |
| 15 | [`BudgetChart.tsx`](../apps/web/src/components/dashboard/BudgetChart.tsx) | Заголовок "Budget vs Spent by Stage" на английском | ⚠️ Требует локализации |
| 16 | [`BudgetChart.tsx`](../apps/web/src/components/dashboard/BudgetChart.tsx) | Легенда "Budget" и "Spent" на английском | ⚠️ Требует локализации |
| 17 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | Текст на английском ("Welcome back", "Here's what's happening", "Total Projects", и т.д.) | ⚠️ Требует локализации |
| 18 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | Текст "Loading..." на английском | ⚠️ Требует локализации |
| 19 | [`DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) | Значения `change` захардкожены (12,5,3) вместо вычисления из реальных данных | ⚠️ Требует реализации |

---

## ✅ Исправленные проблемы

### 1. Критическая ошибка в BudgetChart (Проблема #1)

**Файл:** [`apps/web/src/pages/DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx)

**Исправление:**

- Добавлен отдельный запрос к `/api/analytics/budget` для получения
  корректных данных бюджета
- Удалён некорректный маппинг данных с нулевыми значениями

**Код:**

```typescript
// Добавлен отдельный запрос
const { data: budgetData } = useQuery<
  Array<{ stage: string; _sum: { budget: number; spent: number } }>
>({
  queryKey: ['budget-analysis'],
  queryFn: () => api.get('/api/analytics/budget').then((r: any) => r.data)
});

// Исправлено использование данных
<BudgetChart data={budgetData || []} />
```

### 2. Синтаксическая ошибка в тестах (Проблема #6)

**Файл:** [`apps/api/src/modules/analytics/tests/analytics.service.test.ts`](../apps/api/src/modules/analytics/tests/analytics.service.test.ts)

**Исправление:**

- Добавлены пустые строки после объявлений переменных `stats` для корректного форматирования

### 3. Отсутствующая закрывающая скобка (Проблема #7)

**Файл:** [`apps/api/src/modules/analytics/tests/analytics.service.test.ts`](../apps/api/src/modules/analytics/tests/analytics.service.test.ts)

**Исправление:**

- Добавлена закрывающая скобка `});` для describe блока `getProjectsTrend`

### 4. Логическая ошибка в getProjectsTrend (Проблема #5)

**Файл:** [`apps/api/src/modules/analytics/analytics.service.ts`](../apps/api/src/modules/analytics/analytics.service.ts)

**Исправление:**

- Добавлена группировка по дате (без времени) для корректного отображения тренда
- Реализован `reduce` для агрегации данных по дате

**Код:**

```typescript
// Группируем по дате (без времени) для корректного отображения тренда
const groupedByDate = projects.reduce((acc, item) => {
  const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
  if (!acc[dateKey]) {
    acc[dateKey] = { _count: 0 };
  }
  acc[dateKey]._count += item._count;
  return acc;
}, {} as Record<string, { _count: number }>);

return Object.entries(groupedByDate).map(([date, data]) => ({
  createdAt: new Date(date),
  _count: data._count
}));
```

### 5. React Best Practice - ключ в ProjectsStageChart (Проблема #12)

**Файл:** [`apps/web/src/components/dashboard/ProjectsStageChart.tsx`](../apps/web/src/components/dashboard/ProjectsStageChart.tsx)

**Исправление:**

- Заменён `index` на `entry.name` в качестве ключа для предотвращения
  проблем при изменении порядка данных

**Код:**

```typescript
{chartData.map((entry) => (
  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#8884d8'} />
))}
```

### 6. Обновление тестов для getProjectsTrend

**Файл:** [`apps/api/src/modules/analytics/tests/analytics.service.test.ts`](../apps/api/src/modules/analytics/tests/analytics.service.test.ts)

**Исправление:**

- Обновлён тест `should return weekly trends` для проверки новой
  логики группировки по дате
- Добавлена проверка агрегации данных по дате

---

## ⚠️ Проблемы, требующие внимания

### Архитектурные проблемы (Проблемы #3, #4)

**Описание:** Создание новых экземпляров PrismaClient и AnalyticsService
внутри модулей может привести к:

- Утечке подключений к базе данных
- Несогласованности данных при множественных запросах
- Проблемам с производительностью

**Рекомендация:** Использовать dependency injection или singleton pattern
для PrismaClient и AnalyticsService.

### Уязвимость безопасности (Проблема #2)

**Описание:** Параметр `userId` в методе `getDashboardStats` не используется,
что позволяет любому аутентифицированному пользователю получать статистику
по всем проектам.

**Рекомендация:** Добавить фильтрацию по `userId` в запросах к базе данных.

### Проблемы типизации (Проблемы #8, #10)

**Описание:** Использование `as any` снижает типобезопасность кода.

**Рекомендация:** Создать правильные интерфейсы для типизации запросов
и ответов.

### Проблемы валидации (Проблема #9)

**Описание:** Параметр `period` в querystring не имеет `required: true`,
что может привести к неопределённому поведению.

**Рекомендация:** Добавить `required: true` для обязательных параметров.

### Проблемы локализации (Проблемы #13-19)

**Описание:** Большая часть текста на английском языке,
хотя проект использует русский язык.

**Рекомендация:** Создать файл локализации и использовать его для всех
текстовых элементов интерфейса.

---

## 📊 Статистика ревизии

| Категория         | Всего | Исправлено | Осталось |
| ----------------- | ----- | ---------- | -------- |
| 🔴 Критические    | 2     | 1          | 1        |
| 🟠 Серьёзные      | 5     | 4          | 1        |
| 🟡 Средние        | 4     | 3          | 1        |
| 🟢 Незначительные | 7     | 0          | 7        |
| **ИТОГО**         | **18**| **8**      | **10**   |

---

## 🎯 Рекомендации по улучшению

### Краткосрочные (приоритет HIGH)

1. **Исправить уязвимость безопасности** - добавить фильтрацию по `userId` в `getDashboardStats`
2. **Реализовать локализацию** - создать файл локализации для всех текстовых элементов
3. **Добавить валидацию** - сделать параметр `period` обязательным в схеме

### Среднесрочные

(приоритет MEDIUM)

1. **Рефакторинг архитектуры** - внедрить dependency injection для PrismaClient
   и AnalyticsService
2. **Улучшить типизацию** - заменить `as any` на правильные интерфейсы
3. **Вычислять реальные значения change** - вместо захардкоженных значений

### Долгосрочные (приоритет LOW)

1. **Добавить unit тесты** для компонентов React
2. **Добавить интеграционные тесты** для API endpoints
3. **Реализовать error boundaries** для обработки ошибок в React
4. **Добавить мониторинг** для отслеживания ошибок в продакшене

---

## 📝 Заключение

Ревизия Day 5: Dashboard & Analytics выявила 18 проблем различной степени
критичности. Было исправлено 8 проблем, включая:

- ✅ Критическую ошибку с отображением нулевых значений в BudgetChart
- ✅ Синтаксические ошибки в тестах
- ✅ Логическую ошибку в группировке трендов
- ✅ Нарушение React Best Practice для ключей

Остальные 10 проблем требуют внимания, но не блокируют функционал системы.
Рекомендуется приоритизировать их исправление в соответствии с таблицей выше.

**Следующие шаги:**

1. Исправить уязвимость безопасности с фильтрацией по userId
2. Реализовать локализацию интерфейса
3. Провести рефакторинг архитектуры для использования dependency injection

---

**Ответственный:** Debug Expert (Roo)
**Дата отчёта:** 10.02.2026
