# План внедрения: от "работает" до "продакшен"

## Текущее состояние
✅ Whoogle (Google) — 17 результатов, UTF-8 работает
❌ B2B парсеры — 0 результатов (403 ошибки)
⚠️ Нужно: рендеринг JS, кэш, scoring

## Этап 1: Playwright для B2B (День 1-2)

### Зачем:
- deal.by отдаёт пустую страницу без JS
- Playwright рендерит React/Vue = видим данные
- Ожидаемый результат: +15-20 результатов с B2B

### Реализация:
```typescript
// browser.service.ts — универсальный слой
export async function fetchRenderedPage(url: string, selector: string) {
  // Playwright: headless Chrome
  // Ждём selector (карточки товаров)
  // Возвращаем HTML с данными
}
```

### Приоритет сайтов:
1. deal.by (основной)
2. faraont.by (уже есть URL в Whoogle)
3. pulscen.ru (Россия)

## Этап 2: Нормализация данных (День 3)

### Единый формат:
```typescript
interface SearchResult {
  id: string;
  name: string;
  url: string;
  description?: string;
  price?: string;
  country: string;
  source: 'whoogle' | 'dealby' | 'faraont' | 'pulscen';
  confidence: number;
  metadata?: {
    parsedAt: Date;
    retries: number;
  };
}
```

## Этап 3: Scoring (День 4)

### Базовый алгоритм (без AI):
```
score = 
  + title.includes(query) ? 30 : 0
  + description.includes(query) ? 20 : 0
  + source === 'deal.by' ? 20 : 0  // B2B выше
  + url.includes('by') ? 10 : 0    // Локальные выше
  + hasPrice ? 10 : 0              // С ценой выше
  - (daysSinceParse > 7 ? 10 : 0)  // Минус за старость
```

## Этап 4: Кэш + Retry (День 5)

### Redis кэш:
```
key: search:фаршмешалка:BY
value: [results]
TTL: 24 часа
```

### Retry логика:
```
try Whoogle → if fail → try Playwright direct → if fail → use cache
```

## Что НЕ делаем (сейчас):
❌ Ollama/AI scoring — перебор для MVP
❌ AgenticSeek — оверинжениринг
❌ Multi-agent — не нужно

## Целевая метрика:
- Сейчас: 17 результатов, 5 секунд
- После: 30-40 результатов, 1-2 секунды (с кэшем)
