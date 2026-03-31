/**
 * DuckDuckGo Search Provider
 * Бесплатный поиск, работает везде (включая РФ)
 */

import { logger } from '../../../utils/logger';

interface DDGResult {
  title: string;
  url: string;
  description: string;
}

export async function searchDuckDuckGo(
  query: string,
  maxResults: number = 10
): Promise<DDGResult[]> {
  try {
    // Используем DuckDuckGo Lite (более стабильный)
    const url = new URL('https://lite.duckduckgo.com/lite/');
    url.searchParams.set('q', query);
    url.searchParams.set('kl', 'ru-ru');

    logger.debug({ query, url: url.toString() }, 'DuckDuckGo search');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`DDG HTTP ${response.status}`);
    }

    const html = await response.text();
    const results = parseDDGLiteHtml(html, maxResults);

    logger.info({ query, found: results.length }, 'DuckDuckGo search completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'DuckDuckGo search failed');
    throw error;
  }
}

function parseDDGLiteHtml(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];
  
  // Простой парсинг через regex
  const resultRegex = /<a[^>]+class="[^"]*result-link[^"]*"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  
  let match: RegExpExecArray | null;
  const urls: string[] = [];
  const titles: string[] = [];
  
  while ((match = resultRegex.exec(html)) !== null && urls.length < maxResults) {
    const urlMatch = match[1];
    const titleMatch = match[2];
    
    if (urlMatch && titleMatch) {
      let url = urlMatch;
      const title = titleMatch.replace(/<[^>]+>/g, '').trim();
      
      // DuckDuckGo может возвращать редиректы
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = 'https://duckduckgo.com' + url;
      
      urls.push(url);
      titles.push(title);
    }
  }
  
  // Формируем результаты
  for (let i = 0; i < urls.length; i++) {
    results.push({
      title: titles[i] ?? '',
      url: urls[i] ?? '',
      description: '', // DDG Lite не всегда даёт сниппеты
    });
  }

  return results;
}
