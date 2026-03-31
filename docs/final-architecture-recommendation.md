# Финальная рекомендуемая архитектура поиска
## На основе анализа GitHub + реальные ограничения

## 1. Текущая ситуация

### ✅ Что работает (сервер в Беларуси):
- **Whoogle** (Google proxy) — работает, но UTF-8 баг
- **B2B парсеры** — deal.by, faraont.by (ограниченно)

### ❌ Проблемы:
- SearxNG — UTF-8 баг (кракозябры)
- B2B сайты защищаются от простых парсеров (403 ошибки)
- Нет рендеринга JavaScript

## 2. Рекомендуемое решение: Playwright + Whoogle

### Архитектура:

```
Запрос пользователя
    ↓
Приоритет 1: Playwright + B2B (рендеринг JS)
├── deal.by (через headless Chrome)
├── faraont.by
└── airhot.by
    ↓
Приоритет 2: Whoogle (Google из Беларуси)
├── Общий поиск
└── Дополнение результатов
    ↓
Приоритет 3: DuckDuckGo (fallback)
    ↓
Дедупликация → 30 результатов
```

### Почему Playwright:

| Функция | Польза |
|---------|--------|
| Рендеринг JS | Современные B2B сайты работают на React/Vue |
| Полный DOM | Доступ к данным после загрузки AJAX |
| Скриншоты | Отладка, проверка что загрузилось |
| Куки/сессии | Обход простой защиты |

## 3. Реализация Playwright парсера

```typescript
// playwright.parser.ts
import { chromium } from 'playwright';

export async function parseWithPlaywright(url: string, selector: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Маскируем под реальный браузер
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Ждём загрузки контента
  await page.waitForSelector(selector, { timeout: 10000 });
  
  const results = await page.evaluate((sel) => {
    const items = document.querySelectorAll(sel);
    return Array.from(items).map(item => ({
      title: item.textContent,
      url: item.href
    }));
  }, selector);
  
  await browser.close();
  return results;
}
```

## 4. Почему не AgenticSeek / AutoGPT

### AgenticSeek:
- ❌ Использует SearxNG (у нас UTF-8 баг)
- ❌ Сложная архитектура (перебор для задачи)
- ❌ Требует Ollama (много RAM)

### AutoGPT:
- ❌ Требует OpenAI API ($$$)
- ❌ Часто "тупит" (как ты и заметил)

## 5. Оптимальный стек для FELETI

### Сейчас (быстрый запуск):
```yaml
services:
  whoogle:
    image: benbusby/whoogle-search:latest
    # Google для Беларуси (работает)
    
  api:
    build: ./apps/api
    # B2B парсеры + Whoogle + fallback
```

### Доработка (1-2 дня):
```yaml
services:
  whoogle:
    image: benbusby/whoogle-search:latest
    
  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    # Headless Chrome для B2B
    
  api:
    build: ./apps/api
    # Playwright + Whoogle гибрид
```

## 6. Сравнение с твоими рекомендациями

| Твоё решение | Подходит? | Почему |
|--------------|-----------|--------|
| AgenticSeek | ❌ | SearxNG = UTF-8 баг |
| AutoGPT | ❌ | Требует OpenAI API |
| Ollama локально | ⚠️ | Медленно, много RAM |
| **Playwright** | ✅ | Реально решает проблему B2B |
| **Whoogle (BY)** | ✅ | Уже работает |

## 7. Итоговое решение

### Вариант А (минимум усилий, сейчас):
**Whoogle + простые B2B парсеры** (уже работает, но не идеально)

### Вариант Б (рекомендую, 1-2 дня):
**Playwright для B2B + Whoogle для общего поиска**

### Вариант В (если нужен AI-анализ):
**Whoogle/Playwright → Ollama (Saiga) → Структурированный ответ**

---

**Вопрос:** Готовы потратить 1-2 дня на интеграцию Playwright для рендеринга B2B сайтов? Это решит проблему с защитой deal.by и даст стабильные результаты.
