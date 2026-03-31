/**
 * Scoring Service
 * Ранжирование результатов как у Perplexity (алгоритмическое)
 * 
 * Формула:
 * score = relevance * 3 + source_weight * 2 + has_price * 1 + freshness * 1
 */

import { logger } from '../../../utils/logger';

interface ScorableResult {
  name: string;
  description?: string;
  source: string;
  priceRange?: string;
  country?: string;
  sourceUrl: string;
}

interface ScoreBreakdown {
  relevance: number;
  sourceWeight: number;
  hasPrice: number;
  freshness: number;
  penalties: number;
}

// ⚙️ КОНФИГУРАЦИЯ (легко менять для A/B тестов)
const WEIGHTS = {
  RELEVANCE: 3,
  SOURCE: 2,
  PRICE: 1.5,
  FRESHNESS: 1,
};

const PENALTIES = {
  NO_DESCRIPTION: -5,
  SHORT_TITLE: -3,
  SUSPICIOUS_DOMAIN: -10,
};

// Веса источников (B2B выше всего)
const SOURCE_WEIGHTS: Record<string, number> = {
  'deal.by': 10,
  'faraont.by': 9,
  'tgd.by': 8,
  'airhot.by': 7,
  'bth.by': 7,
  'google_via_whoogle': 5,
  'duckduckgo': 3,
  'yandex': 4,
};

/**
 * Рассчитать релевантность результата к запросу
 */
function calculateRelevance(result: ScorableResult, query: string): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  let score = 0;
  
  // Точное совпадение в названии = максимум
  const nameLower = result.name.toLowerCase();
  if (nameLower.includes(queryLower)) {
    score += 10;
  } else {
    // Частичные совпадения слов
    for (const word of queryWords) {
      if (nameLower.includes(word)) {
        score += 3;
      }
    }
  }
  
  // Совпадение в описании
  if (result.description) {
    const descLower = result.description.toLowerCase();
    if (descLower.includes(queryLower)) {
      score += 5;
    } else {
      for (const word of queryWords) {
        if (descLower.includes(word)) {
          score += 1;
        }
      }
    }
  }
  
  // URL содержит ключевое слово (хороший сигнал для SEO)
  const urlLower = result.sourceUrl.toLowerCase();
  for (const word of queryWords) {
    if (urlLower.includes(word)) {
      score += 2;
    }
  }
  
  return Math.min(score, 20); // Макс 20 баллов
}

/**
 * Вес источника (B2B маркетплейсы выше)
 */
function calculateSourceWeight(source: string): number {
  // Прямое совпадение
  if (SOURCE_WEIGHTS[source]) {
    return SOURCE_WEIGHTS[source];
  }
  
  // Проверка по домену в sourceUrl
  for (const [domain, weight] of Object.entries(SOURCE_WEIGHTS)) {
    if (source.includes(domain) || domain.includes(source)) {
      return weight;
    }
  }
  
  return 1; // По умолчанию
}

/**
 * Бонус за наличие цены (коммерческий intent)
 */
function calculatePriceBonus(priceRange?: string): number {
  if (!priceRange) return 0;
  
  const priceStr = priceRange.toLowerCase();
  
  // Есть конкретная цена (цифры)
  if (/\d/.test(priceStr)) {
    return 5;
  }
  
  // Есть упоминание цены
  if (priceStr.includes('руб') || priceStr.includes('usd') || priceStr.includes('eur') || priceStr.includes('бел')) {
    return 3;
  }
  
  return 1;
}

/**
 * Бонус за свежесть (можно добавить позже с timestamp)
 */
function calculateFreshness(): number {
  // Пока все свежие, позже можно добавить timestamp парсинга
  return WEIGHTS.FRESHNESS * 2;
}

/**
 * Штрафы за низкое качество
 */
function calculatePenalties(result: ScorableResult): number {
  let penalty = 0;
  
  // Нет описания
  if (!result.description || result.description.length < 20) {
    penalty += PENALTIES.NO_DESCRIPTION;
  }
  
  // Короткий заголовок
  if (result.name.length < 10) {
    penalty += PENALTIES.SHORT_TITLE;
  }
  
  // Подозрительный домен (спам/аффилиат)
  const suspiciousDomains = ['click', 'track', 'redirect', 'aff'];
  const urlLower = result.sourceUrl.toLowerCase();
  if (suspiciousDomains.some(d => urlLower.includes(d))) {
    penalty += PENALTIES.SUSPICIOUS_DOMAIN;
  }
  
  return penalty;
}

/**
 * Основная функция скоринга
 */
export function scoreResults<T extends ScorableResult>(
  results: T[],
  query: string
): Array<T & { score: number; scoreBreakdown: ScoreBreakdown }> {
  logger.debug({ query, resultCount: results.length }, 'Scoring results');
  
  const scored = results.map(result => {
    const relevance = calculateRelevance(result, query);
    const sourceWeight = calculateSourceWeight(result.source);
    const hasPrice = calculatePriceBonus(result.priceRange);
    const freshness = calculateFreshness();
    const penalties = calculatePenalties(result);
    
    // Финальный score (0-100) с explainability
    const rawScore = 
      relevance * WEIGHTS.RELEVANCE +
      sourceWeight * WEIGHTS.SOURCE +
      hasPrice * WEIGHTS.PRICE +
      freshness +
      penalties;
    
    const score = Math.max(0, Math.min(Math.round(rawScore), 100));
    
    return {
      ...result,
      score,
      scoreBreakdown: {
        relevance: relevance * WEIGHTS.RELEVANCE,
        sourceWeight: sourceWeight * WEIGHTS.SOURCE,
        hasPrice: hasPrice * WEIGHTS.PRICE,
        freshness,
        penalties,
      },
    };
  });
  
  // Сортируем по score (desc)
  scored.sort((a, b) => b.score - a.score);
  
  logger.info({ 
    query, 
    topScore: scored[0]?.score,
    avgScore: Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length),
  }, 'Scoring completed');
  
  return scored;
}

/**
 * Фильтрация нерелевантных результатов
 */
export function filterLowQuality<T extends { score: number }>(
  results: T[],
  minScore: number = 10
): T[] {
  const filtered = results.filter(r => r.score >= minScore);
  logger.debug({ before: results.length, after: filtered.length, minScore }, 'Filtered low quality');
  return filtered;
}

/**
 * Нормализация запроса (для кэша)
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-]/g, '') // Убираем спецсимволы
    .slice(0, 100); // Лимит длины
}

/**
 * Группировка по категориям (для UI)
 */
export function groupBySource<T extends { source: string; score?: number }>(
  results: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {
    'B2B Маркетплейсы': [],
    'Производители': [],
    'Другие источники': [],
  };
  
  for (const result of results) {
    const rscore = (result as unknown as {score?: number}).score ?? 0;
    if (result.source.includes('deal.by') || result.source.includes('faraont')) {
      groups['B2B Маркетплейсы']!.push(result);
    } else if (rscore > 50) {
      groups['Производители']!.push(result);
    } else {
      groups['Другие источники']!.push(result);
    }
  }
  
  return groups;
}
