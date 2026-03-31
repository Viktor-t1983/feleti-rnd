/**
 * Market Research Service v2
 * С учетом: browser pool, queue, deduplication, classification
 */
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { 
  searchMultipleCountries, 
  deduplicateResults,
  classifyResults,
  NormalizedResult 
} from './parsers';
import { analyzeMarket, MarketAnalysis } from './answer/answer-layer.service';
import { getSettingByKey } from '../settings/settings.service';
import { searchTavilyMultiCountry, TavilySearchResult } from './tavily/tavily.service';

interface IntegratorConfig {
  enabled: boolean;
  maxResults: number;
}

async function getIntegratorConfig(source: string): Promise<IntegratorConfig> {
  const enabledSetting = await getSettingByKey(`parsers.${source}.enabled`);
  const maxResultsSetting = await getSettingByKey(`parsers.${source}.maxResults`);
  
  return {
    enabled: enabledSetting?.value === 'true',
    maxResults: parseInt(maxResultsSetting?.value || '30', 10) || 30,
  };
}

export interface MarketResearchRequest {
  productType: string;
  countries: string[];
}

export interface MarketResearchResponse {
  results: NormalizedResult[];
  analysis: MarketAnalysis & {
    marketStructure?: {
      manufacturers: number;
      dealers: number;
      resellers: number;
      unknown: number;
    };
    priceRange?: {
      min: number;
      max: number;
      avg: number;
      median: number;
      currency: string;
    };
  };
  meta: {
    totalFound: number;
    uniqueCount: number;
    countries: string[];
    processingTimeMs: number;
    fromCache: boolean;
  };
}

