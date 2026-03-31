# Мульти-поисковая архитектура для FELETI

## Проблема
- Google заблокирован в России
- Whoogle (Google proxy) не работает для пользователей из РФ
- Нужны альтернативные источники

## Архитектура: Fallback Chain

```
Запрос: "фаршмешалка производитель"
         │
         ├─→ Яндекс API ──┐
         │                 ├──→ Агрегация ──→ Дедупликация ──→ 30 результатов
         ├─→ Bing API ────┤
         │                 │
         └─→ DuckDuckGo ──┘
```

## Источники поиска

### 1. Яндекс XML API (приоритет #1 для РФ/Беларуси)
**URL:** https://yandex.ru/dev/xml/
- ✅ Работает в России и Беларуси
- ✅ Отлично индексирует .by и .ru сайты
- ✅ Понимает русский язык
- 💰 Бесплатно: 1000 запросов/сутки
- 💰 Платно: $10 за 10000 запросов

**Настройка:**
```typescript
const yandexResults = await searchYandex({
  query: 'фаршмешалка производитель Беларусь',
  lr: 157, // Регион: Беларусь
  count: 10
});
```

### 2. Bing Web Search API (приоритет #2)
**URL:** https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- ✅ Работает везде
- ✅ Хорош для международных производителей
- ✅ 1000 запросов/мес бесплатно
- 💰 $7 за 1000 запросов

**Настройка:**
```typescript
const bingResults = await searchBing({
  query: 'industrial meat mixer manufacturer',
  mkt: 'ru-RU',
  count: 10
});
```

### 3. DuckDuckGo (fallback)
- ✅ Бесплатно
- ✅ Нет rate limiting
- ❌ Неофициальный API (может сломаться)

### 4. Прямые B2B площадки (специфичные)

| Площадка | URL | Страны |
|----------|-----|--------|
| Deal.by | deal.by | Беларусь |
| Alibaba | alibaba.com | Китай |
| Tiu.ru | tiu.ru | Россия |
| pulscen.ru | pulscen.ru | Россия |

## Имплементация

```typescript
// Multi-search service
export async function searchMultipleSources(
  query: string,
  countries: string[]
): Promise<MarketResearchResult[]> {
  const results: MarketResearchResult[] = [];
  
  // Параллельные запросы ко всем источникам
  const promises = [];
  
  // Яндекс для РФ/Беларуси/Казахстана
  if (countries.some(c => ['RU', 'BY', 'KZ'].includes(c))) {
    promises.push(searchYandex(query, 15));
  }
  
  // Bing для международных
  promises.push(searchBing(query, 10));
  
  // DuckDuckGo как backup
  promises.push(searchDuckDuckGo(query, 10));
  
  const allResults = await Promise.allSettled(promises);
  
  // Агрегация
  allResults.forEach(result => {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    }
  });
  
  // Дедупликация по домену
  return deduplicateByDomain(results).slice(0, 30);
}
```

## Рекомендуемая стратегия

### Бесплатный вариант (для тестирования)
1. **DuckDuckGo** - основной источник
2. **Яндекс XML** - 1000 запросов/сутки (хватит для демо)
3. **Прямые парсеры B2B** - deal.by, pulscen.ru

### Продакшн вариант
1. **Яндекс XML** ($10/мес за 10K запросов) - основной для СНГ
2. **Bing API** ($7/мес) - международные производители
3. **Serper.dev** ($50/мес) - Google для не-РФ пользователей

## Fallback Chain

```
Поиск → Яндекс → (если < 10 результатов) → Bing → (если ошибка) → DuckDuckGo
```

## Преимущества мульти-источников

1. **Отказоустойчивость** - если один упал, работают другие
2. **Полнота** - разные источники = разные результаты
3. **Гео-покрытие** - Яндекс для СНГ, Bing для Европы/США
4. **Не зависим от блокировок**

## Недостатки

1. **Сложнее поддерживать** - 3 API вместо 1
2. **Дедупликация** - нужно убирать дубликаты
3. **Rate limiting** - следить за лимитами каждого API
