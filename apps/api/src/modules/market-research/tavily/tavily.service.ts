/**
 * Tavily Service - Discovery Layer
 * Широкий поиск по рынку, не замена парсерам
 */
import { logger } from '../../../utils/logger';
import { getSettingByKey } from '../../settings/settings.service';

export interface TavilySearchResult {
  url: string;
  title: string;
  snippet: string;
  score?: number;
}

export interface TavilySearchOptions {
  query: string;
  country?: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

// Country to domain mapping for Tavily
const COUNTRY_DOMAINS: Record<string, string[]> = {
  'BY': ['.by', 'deal.by', 'shop.by'],
  'RU': ['.ru', 'avito.ru', 'ozon.ru', 'wildberries.ru', 'yandex.ru'],
  'KZ': ['.kz', 'kaspi.kz', 'olx.kz'],
  'UA': ['.ua', 'prom.ua', 'rozetka.com.ua'],
};

/**
 * Search using Tavily API
 * Returns broad market discovery results with LOW confidence
 */
export async function searchTavily(
  options: TavilySearchOptions
): Promise<TavilySearchResult[]> {
  const { query, country, maxResults = 30, searchDepth = 'basic' } = options;
  
  const enabledSetting = await getSettingByKey('tavily.enabled');
  const isEnabled = enabledSetting?.value === 'true';
  
  if (!isEnabled) {
    logger.info('Tavily is disabled in settings, skipping search');
    return [];
  }

  const apiKeySetting = await getSettingByKey('tavily.api_key');
  const apiKey = apiKeySetting?.value;
  if (!apiKey) {
    logger.warn('Tavily API key not configured, skipping Tavily search');
    return [];
  }

  // Enhance query with country context
  let enhancedQuery = query;
  if (country) {
    const countryNames: Record<string, string> = {
      'BY': 'Беларусь',
      'RU': 'Россия',
      'KZ': 'Казахстан',
      'UA': 'Украина',
    };
    enhancedQuery = `${query} ${countryNames[country] || country} купить цена`;
  }

  logger.info({ 
    query: enhancedQuery, 
    country, 
    maxResults 
  }, 'Starting Tavily search');

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: enhancedQuery,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Tavily API error');
      return [];
    }

    const data = await response.json() as { results?: any[] };
    
    if (!data.results || !Array.isArray(data.results)) {
      logger.warn('Tavily returned no results');
      return [];
    }

    // Filter by country domain if specified
    let results: TavilySearchResult[] = data.results.map((r: any) => ({
      url: r.url,
      title: r.title || 'Unknown',
      snippet: r.content || r.snippet || '',
      score: r.score,
    }));

    if (country && COUNTRY_DOMAINS[country]) {
      const domains = COUNTRY_DOMAINS[country];
      results = results.filter(r => 
        domains.some(d => r.url.includes(d))
      );
    }

    logger.info({ 
      query, 
      country, 
      found: results.length 
    }, 'Tavily search completed');

    return results.slice(0, maxResults);

  } catch (error) {
    logger.error({ error }, 'Tavily search failed');
    return [];
  }
}

/**
 * Search multiple countries with Tavily
 */
export async function searchTavilyMultiCountry(
  query: string,
  countries: string[]
): Promise<Map<string, TavilySearchResult[]>> {
  const results = new Map<string, TavilySearchResult[]>();
  
  // Search each country in parallel
  const promises = countries.map(async (country) => {
      const countryResults = await searchTavily({ 
      query, 
      country, 
      maxResults: 30 
    });
    results.set(country, countryResults);
  });

  await Promise.all(promises);
  
  return results;
}
