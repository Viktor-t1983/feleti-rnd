/**
 * PROM.ua Parser (Ukraine)
 * Парсер для поиска производителей и поставщиков на PROM.ua
 */
import { BrowserManager } from '../browser-manager';
import { BaseParser, RawResult, NormalizedResult } from '../base-parser';
import { logger } from '../../../../utils/logger';

export class PromUaParser extends BaseParser {
  private browserManager = BrowserManager.getInstance();

  constructor() {
    super({
      country: 'RU',
      source: 'prom.ru',
      baseUrl: 'https://prom.ru',
      delay: 2000,
      maxResults: 30,
      retryOptions: {
        retries: 3,
        delay: 3000
      }
    });
  }

  protected async doSearch(query: string): Promise<NormalizedResult[]> {
    logger.info({ query }, 'Starting PROM.ua search');

    const context = await this.browserManager.getContext(this.config.country);
    const page = await context.newPage();
    const results: NormalizedResult[] = [];

    try {
      const searchUrl = `${this.config.baseUrl}/search?search_term=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });

      await this.sleep(3000);

      await this.waitForProducts(page);

      const cards = await this.getProductCards(page);
      logger.info({ count: cards.length }, 'Found PROM.ua product cards');

      for (let i = 0; i < Math.min(cards.length, this.config.maxResults); i++) {
        try {
          const card = cards[i];
          const raw = await this.parseCard(card);
          
          if (raw) {
            results.push(this.normalize(raw));
          }

          await this.sleep(500);

        } catch (err) {
          logger.warn({ err, index: i }, 'Failed to parse PROM.ua card');
        }
      }

    } catch (error) {
      logger.error({ error }, 'PROM.ua parsing failed');
      throw error;
    } finally {
      await page.close();
    }

    logger.info({ count: results.length }, 'PROM.ua parsing completed');
    return results;
  }

  private async waitForProducts(page: any): Promise<void> {
    const selectors = [
      '[data-qaid="product_block"]',
      '[data-qaid="product_list"] > *',
      '.product-card',
      '.ProductCard',
      '[class*="product-item"]'
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        return;
      } catch (e) {
        // пробуем следующий
      }
    }

    await this.sleep(3000);
  }

  private async getProductCards(page: any): Promise<any[]> {
    const selectors = [
      '[data-qaid="product_block"]',
      '[data-qaid="product_list"] > *',
      '.product-card',
      '.ProductCard',
      '[class*="product-item"]',
      '[class*="products-list"] > *'
    ];

    for (const selector of selectors) {
      try {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          logger.debug({ selector, count: cards.length }, 'Using selector for PROM.ua cards');
          return cards;
        }
      } catch (e) {
        // пробуем следующий
      }
    }

    return [];
  }

  private async parseCard(card: any): Promise<RawResult | null> {
    if (!card) return null;

    const name = await this.safeGetTextFromElement(card, [
      '[data-qaid="product_name"]',
      'a[data-qaid*="name"]',
      'h3',
      'h2',
      '[class*="title"]',
      '[class*="name"]',
      'a[href*="/product/"]'
    ]);

    if (!name) {
      return null;
    }

    const seller = await this.safeGetTextFromElement(card, [
      '[data-qaid="company_name"]',
      '[data-qaid*="company"]',
      '[data-qaid*="seller"]',
      '[class*="company"]',
      '[class*="seller"]',
      '[class*="producer"]'
    ]);

    let href = await this.safeGetAttributeFromElement(card, [
      '[data-qaid="product_name"]',
      'a[data-qaid*="name"]',
      'a[href*="/product/"]'
    ], 'href');

    if (!href || href === '/' || href === '#') {
      const anyLink = await this.safeGetAttributeFromElement(card, ['a[href]'], 'href');
      if (anyLink && anyLink.length > 1) {
        href = anyLink;
      }
    }

    let url = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
    
    if (url === this.config.baseUrl || url === `${this.config.baseUrl}/`) {
      url = `${this.config.baseUrl}/ua/search?search_term=${encodeURIComponent(name.slice(0, 30))}`;
    }

    const image = await this.safeGetAttributeFromElement(card, [
      'img[data-qaid*="image"]',
      'img[class*="image"]',
      'img'
    ], 'src');

    const price = await this.safeGetTextFromElement(card, [
      '[data-qaid="product_price"]',
      '[class*="price"]',
      '[class*="cost"]'
    ]);

    const stockText = await this.safeGetTextFromElement(card, [
      '[data-qaid*="stock"]',
      '[data-qaid*="available"]',
      '[class*="stock"]',
      '[class*="availability"]'
    ]);
    const inStock = !stockText || !stockText.toLowerCase().includes('нет') || !stockText.toLowerCase().includes('відсут');

    return {
      name,
      url,
      image: image || undefined,
      seller: seller || undefined,
      inStock,
      price: price ? parseFloat(price.replace(/[^\d.]/g, '')) : undefined,
      currency: price ? 'UAH' : undefined,
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
        // пробуем следующий
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
        // пробуем следующий
      }
    }
    return '';
  }

  protected override async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
