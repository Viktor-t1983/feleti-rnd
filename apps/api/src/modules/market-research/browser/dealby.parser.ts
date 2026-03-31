/**
 * Deal.by Parser (Playwright)
 * Рендеринг JavaScript для получения реальных данных
 */

import { fetchRenderedPage } from './browser.service';
import { executeInQueue } from './browser-queue.service';
import { logger } from '../../../utils/logger';

interface DealByResult {
  name: string;
  url: string;
  price?: string;
  image?: string;
  seller?: string;
}

/**
 * Парсинг поиска deal.by через Playwright (с очередью и кэшем)
 */
export async function parseDealByPlaywright(query: string, maxResults: number = 10): Promise<DealByResult[]> {
  const searchUrl = `https://deal.by/search?search_term=${encodeURIComponent(query)}`;
  const cacheKey = `dealby:${query}`;

  return executeInQueue(
    `deal.by:${query}`,
    async () => {
      logger.info({ query, url: searchUrl }, 'Parsing deal.by with Playwright');

      const { html } = await fetchRenderedPage(searchUrl, {
        waitForSelector: '[data-qaid="product_name"], .product-card, [data-testid="product-item"]',
        waitForTimeout: 3000,
      });

    // Извлекаем данные через regex (быстро, не требует cheerio)
    const results: DealByResult[] = [];

    // Паттерн 1: data-qaid="product_name"
    const pattern1 = /<a[^>]+data-qaid="product_name"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = pattern1.exec(html)) !== null && results.length < maxResults) {
      const url = match[1];
      const name = match[2]?.trim();

      if (url && name && name.length > 3) {
        results.push({
          name: cleanText(name),
          url: url.startsWith('http') ? url : `https://deal.by${url}`,
        });
      }
    }

    // Паттерн 2: product-card (альтернативная структура)
    if (results.length === 0) {
      const pattern2 = /<div[^>]+class="[^"]*product-card[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

      while ((match = pattern2.exec(html)) !== null && results.length < maxResults) {
        const url = match[1];
        const name = match[2]?.trim();

        if (url && name) {
          results.push({
            name: cleanText(name),
            url: url.startsWith('http') ? url : `https://deal.by${url}`,
          });
        }
      }
    }

    // Паттерн 3: data-testid (новый React)
    if (results.length === 0) {
      const pattern3 = /<a[^>]+data-testid="product-item-link"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

      while ((match = pattern3.exec(html)) !== null && results.length < maxResults) {
        const url = match[1];
        const name = match[2]?.trim();

        if (url && name) {
          results.push({
            name: cleanText(name),
            url: url.startsWith('http') ? url : `https://deal.by${url}`,
          });
        }
      }
    }

      logger.info({ query, found: results.length }, 'deal.by Playwright parsing completed');
      return results;
    },
    { cacheKey, timeout: 25000 } // 25 сек timeout
  );
}

/**
 * Fallback метод: извлечение через простой HTTP запрос
 * (если Playwright не сработал)
 */
export async function parseDealByHttpFallback(_query: string, _maxResults: number = 10): Promise<DealByResult[]> {
  // Простой HTTP fallback - реализовать если нужно
  return [];
}

function cleanText(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}
