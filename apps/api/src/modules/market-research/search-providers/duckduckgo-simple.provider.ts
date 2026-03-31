/**
 * Simple DuckDuckGo Provider (HTML parsing)
 * Fallback когда Whoogle заблокирован
 * Не требует API ключа, работает через публичный HTML
 */

import { logger } from '../../../utils/logger';

interface DDGResult {
  title: string;
  url: string;
  description: string;
}

/**
 * Поиск через DuckDuckGo Lite (fallback)
 */
export async function searchDuckDuckGoSimple(
  query: string,
  maxResults: number = 10
): Promise<DDGResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}&kl=ru-ru`;
    
    logger.debug({ query, url }, 'DuckDuckGo fallback search');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`DDG HTTP ${response.status}`);
    }

    const html = await response.text();
    const results = parseDDGResults(html, maxResults);

    logger.info({ query, found: results.length }, 'DuckDuckGo fallback completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'DuckDuckGo fallback failed');
    return [];
  }
}

function parseDDGResults(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];
  
  // DDG Lite использует таблицы
  // Ищем таблицы с результатами
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  
  let tableMatch: RegExpExecArray | null;
  let resultTable = '';
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1] ?? '';
    // Ищем таблицу с result-link
    if (tableContent.includes('result-link') || tableContent.includes('uddg=')) {
      resultTable = tableContent;
      break;
    }
  }
  
  if (!resultTable) {
    logger.debug('No results table found in DDG HTML');
    return [];
  }
  
  // Парсим ссылки - формат: //duckduckgo.com/l/?uddg=https%3A%2F%2F...
  const linkRegex = /<a[^>]+href="([^"]+uddg=([^"&]+)[^"]*)"[^>]*>([^<]*)<\/a>/gi;
  
  let linkMatch: RegExpExecArray | null;
  
  while ((linkMatch = linkRegex.exec(resultTable)) !== null && results.length < maxResults) {
    const encodedUrl = linkMatch[2];
    const rawTitle = linkMatch[3];
    
    if (encodedUrl && rawTitle) {
      try {
        // Декодируем URL из DDG редиректа
        const decodedUrl = decodeURIComponent(encodedUrl);
        const title = cleanText(rawTitle);
        
        if (title && decodedUrl.startsWith('http')) {
          results.push({
            title: title.slice(0, 150),
            url: decodedUrl,
            description: '', // DDG Lite не дает сниппеты в этом формате
          });
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
  }
  
  logger.debug({ parsed: results.length }, 'DDG results parsed');
  return results;
}

function cleanText(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
