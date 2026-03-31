/**
 * Локальный тест парсера deal.by
 * Цель: увидеть реальные данные в консоли
 */
import { DealByParser } from './src/modules/market-research/parsers/by/dealby.parser';

async function test() {
  console.log('🚀 Starting deal.by test...\n');
  
  const parser = new DealByParser();
  const startTime = Date.now();
  
  try {
    const results = await parser.search('фаршмешалка');
    
    console.log(`✅ Success! Found ${results.length} results in ${Date.now() - startTime}ms\n`);
    
    if (results.length === 0) {
      console.log('⚠️  No results found - check selectors or anti-bot');
      return;
    }
    
    // Показываем первые 5 результатов
    console.log('📦 Top 5 results:\n');
    results.slice(0, 5).forEach((r, i) => {
      console.log(`--- Result ${i + 1} ---`);
      console.log(`Name:    ${r.name}`);
      console.log(`Price:   ${r.price || 'N/A'} ${r.currency || ''} (USD: ${r.priceUsd || 'N/A'})`);
      console.log(`Seller:  ${r.normalizedSeller || 'N/A'}`);
      console.log(`URL:     ${r.url}`);
      console.log(`InStock: ${r.inStock}`);
      console.log(`Score:   ${r.reliabilityScore}/100`);
      console.log('');
    });
    
    // Статистика
    const withPrice = results.filter(r => r.price).length;
    const withSeller = results.filter(r => r.normalizedSeller).length;
    
    console.log('📊 Stats:');
    console.log(`  Total: ${results.length}`);
    console.log(`  With price: ${withPrice}`);
    console.log(`  With seller: ${withSeller}`);
    console.log(`  Avg reliability: ${Math.round(results.reduce((s, r) => s + r.reliabilityScore, 0) / results.length)}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
