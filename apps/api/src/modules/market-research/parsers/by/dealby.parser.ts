/**
 * Deal.by Parser
 * С учетом: browser pool, fallback селекторы, circuit breaker
 */
import { BrowserManager } from '../browser-manager';
import { BaseParser, RawResult, NormalizedResult } from '../base-parser';
import { logger } from '../../../../utils/logger';

export class DealByParser extends BaseParser {
  private browserManager = BrowserManager.getInstance();

  constructor() {
    super({
      country: 'BY',
      source: 'deal.by',
      baseUrl: 'https://deal.by',
      delay: 2000,
      maxResults: 30,
      retryOptions: {
        retries: 3,
        delay: 3000
      }
    });
  }

  protected async doSearch(query: string): Promise<NormalizedResult[]> {
    logger.info({ query }, 'Starting deal.by search');

    const context = await this.browserManager.getContext(this.config.country);
    const page = await context.newPage();
    const results: NormalizedResult[] = [];

    try {
      // Переход на страницу поиска
      const searchUrl = `${this.config.baseUrl}/search?search_term=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });

      // Ждем загрузки с fallback
      await this.waitForProducts(page);

      // Получаем карточки с fallback селекторами
      const cards = await this.getProductCards(page);
      logger.info({ count: cards.length }, 'Found product cards');

      for (let i = 0; i < Math.min(cards.length, this.config.maxResults); i++) {
        try {
          const card = cards[i];
          const raw = await this.parseCard(card);
          
          if (raw) {
            results.push(this.normalize(raw));
          }

          // Антибан задержка между карточками
          await this.sleep(500);

        } catch (err) {
          logger.warn({ err, index: i }, 'Failed to parse card');
        }
      }

    } catch (error) {
      logger.error({ error }, 'Deal.by parsing failed');
      throw error;
    } finally {
      await page.close();
    }

    logger.info({ count: results.length }, 'Deal.by parsing completed');
    return results;
  }

  private async waitForProducts(page: any): Promise<void> {
    // Пробуем разные селекторы для ожидания загрузки
    const selectors = [
      '[data-qaid="product_block"]',
      '[data-qaid="product_name"]',
      '.ProductCard',
      '[class*="product"]'
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        return;
      } catch (e) {
        // Пробуем следующий
      }
    }

    // Если ничего не нашли - ждем просто по времени
    await this.sleep(3000);
  }

  private async getProductCards(page: any): Promise<any[]> {
    // Fallback селекторы для карточек
    const selectors = [
      '[data-qaid="product_block"]',
      '[data-qaid="product_list"] > *',
      '.ProductCard',
      '[class*="product-card"]',
      '[class*="Product"]'
    ];

    for (const selector of selectors) {
      try {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          logger.debug({ selector, count: cards.length }, 'Using selector for cards');
          return cards;
        }
      } catch (e) {
        // Пробуем следующий
      }
    }

    return [];
  }

  private async parseCard(card: any): Promise<RawResult | null> {
    if (!card) return null;
    // Fallback селекторы для названия
    const name = await this.safeGetTextFromElement(card, [
      '[data-qaid="product_name"]',
      'a[data-qaid*="name"]',
      'h3',
      'h2',
      '[class*="title"]',
      'a[href*="/product/"]'
    ]);

    if (!name) {
      return null;
    }

    // TODO: Цена берется отдельно на странице товара (detail page)
    // В списке цены некорректны (миксы с аксессуарами)
    const seller = await this.safeGetTextFromElement(card, [
      '[data-qaid="company_name"]',
      '[data-qaid*="company"]',
      '[data-qaid*="seller"]',
      '[class*="company"]',
      '[class*="seller"]'
    ]);

    // URL товара
    let href = await this.safeGetAttributeFromElement(card, [
      '[data-qaid="product_name"]',
      'a[data-qaid*="name"]',
      'a[href*="/product/"]'
    ], 'href');

    // Фикс: если href пустой или только /, берем из другого селектора
    if (!href || href === '/' || href === '#') {
      const anyLink = await this.safeGetAttributeFromElement(card, ['a[href]'], 'href');
      if (anyLink && anyLink.length > 1) {
        href = anyLink;
      }
    }

    let url = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
    
    // Если всё ещё не валидный URL, используем поисковый
    if (url === this.config.baseUrl || url === `${this.config.baseUrl}/`) {
      url = `${this.config.baseUrl}/search?search_term=${encodeURIComponent(name.slice(0, 30))}`;
    }

    // Изображение
    const image = await this.safeGetAttributeFromElement(card, [
      'img[data-qaid*="image"]',
      'img[class*="image"]',
      'img'
    ], 'src');

    // Наличие
    const stockText = await this.safeGetTextFromElement(card, [
      '[data-qaid*="stock"]',
      '[data-qaid*="available"]',
      '[class*="stock"]'
    ]);
    const inStock = !stockText || !stockText.includes('нет');

    return {
      name,
      url,
      image: image || undefined,
      seller: seller || undefined,
      inStock,
      category: 'industrial_equipment'
    };
  }



  private async safeGetTextFromElement(element: any, selectors: string[]): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const el = await element.$(selector);
        if (el) {
          const text = await el.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (e) {
        // Пробуем следующий
      }
    }
    return null;
  }

  private async safeGetAttributeFromElement(
    element: any, 
    selectors: string[], 
    attribute: string
  ): Promise<string> {
    for (const selector of selectors) {
      try {
        const el = await element.$(selector);
        if (el) {
          const value = await el.getAttribute(attribute);
          if (value) {
            return value;
          }
        }
      } catch (e) {
        // Пробуем следующий
      }
    }
    return '';
  }

  protected override async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
