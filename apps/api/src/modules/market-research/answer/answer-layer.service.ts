/**
 * Answer Layer Service
 * Превращает сырые результаты поиска в аналитику рынка
 * 
 * Что делает:
 * 1. Сводка по ценам (min, max, avg)
 * 2. Топ производителей
 * 3. География рынка
 * 4. Ключевые выводы
 */

import { logger } from '../../../utils/logger';

interface MarketResult {
  name: string;
  priceRange?: string;
  country?: string;
  source: string;
  score: number;
  sourceUrl: string;
}

export interface MarketAnalysis {
  summary: {
    totalFound: number;
    avgScore: number;
    priceRange?: {
      min: number;
      max: number;
      avg: number;
      currency: string;
    };
  };
  topSuppliers: Array<{
    name: string;
    country?: string;
    price?: string;
    score: number;
    url: string;
  }>;
  geography: Record<string, number>;
  priceSegments: {
    budget: number;    // < 1000 BYN
    mid: number;       // 1000-5000 BYN
    premium: number;   // > 5000 BYN
    unknown: number;
  };
  insights: string[];
}

/**
 * Извлечь число из строки цены
 */
function extractPrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  
  // Ищем числа (с пробелами как разделителями тысяч)
  const match = priceStr.replace(/\s/g, '').match(/(\d+[.,]?\d*)/);
  if (match?.[1]) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return null;
}

/**
 * Определить валюту
 */
function detectCurrency(priceStr?: string): string {
  if (!priceStr) return 'unknown';
  
  const lower = priceStr.toLowerCase();
  if (lower.includes('руб') || lower.includes('byn') || lower.includes('р.')) return 'BYN';
  if (lower.includes('$') || lower.includes('usd')) return 'USD';
  if (lower.includes('€') || lower.includes('eur')) return 'EUR';
  
  return 'unknown';
}

/**
 * Главная функция анализа рынка
 */
export function analyzeMarket(
  results: MarketResult[],
  query: string
): MarketAnalysis {
  logger.info({ query, resultCount: results.length }, 'Analyzing market');
  
  // 1. Сводка по ценам
  const prices: number[] = [];
  const currencies: string[] = [];
  
  for (const r of results) {
    if (r.priceRange) {
      const price = extractPrice(r.priceRange);
      if (price && price > 100) { // Фильтруем явный мусор (< 100)
        prices.push(price);
        currencies.push(detectCurrency(r.priceRange));
      }
    }
  }
  
  const priceStats = prices.length > 0 ? {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    currency: currencies.find(c => c !== 'unknown') || 'BYN',
  } : undefined;
  
  // 2. Топ производителей (топ-5 по score)
  const topSuppliers = results
    .slice(0, 5)
    .map(r => ({
      name: r.name.slice(0, 60),
      country: r.country,
      price: r.priceRange,
      score: r.score,
      url: r.sourceUrl,
    }));
  
  // 3. География рынка
  const geography: Record<string, number> = {};
  for (const r of results) {
    const country = r.country || 'Unknown';
    geography[country] = (geography[country] || 0) + 1;
  }
  
  // 4. Ценовые сегменты
  const priceSegments = { budget: 0, mid: 0, premium: 0, unknown: 0 };
  
  if (priceStats) {
    for (const price of prices) {
      if (price < 1000) priceSegments.budget++;
      else if (price <= 5000) priceSegments.mid++;
      else priceSegments.premium++;
    }
  }
  priceSegments.unknown = results.length - prices.length;
  
  // 5. Ключевые выводы (insights)
  const insights: string[] = [];
  
  if (priceStats) {
    insights.push(`Цены на рынке: от ${priceStats.min} до ${priceStats.max} ${priceStats.currency} (средняя ${priceStats.avg})`);
    
    if (priceSegments.premium > priceSegments.budget) {
      insights.push('Рынок ориентирован на премиум-сегмент');
    } else if (priceSegments.budget > priceSegments.premium) {
      insights.push('Доминирует бюджетный сегмент');
    } else {
      insights.push('Сбалансированное распределение по ценовым сегментам');
    }
  }
  
  // География
  const countries = Object.entries(geography)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (countries.length > 0) {
    insights.push(`Основные страны-производители: ${countries.map(c => c[0]).join(', ')}`);
  }
  
  // Источники
  const b2bCount = results.filter(r => 
    r.source.includes('deal.by') || 
    r.source.includes('faraont')
  ).length;
  
  if (b2bCount > results.length / 2) {
    insights.push('Большинство предложений — от официальных поставщиков (B2B)');
  }
  
  // Качество результатов
  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  if (avgScore > 70) {
    insights.push('Высокое качество результатов — найдены проверенные поставщики');
  } else if (avgScore < 40) {
    insights.push('Рекомендуется уточнить запрос — мало точных совпадений');
  }
  
  logger.info({ 
    query, 
    priceStats, 
    topSuppliers: topSuppliers.length,
    insights: insights.length 
  }, 'Market analysis completed');
  
  return {
    summary: {
      totalFound: results.length,
      avgScore,
      priceRange: priceStats,
    },
    topSuppliers,
    geography,
    priceSegments,
    insights,
  };
}

/**
 * Генерация summary для UI (короткий текст)
 */
export function generateSummary(analysis: MarketAnalysis, query: string): string {
  const parts: string[] = [];
  
  parts.push(`Найдено ${analysis.summary.totalFound} поставщиков «${query}»`);
  
  if (analysis.summary.priceRange) {
    const { min, max, avg, currency } = analysis.summary.priceRange;
    parts.push(`Цены: ${min}-${max} ${currency} (средняя ${avg})`);
  }
  
  if (analysis.topSuppliers.length > 0 && analysis.topSuppliers[0]?.name) {
    parts.push(`Топ: ${analysis.topSuppliers[0].name.slice(0, 40)}...`);
  }
  
  return parts.join('. ');
}
