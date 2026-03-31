/**
 * Browser Manager - Singleton
 * Критично: один браузер на все запросы
 */
import { chromium, Browser, BrowserContext } from 'playwright';
import { logger } from '../../../utils/logger';

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private isShuttingDown = false;

  private constructor() {
    // Graceful shutdown
    process.on('SIGTERM', () => this.close());
    process.on('SIGINT', () => this.close());
  }

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  async getBrowser(): Promise<Browser> {
    if (this.isShuttingDown) {
      throw new Error('Browser manager is shutting down');
    }

    if (!this.browser || !this.browser.isConnected()) {
      logger.info('Launching new browser instance');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }

    return this.browser;
  }

  async getContext(country: string): Promise<BrowserContext> {
    if (this.contexts.has(country)) {
      return this.contexts.get(country)!;
    }

    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1280, height: 720 },
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow'
    });

    this.contexts.set(country, context);
    return context;
  }

  private getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    const index = Math.floor(Math.random() * agents.length);
    return agents[index]!;
  }

  async close(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Closing browser manager');

    for (const [country, context] of this.contexts) {
      await context.close().catch(e => logger.warn({ e, country }, 'Failed to close context'));
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close().catch(e => logger.warn({ e }, 'Failed to close browser'));
      this.browser = null;
    }

    logger.info('Browser manager closed');
  }
}
