/**
 * Отладка парсера - сохраняем HTML и ищем цену
 */
import { chromium } from 'playwright';
import fs from 'fs';

async function debug() {
  console.log('🔍 Starting debug...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  try {
    // Идем на страницу поиска
    await page.goto('https://deal.by/search?search_term=фаршмешалка', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Ждем загрузки
    await page.waitForTimeout(3000);
    
    // Сохраняем HTML
    const html = await page.content();
    fs.writeFileSync('debug-dealby.html', html);
    console.log('✅ HTML saved to debug-dealby.html');
    
    // Ищем цены разными селекторами
    console.log('\n🔍 Testing price selectors:\n');
    
    const priceSelectors = [
      '[data-qaid="product_price"]',
      '[data-qaid*="price"]',
      '.price',
      '[class*="price"]',
      '[class*="Price"]',
      '.product-price',
      '[data-price]',
      '.product-card__price',
      '.b-product__price'
    ];
    
    for (const selector of priceSelectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`\n${selector}: ${elements.length} elements found`);
        
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const el = elements[i]!;
          const text = await el.textContent();
          const dataPrice = await el.getAttribute('data-price');
          console.log(`  [${i}] text: "${text?.trim()}", data-price: ${dataPrice || 'N/A'}`);
        }
      } catch (e) {
        console.log(`  ${selector}: ERROR`);
      }
    }
    
    // Ищем первую карточку товара детально
    console.log('\n\n📦 First product card analysis:\n');
    
    const cardSelectors = [
      '[data-qaid="product_block"]',
      '[data-qaid="product_item"]'
    ];
    
    for (const cardSel of cardSelectors) {
      const cards = await page.$$(cardSel);
      if (cards.length > 0) {
        console.log(`Using selector: ${cardSel}`);
        const firstCard = cards[0]!;
        
        // Название
        const nameEl = await firstCard.$('[data-qaid="product_name"]');
        const name = nameEl ? await nameEl.textContent() : 'NOT FOUND';
        console.log(`Name: ${name?.trim()}`);
        
        // Все элементы с цифрами внутри карточки
        const allText = await firstCard.textContent() || '';
        const priceMatches = allText.match(/(\d[\d\s,]*\d)\s*(руб|BYN|₽)/gi);
        console.log(`All prices found in card: ${priceMatches?.join(', ') || 'NONE'}`);
        
        // Сохраняем HTML первой карточки
        const cardHtml = await firstCard.evaluate(el => el.outerHTML);
        fs.writeFileSync('debug-first-card.html', cardHtml);
        console.log('\n✅ First card HTML saved to debug-first-card.html');
        
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debug();