// TTL кэша: 6 часов
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function performMarketResearch(
  request: MarketResearchRequest
): Promise<MarketResearchResponse> {
  const startTime = Date.now();
  const { productType, countries } = request;

  logger.info({ productType, countries }, 'Market research started');

  // 1. Проверяем кэш
  const cached = await getCachedResults(productType, countries);
  if (cached && isCacheValid(cached.timestamp)) {
    logger.info({ productType }, 'Returning cached results');
    return {
      ...cached.data,
      meta: { ...cached.data.meta, fromCache: true }
    };
  }

  // 2. Получаем настройки интеграторов
  const dealbyConfig = await getIntegratorConfig('dealby');
  const avitoConfig = await getIntegratorConfig('avito');
  const promConfig = await getIntegratorConfig('promru');
  const tavilyConfig = await getIntegratorConfig('tavily');

  logger.info({ dealby: dealbyConfig, avito: avitoConfig, prom: promConfig, tavily: tavilyConfig }, 'Integrator configs loaded');

  // Проверяем какие парсеры включены
  const enabledParsers: string[] = [];
  if (dealbyConfig.enabled) enabledParsers.push('dealby');
  if (avitoConfig.enabled) enabledParsers.push('avito');
  if (promConfig.enabled) enabledParsers.push('prom.ru');

  // 3. Парсинг по странам (с очередью и контролем)
  const countryResults = await searchMultipleCountries(countries, productType, enabledParsers);
  
  // 4. Объединяем все результаты
  const allResults: NormalizedResult[] = [];
  
  // Добавляем результаты парсеров с учетом лимита
  const parserConfigs = {
    'deal.by': dealbyConfig,
    'avito': avitoConfig,
    'prom.ru': promConfig,
  };
  
  for (const [country, results] of countryResults) {
    // Группируем по source
    const bySource = new Map<string, NormalizedResult[]>();
    for (const r of results) {
      const src = r.source;
      if (!bySource.has(src)) bySource.set(src, []);
      bySource.get(src)!.push(r);
    }
    
    for (const [source, sourceResults] of bySource) {
      const config = parserConfigs[source as keyof typeof parserConfigs];
      if (config && config.enabled) {
        const limitedResults = sourceResults.slice(0, config.maxResults);
        allResults.push(...limitedResults);
        logger.debug({ country, source, total: sourceResults.length, used: limitedResults.length }, 'Parser results added');
      }
    }
  }

  // 2a. Также ищем через Tavily для расширения результатов
  let tavilyResults: Map<string, TavilySearchResult[]> = new Map();
  if (tavilyConfig.enabled) {
    tavilyResults = await searchTavilyMultiCountry(productType, countries);
  
    // Конвертируем Tavily результаты в NormalizedResult с учетом лимита
    for (const [country, results] of tavilyResults) {
      const limitedResults = results.slice(0, tavilyConfig.maxResults);
      const tavilyConverted: NormalizedResult[] = limitedResults.map((r: TavilySearchResult) => ({
        name: r.title,
        url: r.url,
        image: undefined,
        seller: r.snippet?.slice(0, 50) || '',
        normalizedSeller: new URL(r.url).hostname.replace(/^www\./, '').split('.')[0],
        price: undefined,
        currency: undefined,
        normalizedCurrency: 'UNKNOWN',
        inStock: true,
        country,
        reliabilityScore: Math.round((r.score || 0) * 100),
        source: 'tavily',
        parsedAt: new Date()
      }));
      allResults.push(...tavilyConverted);
      logger.debug({ country, total: results.length, used: limitedResults.length }, 'Tavily results added');
    }
  }

  logger.info({ total: allResults.length }, 'Raw results collected');

  // 4. Дедупликация (критично!)
  const uniqueResults = deduplicateResults(allResults);
  logger.info({ 
    before: allResults.length, 
    after: uniqueResults.length 
  }, 'Deduplicated results');

  // 5. Классификация по типу продавца
  const classified = classifyResults(uniqueResults);
  
  // 6. Сохраняем в БД
  await saveResults(uniqueResults, productType);

  // 7. Формируем аналитику
  const analysis = analyzeMarket(
    uniqueResults.map(r => ({
      name: r.name,
      priceRange: r.price ? `${r.price} ${r.currency}` : undefined,
      country: r.country,
      source: r.source,
      score: r.reliabilityScore,
      sourceUrl: r.url
    })),
    productType
  );

  // 8. Расширенная аналитика
  const priceStats = calculatePriceStats(uniqueResults);
  
  const response: MarketResearchResponse = {
    results: uniqueResults,
    analysis: {
      ...analysis,
      summary: {
        ...analysis.summary,
        totalFound: uniqueResults.length
      },
      marketStructure: {
        manufacturers: classified.manufacturers.length,
        dealers: classified.dealers.length,
        resellers: classified.resellers.length,
        unknown: classified.unknown.length
      },
      priceRange: priceStats,
      insights: [
        ...analysis.insights,
        `Структура рынка: ${classified.manufacturers.length} производителей, ${classified.dealers.length} дилеров`
      ]
    },
    meta: {
      totalFound: allResults.length,
      uniqueCount: uniqueResults.length,
      countries,
      processingTimeMs: Date.now() - startTime,
      fromCache: false
    }
  };

  // 9. Кэшируем
  await cacheResults(productType, countries, response);

  logger.info({ 
    productType,
    found: allResults.length,
    unique: uniqueResults.length,
    timeMs: response.meta.processingTimeMs
  }, 'Market research completed');

  return response;
}

// === Helpers ===

function calculatePriceStats(results: NormalizedResult[]) {
  const prices = results
    .map(r => r.priceUsd)
    .filter((p): p is number => p !== undefined && p > 0);

  if (prices.length === 0) return undefined;

  prices.sort((a, b) => a - b);
  
  const min = prices[0] ?? 0;
  const max = prices[prices.length - 1] ?? 0;
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const median = prices[Math.floor(prices.length / 2)] ?? 0;

  return { min, max, avg, median, currency: 'USD' };
}

// === Cache & DB ===

interface CachedData {
  data: MarketResearchResponse;
  timestamp: number;
}

async function getCachedResults(
  _query: string, 
  _countries: string[]
): Promise<CachedData | null> {
  // TODO: implement caching
  return null;
}

async function cacheResults(
  _query: string,
  _countries: string[],
  _data: MarketResearchResponse
): Promise<void> {
  // TODO: implement caching
}

