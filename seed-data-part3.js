const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding markets...');

  const markets = [
    { code: 'BY', name: 'Беларусь', region: 'EUROPE', description: 'Беларусь - ключевой рынок', population: 9200000, gdpPerCapita: 7500, languages: ['белорусский', 'русский'], currencies: ['BYN'], meatConsumptionKgPerCapita: 60, preferredMeatTypes: ['свинина', 'говядина', 'птица'], certificationsRequired: ['ЕАЭС', 'СТБ'], standards: ['ГОСТ'], isActive: true, priority: 1, industry: 'Мясопереработка', companiesCount: 250 },
    { code: 'RU', name: 'Россия', region: 'EUROPE', description: 'Россия - основной экспортный рынок', population: 144000000, gdpPerCapita: 12000, languages: ['русский'], currencies: ['RUB'], meatConsumptionKgPerCapita: 75, preferredMeatTypes: ['свинина', 'говядина', 'птица'], certificationsRequired: ['ЕАЭС'], standards: ['ГОСТ'], isActive: true, priority: 1, industry: 'Мясопереработка', companiesCount: 1500 },
    { code: 'KZ', name: 'Казахстан', region: 'ASIA', description: 'Казахстан - растущий рынок', population: 19000000, gdpPerCapita: 9000, languages: ['казахский', 'русский'], currencies: ['KZT'], meatConsumptionKgPerCapita: 55, preferredMeatTypes: ['говядина', 'баранина'], certificationsRequired: ['ЕАЭС'], standards: ['ГОСТ'], isActive: true, priority: 2, industry: 'Мясопереработка', companiesCount: 180 },
    { code: 'PL', name: 'Польша', region: 'EUROPE', description: 'Польша - развитый рынок ЕС', population: 38000000, gdpPerCapita: 18000, languages: ['польский'], currencies: ['PLN', 'EUR'], meatConsumptionKgPerCapita: 85, preferredMeatTypes: ['свинина', 'птица'], certificationsRequired: ['EU', 'CE'], standards: ['EN'], isActive: true, priority: 2, industry: 'Мясопереработка', companiesCount: 800 },
    { code: 'DE', name: 'Германия', region: 'EUROPE', description: 'Германия - крупнейший рынок ЕС', population: 83000000, gdpPerCapita: 48000, languages: ['немецкий'], currencies: ['EUR'], meatConsumptionKgPerCapita: 95, preferredMeatTypes: ['свинина', 'говядина'], certificationsRequired: ['EU', 'CE', 'IFS'], standards: ['DIN'], isActive: true, priority: 2, industry: 'Мясопереработка', companiesCount: 1200 },
    { code: 'CN', name: 'Китай', region: 'ASIA', description: 'Китай - огромный рынок', population: 1400000000, gdpPerCapita: 12500, languages: ['китайский'], currencies: ['CNY'], meatConsumptionKgPerCapita: 70, preferredMeatTypes: ['свинина', 'птица'], certificationsRequired: ['CCC'], standards: ['GB'], isActive: true, priority: 2, industry: 'Мясопереработка', companiesCount: 5000 },
  ];

  for (const m of markets) {
    await prisma.market.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
    console.log(`Market ${m.code} created/updated`);
  }

  console.log('\nSeeding competitors...');

  const competitors = [
    { name: 'Nowicki', legalName: 'Nowicki Sp. z o.o.', website: 'https://nowicki.pl', country: 'Польша', countryCode: 'PL', foundedYear: 1995, employeesCount: 150, annualRevenue: 25.0, marketShare: 15.0, strengths: ['Высокое качество', 'Сильный бренд'], weaknesses: ['Высокие цены'], productRange: ['Вакуумные упаковщики', 'Клипсаторы'], priceSegment: 'premium', isActive: true, threatLevel: 'high' },
    { name: 'Karpowicz', legalName: 'Karpowicz Maszyny Sp. z o.o.', website: 'https://karpowicz.pl', country: 'Польша', countryCode: 'PL', foundedYear: 1988, employeesCount: 80, annualRevenue: 12.0, marketShare: 8.0, strengths: ['Ценовая конкуренция'], weaknesses: ['Ограниченные инновации'], productRange: ['Фаршмешалки'], priceSegment: 'mid', isActive: true, threatLevel: 'medium' },
    { name: 'Seydelmann', legalName: 'Seydelmann GmbH', website: 'https://seydelmann.de', country: 'Германия', countryCode: 'DE', foundedYear: 1955, employeesCount: 200, annualRevenue: 45.0, marketShare: 20.0, strengths: ['Премиальное качество', 'Немецкая инженерия'], weaknesses: ['Очень высокие цены'], productRange: ['Куттеры', 'Фаршмешалки'], priceSegment: 'premium', isActive: true, threatLevel: 'medium' },
    { name: 'Zhaowei Machinery', legalName: 'Zhaowei Machinery Co., Ltd', website: 'https://zhaowei.com', country: 'Китай', countryCode: 'CN', foundedYear: 2005, employeesCount: 300, annualRevenue: 15.0, marketShare: 5.0, strengths: ['Низкие цены', 'Быстрая доставка'], weaknesses: ['Качество ниже'], productRange: ['Куттеры', 'Фаршмешалки'], priceSegment: 'low', isActive: true, threatLevel: 'low' },
    { name: 'Metalbud-Nowicki', legalName: 'Metalbud-Nowicki Sp. z o.o.', website: 'https://metalbudnowicki.pl', country: 'Польша', countryCode: 'PL', foundedYear: 2000, employeesCount: 120, annualRevenue: 20.0, marketShare: 12.0, strengths: ['Комплексные решения'], weaknesses: ['Средние цены'], productRange: ['Линии переработки'], priceSegment: 'mid', isActive: true, threatLevel: 'high' },
    { name: 'Mainca', legalName: 'Mainca Embalajes S.L.', website: 'https://mainca.com', country: 'Испания', countryCode: 'ES', foundedYear: 1965, employeesCount: 100, annualRevenue: 18.0, marketShare: 10.0, strengths: ['Инновации'], weaknesses: ['Меньше в ЕАЭС'], productRange: ['Вакуумные упаковщики'], priceSegment: 'mid', isActive: true, threatLevel: 'medium' },
    { name: 'Lima', legalName: 'Lima Maschinenbau GmbH', website: 'https://lima-germany.de', country: 'Германия', countryCode: 'DE', foundedYear: 1970, employeesCount: 90, annualRevenue: 22.0, marketShare: 8.0, strengths: ['Надёжность'], weaknesses: ['Цены выше среднего'], productRange: ['Оборудование для обработки'], priceSegment: 'mid', isActive: true, threatLevel: 'medium' },
    { name: 'Handtmann', legalName: 'Handtmann GmbH', website: 'https://handtmann.com', country: 'Германия', countryCode: 'DE', foundedYear: 1955, employeesCount: 400, annualRevenue: 80.0, marketShare: 25.0, strengths: ['Лидер рынка', 'Полная автоматизация'], weaknesses: ['Высочайшие цены'], productRange: ['Формовщики', 'Шприцы'], priceSegment: 'premium', isActive: true, threatLevel: 'high' },
  ];

  for (const c of competitors) {
    await prisma.competitorDetail.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
    console.log(`Competitor ${c.name} created/updated`);
  }

  console.log('\nSeeding competitor equipment...');

  const compEquip = [
    { competitorName: 'Nowicki', name: 'Вакуумный упаковщик', modelNumber: 'NOW-VP-100', advantages: ['Высокая производительность'], disadvantages: ['Высокая цена'], priceRangeMin: 15000, priceRangeMax: 25000 },
    { competitorName: 'Nowicki', name: 'Клипсатор', modelNumber: 'NOW-CL-200', advantages: ['Автоматизация'], disadvantages: ['Только для крупных'], priceRangeMin: 8000, priceRangeMax: 15000 },
    { competitorName: 'Karpowicz', name: 'Фаршмешалка', modelNumber: 'KRP-MX-500', advantages: ['Доступная цена'], disadvantages: ['Ограниченная ёмкость'], priceRangeMin: 5000, priceRangeMax: 10000 },
    { competitorName: 'Seydelmann', name: 'Куттер', modelNumber: 'SEY-CT-1000', advantages: ['Премиальное качество'], disadvantages: ['Высокая цена'], priceRangeMin: 30000, priceRangeMax: 50000 },
    { competitorName: 'Seydelmann', name: 'Фаршмешалка', modelNumber: 'SEY-MX-800', advantages: ['Немецкое качество'], disadvantages: ['Цена'], priceRangeMin: 20000, priceRangeMax: 35000 },
    { competitorName: 'Zhaowei Machinery', name: 'Куттер', modelNumber: 'ZHW-CT-500', advantages: ['Низкая цена'], disadvantages: ['Качество'], priceRangeMin: 8000, priceRangeMax: 15000 },
    { competitorName: 'Metalbud-Nowicki', name: 'Линия переработки', modelNumber: 'MBN-LINE-100', advantages: ['Комплекс'], disadvantages: ['Сложность'], priceRangeMin: 50000, priceRangeMax: 100000 },
    { competitorName: 'Mainca', name: 'Вакуумный упаковщик', modelNumber: 'MAIN-VP-300', advantages: ['Инновации'], disadvantages: ['Мало в ЕАЭС'], priceRangeMin: 12000, priceRangeMax: 22000 },
    { competitorName: 'Lima', name: 'Оборудование для обработки', modelNumber: 'LIMA-PR-100', advantages: ['Надёжность'], disadvantages: ['Цена'], priceRangeMin: 15000, priceRangeMax: 28000 },
    { competitorName: 'Handtmann', name: 'Формовщик', modelNumber: 'HAND-FR-500', advantages: ['Автоматизация'], disadvantages: ['Цена'], priceRangeMin: 80000, priceRangeMax: 150000 },
  ];

  for (const ce of compEquip) {
    const comp = await prisma.competitorDetail.findUnique({ where: { name: ce.competitorName } });
    if (comp) {
      await prisma.competitorEquipment.create({
        data: {
          competitorId: comp.id,
          name: ce.name,
          modelNumber: ce.modelNumber,
          advantages: ce.advantages,
          disadvantages: ce.disadvantages,
          priceRangeMin: ce.priceRangeMin,
          priceRangeMax: ce.priceRangeMax,
        },
      });
      console.log(`Equipment ${ce.name} for ${ce.competitorName}`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());