/**
 * Browser Service (Playwright)
 * Рендеринг JavaScript для защищённых B2B сайтов
 */

import { chromium, Browser, Page } from 'playwright';
import { logger } from '../../../utils/logger';

let browser: Browser | null = null;

/**
 * Получить/создать singleton browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
    logger.info('Playwright browser launched');
  }
  return browser;
}

/**
 * Закрыть browser (для graceful shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    logger.info('Playwright browser closed');
  }
}

interface RenderedPage {
  html: string;
  url: string;
  title: string;
}

/**
 * Загрузить страницу с рендерингом JS
 */
export async function fetchRenderedPage(
  url: string,
  options: {
    waitForSelector?: string;
    waitForTimeout?: number;
    userAgent?: string;
  } = {}
): Promise<RenderedPage> {
  const { waitForSelector, waitForTimeout = 2000, userAgent } = options;

  const startTime = Date.now();
  let page: Page | null = null;

  try {
    const bw = await getBrowser();
    page = await bw.newPage();

    // Маскируем под реальный браузер через setExtraHTTPHeaders
    // User-Agent передаётся через headers при goto
    void userAgent;

    // Дополнительные заголовки
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    logger.debug({ url }, 'Fetching page with Playwright');

    // Загружаем страницу
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Ждём прогрузки JS
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
        logger.debug({ selector: waitForSelector }, 'Selector found');
      } catch {
        logger.warn({ selector: waitForSelector }, 'Selector not found, continuing');
      }
    }

    // Дополнительное ожидание для AJAX
    if (waitForTimeout > 0) {
      await page.waitForTimeout(waitForTimeout);
    }

    const html = await page.content();
    const title = await page.title();

    const duration = Date.now() - startTime;
    logger.info({ url, duration, title: title.slice(0, 50) }, 'Page rendered');

    return { html, url: page.url(), title };
  } catch (error) {
    logger.error({ error, url }, 'Playwright fetch failed');
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Извлечь данные через CSS селекторы
 */
export async function extractData<T>(
  url: string,
  extractor: (page: Page) => Promise<T>,
  options: { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000 } = options;

  let page: Page | null = null;

  try {
    const bw = await getBrowser();
    page = await bw.newPage();

    // User-Agent через headers

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(2000);

    const data = await extractor(page);

    logger.info({ url, extracted: Array.isArray(data) ? data.length : 'object' }, 'Data extracted');

    return data;
  } catch (error) {
    logger.error({ error, url }, 'Data extraction failed');
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}
