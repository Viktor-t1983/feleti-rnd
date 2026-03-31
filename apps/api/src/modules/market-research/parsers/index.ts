/**
 * Parsers Module
 * Фабрика парсеров с очередью и дедупликацией
 */
import { DealByParser } from './by/dealby.parser';
import { AvitoParser } from './ru/avito.parser';
import { PromUaParser } from './ua/promua.parser';
import { BaseParser, NormalizedResult } from './base-parser';
import { QueueManager } from './queue-manager';
import { logger } from '../../../utils/logger';

const parsers: Record<string, new () => BaseParser> = {
  'BY:deal.by': DealByParser,
  'RU:avito': AvitoParser,
  'RU:prom.ru': PromUaParser,
  // 'KZ:satu': SatuParser,        // TODO
};

/**
 * Get parser by country and optional source
 */
export function getParser(country: string, source?: string): BaseParser | null {
  // If source specified - use it
  if (source) {
    const key = `${country}:${source}`;
    if (parsers[key]) {
      return new parsers[key]();
    }
    return null;
  }
  
  // Auto-detect by country
  const countryParsers = Object.entries(parsers)
    .filter(([key]) => key.startsWith(`${country}:`))
    .map(([, ParserClass]) => ParserClass);
  
  const FirstParser = countryParsers[0];
  if (FirstParser) {
    return new FirstParser();
  }
  
  return null;
}

/**
 * Get all available parsers for a country
 */
export function getParsersForCountry(country: string): BaseParser[] {
  return Object.entries(parsers)
    .filter(([key]) => key.startsWith(`${country}:`))
    .map(([, ParserClass]) => new ParserClass());
}

/**
 * Search all sources for a country
 */
export async function searchCountryAllSources(
  country: string,
  query: string
): Promise<NormalizedResult[]> {
  const countryParsers = getParsersForCountry(country);
  
  if (countryParsers.length === 0) {
    logger.warn({ country }, 'No parsers available for country');
    return [];
  }
  
  const queue = QueueManager.getInstance();
  
  // Search all sources in parallel
  const results = await Promise.all(
    countryParsers.map(parser => 
      queue.add(`${country}:${parser.config.source}`, () => parser.search(query))
        .catch(err => {
          logger.error({ err, source: parser.config.source }, 'Parser failed');
          return [];
        })
    )
  );
  
  return results.flat();
}

/**
 * Поиск по стране с очередью (критично!)
 */
export async function searchCountry(
  country: string, 
  query: string,
  source?: string,
  enabledSources?: string[]
): Promise<NormalizedResult[]> {
  const parser = getParser(country, source);
  
  if (!parser) {
    logger.warn({ country, source }, 'No parser available');
    return [];
  }

  if (enabledSources && !enabledSources.includes(parser.config.source)) {
    logger.debug({ country, source: parser.config.source }, 'Parser disabled by settings');
    return [];
  }

  const queue = QueueManager.getInstance();
  
  return queue.add(country, () => parser.search(query));
}

/**
 * Поиск по нескольким странам (параллельно с контролем)
 */
export async function searchMultipleCountries(
  countries: string[],
  query: string,
  enabledSources?: string[]
): Promise<Map<string, NormalizedResult[]>> {
  const results = new Map<string, NormalizedResult[]>();
  
  // Запускаем поиск по всем странам параллельно
  // QueueManager контролирует concurrency внутри каждой страны
  const promises = countries.map(async (country) => {
    try {
      const countryResults = await searchCountry(country, query, undefined, enabledSources);
      results.set(country, countryResults);
    } catch (error) {
      logger.error({ error, country, query }, 'Country search failed');
      results.set(country, []);
    }
  });

  await Promise.all(promises);
  
  return results;
}

/**
 * Дедупликация результатов (критично!)
 */
export function deduplicateResults(results: NormalizedResult[]): NormalizedResult[] {
  const seen = new Map<string, NormalizedResult>();
  
  for (const result of results) {
    // Ключ дедупликации: нормализованный продавец + нормализованное название
    const sellerKey = (result.normalizedSeller || 'unknown').toLowerCase();
    const nameKey = result.name.toLowerCase().replace(/[^\w]/g, '').slice(0, 30);
    const key = `${sellerKey}:${nameKey}`;
    
    if (seen.has(key)) {
      // Если дубликат - оставляем тот, что с большей надежностью или ценой
      const existing = seen.get(key)!;
      if (result.reliabilityScore > existing.reliabilityScore ||
          (result.price && !existing.price)) {
        seen.set(key, result);
      }
    } else {
      seen.set(key, result);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Классификация результатов по типу продавца
 */
export function classifyResults(results: NormalizedResult[]): {
  manufacturers: NormalizedResult[];
  dealers: NormalizedResult[];
  resellers: NormalizedResult[];
  unknown: NormalizedResult[];
} {
  const manufacturers: NormalizedResult[] = [];
  const dealers: NormalizedResult[] = [];
  const resellers: NormalizedResult[] = [];
  const unknown: NormalizedResult[] = [];

  for (const result of results) {
    const nameLower = result.name.toLowerCase();
    
    // Сигналы производителя
    const isManufacturer = 
      nameLower.includes('завод') ||
      nameLower.includes('производств') ||
      nameLower.includes('manufact') ||
      nameLower.includes('factory');

    // Сигналы дилера
    const isDealer =
      nameLower.includes('дилер') ||
      nameLower.includes('официал') ||
      nameLower.includes('dealer') ||
      nameLower.includes('представитель');

    if (isManufacturer) {
      manufacturers.push(result);
    } else if (isDealer) {
      dealers.push(result);
    } else if (!result.normalizedSeller || result.name.length < 20) {
      // Подозрение на перекупа: нет продавца или короткое название
      resellers.push(result);
    } else {
      unknown.push(result);
    }
  }

  return { manufacturers, dealers, resellers, unknown };
}

// Re-exports
export * from './base-parser';
export * from './browser-manager';
export * from './queue-manager';
export * from './utils';
