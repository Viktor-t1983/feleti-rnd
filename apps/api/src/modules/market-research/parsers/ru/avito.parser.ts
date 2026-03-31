/**
 * Avito Parser (Russia)
 * Same pattern as DealByParser - list page only, prices later
 */
import { BrowserManager } from '../browser-manager';
import { BaseParser, RawResult, NormalizedResult } from '../base-parser';
import { logger } from '../../../../utils/logger';

export class AvitoParser extends BaseParser {
  private browserManager = BrowserManager.getInstance();

  constructor() {
    super({
      country: 'RU',
      source: 'avito',
      baseUrl: 'https://www.avito.ru',
      delay: 2000,
      maxResults: 30,
      retryOptions: {
        retries: 3,
        delay: 3000
      }
    });
  }

  protected async doSearch(query: string): Promise<NormalizedResult[]> {
    logger.info({ query }, 'Starting avito search');

    const context = await this.browserManager.getContext(this.config.country);
    const page = await context.newPage();
    const results: NormalizedResult[] = [];

    try {
      // Avito search URL
      const searchUrl = `${this.config.baseUrl}/rossiya?q=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Additional wait for dynamic content
      await this.sleep(3000);

      // Wait for content
      await this.waitForProducts(page);

      // Get product cards
      const cards = await this.getProductCards(page);
      logger.info({ count: cards.length }, 'Found avito product cards');

      for (let i = 0; i < Math.min(cards.length, this.config.maxResults); i++) {
        try {
          const card = cards[i];
          const raw = await this.parseCard(card);
          
          if (raw) {
            results.push(this.normalize(raw));
          }

          await this.sleep(500);
        } catch (err) {
          logger.warn({ err, index: i }, 'Failed to parse avito card');
        }
      }

    } catch (error) {
      logger.error({ error }, 'Avito parsing failed');
      throw error;
    } finally {
      await page.close();
    }

    logger.info({ count: results.length }, 'Avito parsing completed');
    return results;
  }

  private async waitForProducts(page: any): Promise<void> {
    // Avito specific selectors - more stable
    const selectors = [
      '[data-marker="item"]',
      '[itemtype="http://schema.org/Product"]',
      'a[href*="/item/"]',
      '[data-testid="item"]'
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 15000 });
        logger.debug({ selector }, 'Avito content loaded');
        return;
      } catch (e) {
        // Try next
      }
    }

    // Fallback - wait for any content
    await this.sleep(5000);
  }

  private async getProductCards(page: any): Promise<any[]> {
    // Strategy 1: Try multiple selector strategies for Avito
    const selectors = [
      '[data-marker="item"]',           
      '[itemtype="http://schema.org/Product"]',
      'a[href*="/item/"]',
      '[data-testid="item"]',
      'article',
      '[class*="iva-item"]',
    ];

    for (const selector of selectors) {
      try {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          logger.info({ selector, count: cards.length }, 'Found avito cards with selector');
          return cards;
        }
      } catch (e) {
        // Try next
      }
    }

    // Strategy 2: Extract from JSON-LD schema.org
    try {
      const jsonLdData = await page.$$eval('script[type="application/ld+json"]', 
        (scripts: any[]) => scripts
          .map(s => {
            try { return JSON.parse(s.textContent || ''); } catch { return null; }
          })
          .filter(Boolean)
      );
      
      for (const data of jsonLdData) {
        // Look for ItemList or Product data
        if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
          logger.info({ count: data.itemListElement.length }, 'Found avito data in JSON-LD ItemList');
          return data.itemListElement.slice(0, this.config.maxResults).map((item: any) => ({
            _jsonLd: true,
            name: item.name || item.item?.name,
            url: item.url || item.item?.url,
            image: item.image || item.item?.image,
            seller: item.item?.offers?.seller?.name,
          }));
        }
      }
    } catch (e) {
      logger.warn({ e }, 'JSON-LD extraction failed');
    }

    // Strategy 3: Find by link pattern
    try {
      const allLinks = await page.$$('a[href*="/item/"]');
      if (allLinks.length > 0) {
        logger.info({ count: allLinks.length }, 'Found avito items by link pattern');
        return allLinks.slice(0, this.config.maxResults * 2);
      }
    } catch (e) {
      // Ignore
    }

    return [];
  }

  private async parseCard(card: any): Promise<RawResult | null> {
    if (!card) return null;

    // Handle JSON-LD data (pre-parsed)
    if (card._jsonLd) {
      if (!card.name) return null;
      return {
        name: card.name.slice(0, 200),
        url: card.url?.startsWith('http') ? card.url : `${this.config.baseUrl}${card.url || ''}`,
        image: card.image,
        seller: card.seller,
        inStock: true,
        category: 'industrial_equipment'
      };
    }

    // Regular DOM parsing
    let href = '';
    try {
      href = await card.getAttribute('href') || '';
    } catch {
      href = await this.safeGetAttributeFromElement(card, [
        'a[href]',
        '[itemprop="url"]'
      ], 'href');
    }

    let name: string | null = null;
    
    name = await this.safeGetAttributeFromElement(card, [
      '[itemprop="name"]',
      'meta[itemprop="name"]'
    ], 'content');
    
    if (!name) {
      name = await this.safeGetTextFromElement(card, [
        'h3',
        'h2',
        '[class*="title"]',
        '[class*="Title"]',
        'a[href]',
        'span'
      ]);
    }

    if (!name || name.length < 3) {
      if (href) {
        const match = href.match(/item\/[^/]+_([^_]+)/);
        if (match && match[1]) {
          name = decodeURIComponent(match[1].replace(/_/g, ' '));
        }
      }
    }

    if (!name || name.length < 3) {
      return null;
    }

    const seller = await this.safeGetTextFromElement(card, [
      '[itemprop="areaServed"]',
      '[class*="geo"]',
      '[class*="location"]',
      '[class*="address"]',
      '[data-marker="item-address"]'
    ]);

    let url = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
    
    if (!href || url === this.config.baseUrl) {
      url = `${this.config.baseUrl}/rossiya?q=${encodeURIComponent(name.slice(0, 30))}`;
    }

    const image = await this.safeGetAttributeFromElement(card, [
      '[itemprop="image"]',
      'img[data-marker="item-image"]',
      'img'
    ], 'src');

    return {
      name: name.slice(0, 200),
      url,
      image: image || undefined,
      seller: seller || undefined,
      inStock: true,
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
        // Try next
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
        // Try next
      }
    }
    return '';
  }

  protected override async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
