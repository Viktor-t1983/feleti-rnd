/**
 * Утилиты для парсеров: retry, circuit breaker, backoff
 */
import { logger } from '../../../utils/logger';

export interface RetryOptions {
  retries?: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential';
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 'exponential', onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === retries) {
        throw lastError;
      }

      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1) 
        : delay;

      logger.warn({ 
        error: lastError.message, 
        attempt, 
        retries, 
        waitTime 
      }, 'Retrying after error');

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      await sleep(waitTime);
    }
  }

  throw lastError!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Circuit Breaker для защиты от постоянных падений
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private name: string,
    private threshold = 5,
    private timeout = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = 'half-open';
        logger.info({ breaker: this.name }, 'Circuit breaker half-open');
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info({ breaker: this.name }, 'Circuit breaker closed');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.error({ breaker: this.name, failures: this.failures }, 'Circuit breaker OPEN');
    }
  }
}

// Нормализация данных
export function normalizeCompany(name?: string): string | undefined {
  if (!name) return undefined;
  
  return name
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^ООО\s+/i, '')
    .replace(/^ИП\s+/i, '')
    // eslint-disable-next-line no-useless-escape
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function normalizeCurrency(currency?: string): string {
  if (!currency) return 'UNKNOWN';
  
  const map: Record<string, string> = {
    'руб': 'BYN',
    'р.': 'BYN',
    'byn': 'BYN',
    '$': 'USD',
    'usd': 'USD',
    '€': 'EUR',
    'eur': 'EUR',
    '₽': 'RUB',
    'руб.': 'RUB'
  };

  return map[currency.toLowerCase()] || currency.toUpperCase();
}

// Fallback селекторы (критично для стабильности)
export async function getTextWithFallback(
  element: any,
  selectors: string[],
  timeout = 5000
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const el = await element.$(selector);
      if (el) {
        const text = await el.textContent({ timeout });
        if (text && text.trim()) {
          return text.trim();
        }
      }
    } catch (e) {
      // Пробуем следующий селектор
    }
  }
  return null;
}