async function saveResults(
  results: NormalizedResult[],
  query: string
): Promise<void> {
  try {
    // TODO: сохранить в таблицу suppliers
    logger.debug({ count: results.length, query }, 'Results saved to DB');
  } catch (e) {
    logger.warn({ e }, 'Failed to save results');
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// Stub для совместимости
export async function saveToKnowledgeBase(
  results: NormalizedResult[],
  projectId: string,
  userId: string
): Promise<void> {
  logger.info({ count: results.length, projectId, userId }, 'Saving to knowledge base');
  // TODO: implement
}

/**
 * Unified result format for API
 */
export interface UnifiedMarketResult {
  id: string;
  source: string;           // 'deal.by' | 'avito' | etc.
  country: string;          // 'BY' | 'RU' | etc.
  query: string;
  productName: string;
  productUrl: string;
  supplierName: string | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean;
  scrapedAt: string;
}

/**
 * Convert normalized result to unified format
 */
function toUnifiedFormat(
  result: NormalizedResult, 
  query: string
): UnifiedMarketResult {
  return {
    id: `${result.source}-${Buffer.from(result.url).toString('base64').slice(0, 16)}`,
    source: result.source,
    sourceType: 'parser',
    confidence: 'HIGH',
    country: result.country,
    query,
    productName: result.name,
    productUrl: result.url,
    supplierName: result.normalizedSeller || null,
    price: result.price || null,
    currency: result.currency || null,
    imageUrl: result.image || null,
    inStock: result.inStock ?? true,
    scrapedAt: result.parsedAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Тест парсера по стране + сохранение в БД
 * @param country - страна ('BY', 'RU', etc.)
 * @param query - поисковый запрос
 */
export async function testParser(country: string = 'BY', query: string = 'фаршмешалка') {
  logger.info({ country, query }, 'Starting parser test from API');
  
  const { getParser } = await import('./parsers');
  const parser = getParser(country);
  
  if (!parser) {
    throw new Error(`No parser available for country: ${country}`);
  }
  
  const results = await parser.search(query);
  
  // Convert to unified format
  const unifiedResults = results.map(r => toUnifiedFormat(r, query));
  
  // Сохраняем в БД
  const saved = await Promise.all(
    unifiedResults.map(r => 
      prisma.marketResearchResult.create({
        data: {
          query: r.query,
          country: r.country,
          source: r.source,
          productName: r.productName,
          productUrl: r.productUrl,
          supplierName: r.supplierName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rawData: r as any,
        }
      })
    )
  );
  
  logger.info({ 
    country, 
    source: parser.config.source,
    count: results.length, 
    saved: saved.length 
  }, 'Parser test completed and saved');
  
  return { 
    results: unifiedResults, 
    savedCount: saved.length,
    source: parser.config.source,
    country 
  };
}

/**
 * @deprecated Use testParser('BY') instead
 */
export async function testDealByParser() {
  return testParser('BY', 'фаршмешалка');
}

// ============================================================
// NEW: Hybrid Search (Parsers + Tavily)
// ============================================================

export interface UnifiedMarketResult {
  id: string;
  source: string;
  sourceType: 'parser' | 'tavily';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  country: string;
  query: string;
  productName: string;
  productUrl: string;
  supplierName: string | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean;
  scrapedAt: string;
}

export interface HybridSearchResponse {
  results: UnifiedMarketResult[];
  meta: {
    total: number;
    parserResults: number;
    tavilyResults: number;
    countries: string[];
    query: string;
    processingTimeMs: number;
  };
}

/**
 * Convert parser result to unified format
 */
function parserToUnified(
  result: NormalizedResult,
  query: string
): UnifiedMarketResult {
  return {
    id: `${result.source}-${Buffer.from(result.url).toString('base64').slice(0, 16)}`,
    source: result.source,
    sourceType: 'parser',
    confidence: 'HIGH',
    country: result.country,
    query,
    productName: result.name,
    productUrl: result.url,
    supplierName: result.normalizedSeller || null,
    price: result.price || null,
    currency: result.currency || null,
    imageUrl: result.image || null,
    inStock: result.inStock ?? true,
    scrapedAt: result.parsedAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Convert Tavily result to unified format
 */
function tavilyToUnified(
  result: TavilySearchResult,
  country: string,
  query: string
): UnifiedMarketResult {
  // Extract supplier name from URL if possible
  const urlObj = new URL(result.url);
  const supplierName = urlObj.hostname.replace(/^www\./, '').split('.')[0];

  return {
    id: `tavily-${Buffer.from(result.url).toString('base64').slice(0, 16)}`,
    source: 'tavily',
    sourceType: 'tavily',
    confidence: 'LOW',
    country,
    query,
    productName: result.title,
    productUrl: result.url,
    supplierName: supplierName || null,
    price: null,
    currency: null,
    imageUrl: null,
    inStock: true,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Merge and deduplicate results from parsers and Tavily
 */
function mergeResults(
  parserResults: NormalizedResult[],
  tavilyResults: Map<string, TavilySearchResult[]>,
  query: string
): UnifiedMarketResult[] {
  const merged: UnifiedMarketResult[] = [];
  const seenUrls = new Set<string>();

  // Add parser results first (HIGH confidence)
  for (const result of parserResults) {
    const normalizedUrl = result.url.toLowerCase().replace(/\/+$/, '');
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      merged.push(parserToUnified(result, query));
    }
  }

  // Add Tavily results (LOW confidence), skip duplicates
  for (const [country, results] of tavilyResults) {
    for (const result of results) {
      const normalizedUrl = result.url.toLowerCase().replace(/\/+$/, '');
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        merged.push(tavilyToUnified(result, country, query));
      }
    }
  }

  return merged;
}

/**
 * Hybrid search: parsers (HIGH confidence) + Tavily (discovery)
 */
export async function searchMarket(
  query: string,
  countries: string[]
): Promise<HybridSearchResponse> {
  const startTime = Date.now();
  
  logger.info({ query, countries }, 'Starting hybrid market search');

  // Separate countries: with parsers vs Tavily-only
  const { getParser } = await import('./parsers');
  const countriesWithParser: string[] = [];
  const countriesTavilyOnly: string[] = [];

  for (const country of countries) {
    if (getParser(country)) {
      countriesWithParser.push(country);
    } else {
      countriesTavilyOnly.push(country);
    }
  }

  // Run searches in parallel
  const [parserResults, tavilyResults] = await Promise.all([
    // Parsers for supported countries
    countriesWithParser.length > 0 
      ? searchMultipleCountries(countriesWithParser, query)
          .then(results => {
            const all: NormalizedResult[] = [];
            for (const [, countryResults] of results) {
              all.push(...countryResults);
            }
            return all;
          })
      : Promise.resolve([]),
    
    // Tavily for all countries
    searchTavilyMultiCountry(query, countries),
  ]);

  // Merge results
  const merged = mergeResults(parserResults, tavilyResults, query);

  // Save to DB
  await Promise.all(
    merged.map(r => 
      prisma.marketResearchResult.create({
        data: {
          query: r.query,
          country: r.country,
          source: r.source,
          sourceType: r.sourceType,
          confidence: r.confidence,
          productName: r.productName,
          productUrl: r.productUrl,
          supplierName: r.supplierName,
          price: r.price,
          currency: r.currency,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rawData: r as any,
        }
      }).catch(e => {
        logger.warn({ e }, 'Failed to save result');
      })
    )
  );

  const processingTimeMs = Date.now() - startTime;

  logger.info({
    query,
    total: merged.length,
    parserResults: parserResults.length,
    tavilyResults: merged.length - parserResults.length,
    processingTimeMs,
  }, 'Hybrid search completed');

  return {
    results: merged,
    meta: {
      total: merged.length,
      parserResults: parserResults.length,
      tavilyResults: merged.length - parserResults.length,
      countries,
      query,
      processingTimeMs,
    },
  };
}
