/**
 * B2B Belarus Provider - обёртка для B2B парсеров
 */

import { logger } from '../../../utils/logger';
import { parseDealBy, parseFaraont, parseTgd } from './b2b-parsers.provider';

export interface B2BBelarusResult {
  name: string;
  description?: string;
  sourceUrl: string;
  country: string;
  source: 'deal_by' | 'faraont_by' | 'tgd_by';
  sourceType: string;
  priceRange?: string;
  verified?: boolean;
}

/**
 * Поиск по белорусским B2B площадкам
 */
export async function searchB2BBelarus(
  query: string,
  sites: string[] = ['deal.by', 'faraont.by']
): Promise<B2BBelarusResult[]> {
  const results: B2BBelarusResult[] = [];
  
  logger.info({ query, sites }, 'Starting B2B Belarus search');
  
  // Parse deal.by
  if (sites.includes('deal.by')) {
    try {
      const dealResults = await parseDealBy(query, 10);
      results.push(...dealResults.map(r => ({
        name: r.name,
        description: r.description,
        sourceUrl: r.url,
        country: 'BY',
        source: 'deal_by' as const,
        sourceType: 'b2b_marketplace',
        priceRange: r.price,
        verified: true,
      })));
      logger.debug({ count: dealResults.length }, 'deal.by results');
    } catch (error) {
      logger.warn({ error }, 'deal.by failed');
    }
  }
  
  // Parse faraont.by
  if (sites.includes('faraont.by')) {
    try {
      const faraontResults = await parseFaraont(query, 5);
      results.push(...faraontResults.map(r => ({
        name: r.name,
        description: r.description,
        sourceUrl: r.url,
        country: 'BY',
        source: 'faraont_by' as const,
        sourceType: 'b2b_marketplace',
        priceRange: r.price,
        verified: true,
      })));
      logger.debug({ count: faraontResults.length }, 'faraont.by results');
    } catch (error) {
      logger.warn({ error }, 'faraont.by failed');
    }
  }
  
  // Parse tgd.by
  if (sites.includes('tgd.by')) {
    try {
      const tgdResults = await parseTgd(query, 5);
      results.push(...tgdResults.map(r => ({
        name: r.name,
        description: r.description,
        sourceUrl: r.url,
        country: 'BY',
        source: 'tgd_by' as const,
        sourceType: 'b2b_marketplace',
        verified: true,
      })));
      logger.debug({ count: tgdResults.length }, 'tgd.by results');
    } catch (error) {
      logger.warn({ error }, 'tgd.by failed');
    }
  }
  
  logger.info({ total: results.length }, 'B2B Belarus search completed');
  return results;
}
