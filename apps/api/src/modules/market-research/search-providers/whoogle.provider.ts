/**
 * Whoogle Provider - Google через прокси
 */

import { logger } from '../../../utils/logger';

export interface WhoogleSearchResult {
  title: string;
  url: string;
  description?: string;
  verifiedAt?: string;
}

/**
 * Поиск через Whoogle (Google proxy)
 * Блокируется Google при частых запросах - используйте с fallback
 */
export async function searchWhoogle(
  query: string,
  maxResults: number = 10
): Promise<WhoogleSearchResult[]> {
  const whoogleUrl = process.env['WHOOGLE_URL'] || 'http://whoogle:5000';
  
  try {
    const url = `${whoogleUrl}/search?q=${encodeURIComponent(query)}&num=${maxResults}`;
    
    logger.debug({ query, url }, 'Whoogle search');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FeletiBot/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Whoogle HTTP ${response.status}: ${text.slice(0, 100)}`);
    }

    const html = await response.text();
    
    // Check if blocked by Google
    if (html.includes('Инстанс ограничен') || html.includes('instance restricted')) {
      throw new Error('Whoogle rate limited by Google');
    }

    const results = parseWhoogleHtml(html, maxResults);
    
    logger.info({ query, found: results.length }, 'Whoogle search completed');
    return results;

  } catch (error) {
    logger.error({ error, query }, 'Whoogle search failed');
    throw error; // Let caller handle fallback
  }
}

function parseWhoogleHtml(html: string, maxResults: number): WhoogleSearchResult[] {
  const results: WhoogleSearchResult[] = [];
  
  // Whoogle возвращает стандартную Google-структуру
  // Ищем result классы
  const resultRegex = /<div[^>]+class="result"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  
  let match: RegExpExecArray | null;
  
  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const resultBlock: string = match[1] ?? '';
    
    // Parse title and URL
    const titleMatch = resultBlock.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    
    const url = titleMatch[1];
    const rawTitle = titleMatch[2];
    
    if (!url || !rawTitle) continue;
    if (url.includes('google.') || url.includes('/preferences')) continue;
    
    // Parse snippet
    const snippetMatch = resultBlock.match(/<div[^>]+class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rawSnippet = snippetMatch?.[1];
    
    const title = cleanHtml(rawTitle);
    const description = rawSnippet ? cleanHtml(rawSnippet) : undefined;
    
    results.push({
      title: title.slice(0, 150),
      url,
      description: description?.slice(0, 300),
    });
  }
  
  return results;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
