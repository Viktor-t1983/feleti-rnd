/**
 * B2B Parsers Provider
 * Прямой парсинг белорусских B2B площадок
 * Сервер в Беларуси = доступ без ограничений
 */

import { logger } from '../../../utils/logger';

interface B2BResult {
  name: string;
  url: string;
  description?: string;
  price?: string;
  source: string;
}

/**
 * Парсинг deal.by (каталог товаров Беларуси)
 */
export async function parseDealBy(query: string, maxResults: number = 10): Promise<B2BResult[]> {
  try {
    // Deal.by использует русские URLы для поиска
    const encodedQuery = encodeURIComponent(query);
    const url = `https://deal.by/search?search_term=${encodedQuery}`;
    
    logger.debug({ query, url }, 'Parsing deal.by');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://deal.by/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`deal.by HTTP ${response.status}`);
    }

    const html = await response.text();
    const results = parseDealByHtml(html, maxResults);

    logger.info({ query, found: results.length, source: 'deal.by' }, 'deal.by parsing completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'deal.by parsing failed');
    return []; // Fallback: пустой результат, не падаем
  }
}

/**
 * Парсинг faraont.by
 */
export async function parseFaraont(query: string, maxResults: number = 5): Promise<B2BResult[]> {
  try {
    const url = `https://faraont.by/search?query=${encodeURIComponent(query)}`;
    
    logger.debug({ query, url }, 'Parsing faraont.by');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    // Простой парсинг - ищем ссылки на товары
    const results: B2BResult[] = [];
    
    // Regex для поиска карточек товаров
    const productRegex = /<a[^>]+href="([^"]*\/p\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<[^>]+class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]+>/i;
    
    let match: RegExpExecArray | null;
    while ((match = productRegex.exec(html)) !== null && results.length < maxResults) {
      const href = match[1];
      const content = match[2];
      
      if (href && content) {
        const titleMatch = titleRegex.exec(content);
        const title = titleMatch?.[1]?.trim() || 'Товар на faraont.by';
        
        results.push({
          name: cleanText(title),
          url: href.startsWith('http') ? href : `https://faraont.by${href}`,
          source: 'faraont.by',
        });
      }
    }

    logger.info({ query, found: results.length, source: 'faraont.by' }, 'faraont.by parsing completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'faraont.by parsing failed');
    return [];
  }
}

/**
 * Парсинг tgd.by (ТехноГайд)
 */
export async function parseTgd(query: string, maxResults: number = 5): Promise<B2BResult[]> {
  try {
    const url = `https://tgd.by/search?search_term=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const results = parseTgdHtml(html, maxResults);
    
    logger.info({ query, found: results.length, source: 'tgd.by' }, 'tgd.by parsing completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'tgd.by parsing failed');
    return [];
  }
}

// ============ HTML Parsers ============

function parseDealByHtml(html: string, maxResults: number): B2BResult[] {
  const results: B2BResult[] = [];
  
  // Deal.by: ищем data-qaid="product_name" или ссылки на товары
  const productRegex = /<a[^>]+data-qaid="product_name"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  
  let match: RegExpExecArray | null;
  while ((match = productRegex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1];
    const name = match[2]?.trim();
    
    if (url && name && name.length > 3) {
      results.push({
        name: cleanText(name),
        url: url.startsWith('http') ? url : `https://deal.by${url}`,
        source: 'deal.by',
      });
    }
  }
  
  // Если не нашли по data-qaid, пробуем общий поиск ссылок
  if (results.length === 0) {
    const altRegex = /<a[^>]+href="(\/g\d+[^"]*)"[^>]*>([^<]{10,100})<\/a>/gi;
    while ((match = altRegex.exec(html)) !== null && results.length < maxResults) {
      const url = match[1];
      const name = match[2]?.trim();
      if (url && name) {
        results.push({
          name: cleanText(name),
          url: `https://deal.by${url}`,
          source: 'deal.by',
        });
      }
    }
  }
  
  return results;
}

function parseTgdHtml(html: string, maxResults: number): B2BResult[] {
  const results: B2BResult[] = [];
  
  // Ищем карточки товаров
  const regex = /<a[^>]+href="(\/g\d+[^"]*)"[^>]*>([^<]{10,200})<\/a>/gi;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1];
    const name = match[2]?.trim();
    
    if (url && name) {
      results.push({
        name: cleanText(name),
        url: `https://tgd.by${url}`,
        source: 'tgd.by',
      });
    }
  }
  
  return results;
}

// ============ Helpers ============

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
