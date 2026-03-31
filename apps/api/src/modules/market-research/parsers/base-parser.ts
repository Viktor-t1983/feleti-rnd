/**
 * Базовый класс для всех парсеров
 * С учетом: retry, circuit breaker, normalization
 */
import { Page } from 'playwright';
import { logger } from '../../../utils/logger';
import { withRetry, CircuitBreaker, normalizeCompany, normalizeCurrency } from './utils';

export interface RawResult {
  name: string;
  price?: number;
  currency?: string;
  url: string;
  image?: string;
  seller?: string;
  location?: string;
  category?: string;
  description?: string;
  inStock?: boolean;
}

export interface NormalizedResult extends RawResult {
  normalizedSeller?: string;
  normalizedCurrency: string;
  priceUsd?: number;
  source: string;
  country: string;
  parsedAt: Date;
  reliabilityScore: number; // 0-100
}

export interface ParserConfig {
  country: string;
  source: string;
  baseUrl: string;
  delay: number;
  maxResults: number;
  retryOptions?: {
    retries: number;
    delay: number;
  };
}

export abstract class BaseParser {
  protected circuitBreaker: CircuitBreaker;
  readonly config: ParserConfig;
  
  constructor(config: ParserConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config.source);
  }

  /**
   * Основной метод поиска с retry и circuit breaker
   */
  async search(query: string): Promise<NormalizedResult[]> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(
        () => this.doSearch(query),
        {
          retries: this.config.retryOptions?.retries || 3,
          delay: this.config.retryOptions?.delay || 2000,
          backoff: 'exponential',
          onRetry: (error, attempt) => {
            logger.warn({ 
              source: this.config.source, 
              query, 
              attempt, 
              error: error.message 
            }, 'Parser retry');
          }
        }
      );
    });
  }

  protected abstract doSearch(query: string): Promise<NormalizedResult[]>;

  /**
   * Нормализация результата (критично!)
   */
  protected normalize(raw: RawResult): NormalizedResult {
    const normalizedSeller = normalizeCompany(raw.seller);
    const normalizedCurrency = normalizeCurrency(raw.currency);
    
    // Простая эвристика надежности
    let reliabilityScore = 50;
    if (raw.price) reliabilityScore += 20;
    if (normalizedSeller) reliabilityScore += 15;
    if (raw.description && raw.description.length > 50) reliabilityScore += 10;
    if (raw.inStock !== undefined) reliabilityScore += 5;

    return {
      ...raw,
      normalizedSeller,
      normalizedCurrency,
      source: this.config.source,
      country: this.config.country,
      parsedAt: new Date(),
      reliabilityScore: Math.min(reliabilityScore, 100),
      // Конвертация в USD (упрощенная, потом можно добавить API курсов)
      priceUsd: this.convertToUsd(raw.price, normalizedCurrency)
    };
  }

  protected convertToUsd(price?: number, currency?: string): number | undefined {
    if (!price || !currency) return undefined;
    
    const rates: Record<string, number> = {
      'USD': 1,
      'EUR': 1.08,
      'BYN': 0.31,
      'RUB': 0.011,
      'KZT': 0.0022
    };

    return Math.round(price * (rates[currency] || 1));
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Безопасное извлечение текста с fallback селекторами
   */
  protected async safeGetText(
    page: Page,
    selectors: string[],
    defaultValue = ''
  ): Promise<string> {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (e) {
        // Пробуем следующий селектор
      }
    }
    return defaultValue;
  }

  /**
   * Безопасное извлечение атрибута
   */
  protected async safeGetAttribute(
    page: Page,
    selectors: string[],
    attribute: string,
    defaultValue = ''
  ): Promise<string> {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const value = await element.getAttribute(attribute);
          if (value) {
            return value;
          }
        }
      } catch (e) {
        // Пробуем следующий селектор
      }
    }
    return defaultValue;
  }
}
