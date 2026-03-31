/**
 * Yandex XML Search Provider
 * Для РФ, Беларуси, Казахстана
 * https://yandex.ru/dev/xml/
 */

import { logger } from '../../../utils/logger';
import { getSettingByKey } from '../../settings/settings.service';

interface YandexResult {
  title: string;
  url: string;
  description: string;
}

// Регионы для Яндекса
const REGION_MAP: Record<string, string> = {
  'BY': '157', // Беларусь
  'RU': '225', // Россия
  'KZ': '159', // Казахстан
};

export async function searchYandex(
  query: string,
  country: string,
  maxResults: number = 10
): Promise<YandexResult[]> {
  const apiKey = (await getSettingByKey('yandex.xml_api_key'))?.value;
  const userId = (await getSettingByKey('yandex.xml_user'))?.value;
  
  if (!apiKey || !userId) {
    throw new Error('Yandex XML API not configured');
  }

  try {
    const lr = REGION_MAP[country] ?? '';
    
    // Yandex XML API endpoint
    const url = new URL('https://yandex.com/search/xml/');
    url.searchParams.set('user', userId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('l10n', 'ru');
    url.searchParams.set('sortby', 'rlv'); // По релевантности
    url.searchParams.set('filter', 'none');
    url.searchParams.set('maxpassages', '2');
    url.searchParams.set('page', '0');
    if (lr) url.searchParams.set('lr', lr);

    logger.debug({ query, country, lr }, 'Yandex XML search');

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Yandex HTTP ${response.status}`);
    }

    const xml = await response.text();
    const results = parseYandexXml(xml, maxResults);

    logger.info({ query, country, found: results.length }, 'Yandex search completed');
    return results;

  } catch (error) {
    logger.error({ error, query, country }, 'Yandex search failed');
    throw error;
  }
}

function parseYandexXml(xml: string, maxResults: number): YandexResult[] {
  const results: YandexResult[] = [];
  
  // Простой XML парсинг через regex (для production используйте xml2js)
  const docRegex = /<doc>([\s\S]*?)<\/doc>/gi;
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
  const urlRegex = /<url>([^<]+)<\/url>/i;
  const passageRegex = /<passage>([\s\S]*?)<\/passage>/i;
  
  let match: RegExpExecArray | null;
  while ((match = docRegex.exec(xml)) !== null && results.length < maxResults) {
    const doc = match[1] as string;
    
    const titleMatch = titleRegex.exec(doc);
    const urlMatch = urlRegex.exec(doc);
    const passageMatch = passageRegex.exec(doc);
    
    const title = titleMatch?.[1];
    const url = urlMatch?.[1];
    const passage = passageMatch?.[1];
    
    if (title && url) {
      results.push({
        title: cleanXml(title as string),
        url: cleanXml(url as string),
        description: passage ? cleanXml(passage as string) : '',
      });
    }
  }
  
  return results;
}

function cleanXml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}
