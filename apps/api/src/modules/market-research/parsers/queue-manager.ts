/**
 * Queue Manager - упрощенная версия без внешних зависимостей
 */
import { logger } from '../../../utils/logger';

interface QueueConfig {
  concurrency: number;
}

const COUNTRY_CONFIGS: Record<string, QueueConfig> = {
  'BY': { concurrency: 1 },  // Только 1 запрос за раз
  'RU': { concurrency: 1 },
  'KZ': { concurrency: 1 },
  'default': { concurrency: 1 }
};

export class QueueManager {
  private running = new Map<string, number>();
  private static instance: QueueManager;

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async add<T>(country: string, task: () => Promise<T>): Promise<T> {
    const config = COUNTRY_CONFIGS[country] ?? COUNTRY_CONFIGS['default']!;
    
    // Ждем пока освободится слот
    while ((this.running.get(country) || 0) >= config!.concurrency) {
      await new Promise(r => setTimeout(r, 100));
    }

    this.running.set(country, (this.running.get(country) || 0) + 1);
    
    logger.debug({ country, running: this.running.get(country) }, 'Task start');
    
    try {
      const result = await task();
      return result;
    } finally {
      this.running.set(country, (this.running.get(country) || 1) - 1);
      logger.debug({ country, running: this.running.get(country) }, 'Task done');
    }
  }
}
