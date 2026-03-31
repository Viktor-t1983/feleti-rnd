/**
 * Browser Queue Service
 * Ограничение concurrency для Playwright (критично для продакшена)
 */

import PQueue from 'p-queue';
import { logger } from '../../../utils/logger';

// Max 2 параллельных браузера ( Playwright тяжёлый)
const BROWSER_QUEUE = new PQueue({ 
  concurrency: 2,
  timeout: 30000 // 30 сек на задачу
});

// In-memory cache (заменить на Redis для продакшена)
const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 часов

interface QueueOptions {
  cacheKey?: string;
  cacheTtl?: number;
  timeout?: number;
}

/**
 * Выполнить задачу в очереди с кэшированием
 */
export async function executeInQueue<T>(
  taskName: string,
  fn: () => Promise<T>,
  options: QueueOptions = {}
): Promise<T> {
  const { cacheKey, cacheTtl = CACHE_TTL_MS, timeout = 30000 } = options;

  // 1. Проверяем кэш
  if (cacheKey) {
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      logger.debug({ taskName, cacheKey }, 'Cache hit');
      return cached.data as T;
    }
  }

  // 2. Ставим в очередь
  logger.debug({ taskName, queueSize: BROWSER_QUEUE.size }, 'Adding to queue');

  const startTime = Date.now();
  
  try {
    const result = await BROWSER_QUEUE.add(
      async () => {
        logger.debug({ taskName }, 'Executing task');
        return await fn();
      },
      { timeout }
    ) as T | undefined;

    const duration = Date.now() - startTime;
    logger.info({ taskName, duration }, 'Task completed');

    // 3. Сохраняем в кэш
    if (cacheKey && result) {
      CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    if (!result) {
      throw new Error('Queue returned undefined');
    }

    return result;
  } catch (error) {
    logger.error({ error, taskName, duration: Date.now() - startTime }, 'Task failed');
    throw error;
  }
}

/**
 * Очистить кэш (для админки)
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of CACHE.keys()) {
      if (key.includes(pattern)) {
        CACHE.delete(key);
      }
    }
  } else {
    CACHE.clear();
  }
  logger.info({ pattern }, 'Cache cleared');
}

/**
 * Получить статистику очереди (для мониторинга)
 */
export function getQueueStats() {
  return {
    pending: BROWSER_QUEUE.pending,
    size: BROWSER_QUEUE.size,
    isPaused: BROWSER_QUEUE.isPaused,
    cacheSize: CACHE.size,
  };
}
