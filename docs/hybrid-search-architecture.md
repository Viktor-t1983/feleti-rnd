# Гибридная система поиска производителей
## Архитектура для сервера в Беларуси

### Источники (приоритет от высокого к низкому)

```
Приоритет 1: Прямые парсеры B2B (100% точность)
├── deal.by (каталог)
├── faraont.by
├── tgd.by
├── airhot.by
└── pulscen.ru / tiu.ru (для РФ)

Приоритет 2: Whoogle (Google, широкий охват)
├── Общий поиск "производитель Беларусь"
└── Поиск по каталогам

Приоритет 3: DuckDuckGo (fallback)
└── Если Whoogle недоступен
```

### Почему такая приоритизация

| Источник | Точность | Скорость | Покрытие |
|----------|----------|----------|----------|
| Парсеры B2B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Узкое (только каталоги) |
| Whoogle | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Широкое (весь интернет) |
| DDG | ⭐⭐⭐ | ⭐⭐⭐⭐ | Среднее |

**Логика:** Сначала точные результаты с B2B, потом дополняем широким поиском.

---

## Архитектура запроса

```typescript
async function searchEquipment(query: string, countries: string[]) {
  const allResults: Result[] = [];
  
  // 1. Прямые парсеры (для BY/RU/KZ)
  if (countries.includes('BY')) {
    const dealByResults = await parseDealBy(query);
    allResults.push(...dealByResults);
  }
  
  // 2. Whoogle (общий поиск)
  const whoogleResults = await searchWhoogle(query, 15);
  allResults.push(...whoogleResults);
  
  // 3. Дедупликация по домену
  const unique = deduplicateByDomain(allResults);
  
  // 4. Ранжирование: B2B выше, чем общие сайты
  return rankResults(unique).slice(0, 30);
}
```

---

## Парсеры B2B (реализация)

### deal.by
```typescript
// Прямой поиск по каталогу
const url = `https://deal.by/search?search_term=${encodeURIComponent(query)}`;
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept-Language': 'ru-RU,ru;q=0.9',
  }
});
// Парсим карточки товаров → извлекаем название компании, цену, URL
```

### faraont.by
```typescript
// Поиск по сайту
const url = `https://faraont.by/search?query=${encodeURIComponent(query)}`;
// Парсим результаты
```

---

## Обработка результатов

### Дедупликация
```typescript
function deduplicateByDomain(results: Result[]) {
  const seen = new Set<string>();
  return results.filter(r => {
    const domain = new URL(r.url).hostname
      .replace(/^www\./, '')
      .replace(/\.by$/, '')
      .replace(/\.ru$/, '');
    
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}
```

### Ранжирование
```typescript
function rankResults(results: Result[]) {
  return results.sort((a, b) => {
    // B2B площадки выше
    const aIsB2B = /deal\.by|faraont|tgd|pulscen|tiu\.ru/i.test(a.url);
    const bIsB2B = /deal\.by|faraont|tgd|pulscen|tiu\.ru/i.test(b.url);
    
    if (aIsB2B && !bIsB2B) return -1;
    if (!aIsB2B && bIsB2B) return 1;
    
    // По confidence
    return b.confidence - a.confidence;
  });
}
```

---

## Пример результата

Запрос: "фаршмешалка"

```json
{
  "results": [
    {
      "source": "deal.by",
      "name": "ООО Фараон-трейд",
      "url": "https://faraont.by/g499895-farshemeshalki",
      "price": "от 3 597 BYN",
      "confidence": 0.95
    },
    {
      "source": "whoogle",
      "name": "Фаршемешалки Airhot",
      "url": "https://airhot.by/g9104720-farshemeshalki",
      "confidence": 0.8
    },
    {
      "source": "whoogle", 
      "name": "ТехноГайд - фаршемешалки в Минске",
      "url": "https://tgd.by/g9481668-farshemeshalki",
      "confidence": 0.75
    }
  ]
}
```

---

## Инфраструктура (Docker Compose)

```yaml
services:
  whoogle:
    image: benbusby/whoogle-search:latest
    container_name: feleti-whoogle
    ports:
      - '8081:5000'
    environment:
      - WHOOGLE_CONFIG_LANGUAGE=lang_ru
      - WHOOGLE_CONFIG_SEARCH_LANGUAGE=russian
    networks:
      - feleti-network
    restart: unless-stopped

  api:
    build: ./apps/api
    environment:
      - WHOOLE_URL=http://whoogle:5000
      - ENABLE_B2B_PARSERS=true
    depends_on:
      - whoogle
```

---

## Обработка ошибок

| Сценарий | Fallback |
|----------|----------|
| deal.by недоступен | Только Whoogle |
| Whoogle перегружен | DuckDuckGo |
| Оба недоступны | Кэш из БД |
| Новый запрос | Показывать что есть в кэше + "обновляется" |

---

## Мониторинг

```typescript
// Логирование эффективности
logger.info({
  query: "фаршмешалка",
  sources: {
    dealBy: 5,
    whoogle: 12,
    totalUnique: 15
  },
  timing: {
    dealBy: 1200,  // ms
    whoogle: 2800, // ms
    total: 3500
  }
});
```
