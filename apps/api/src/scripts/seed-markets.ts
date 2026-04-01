import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding markets...');

  const markets = [
    {
      code: 'BY',
      name: 'Беларусь',
      region: 'EUROPE' as const,
      description: 'Беларусь - ключевой рынок для FELETI, стабильный партнёр в ЕАЭС',
      population: 9200000,
      gdpPerCapita: 7500,
      languages: ['белорусский', 'русский'],
      currencies: ['BYN'],
      meatConsumptionKgPerCapita: 60,
      preferredMeatTypes: ['свинина', 'говядина', 'птица'],
      certificationsRequired: ['ЕАЭС', 'СТБ'],
      standards: ['ГОСТ', 'ТУ ЕАЭС'],
      isActive: true,
      priority: 1,
      industry: 'Мясопереработка',
      companiesCount: 250,
    },
    {
      code: 'RU',
      name: 'Россия',
      region: 'EUROPE' as const,
      description: 'Россия - основной экспортный рынок, крупнейший в ЕАЭС',
      population: 144000000,
      gdpPerCapita: 12000,
      languages: ['русский'],
      currencies: ['RUB'],
      meatConsumptionKgPerCapita: 75,
      preferredMeatTypes: ['свинина', 'говядина', 'птица'],
      certificationsRequired: ['ЕАЭС', 'Росаккредитация'],
      standards: ['ГОСТ', 'Техрегламент ЕАЭС'],
      isActive: true,
      priority: 1,
      industry: 'Мясопереработка',
      companiesCount: 1500,
    },
    {
      code: 'KZ',
      name: 'Казахстан',
      region: 'ASIA' as const,
      description: 'Казахстан - растущий рынок в Центральной Азии',
      population: 19000000,
      gdpPerCapita: 9000,
      languages: ['казахский', 'русский'],
      currencies: ['KZT', 'RUB'],
      meatConsumptionKgPerCapita: 55,
      preferredMeatTypes: ['говядина', 'баранина', 'птица'],
      certificationsRequired: ['ЕАЭС'],
      standards: ['ГОСТ РК'],
      isActive: true,
      priority: 2,
      industry: 'Мясопереработка',
      companiesCount: 180,
    },
    {
      code: 'PL',
      name: 'Польша',
      region: 'EUROPE' as const,
      description: 'Польша - развитый рынок ЕС, высокая конкуренция',
      population: 38000000,
      gdpPerCapita: 18000,
      languages: ['польский'],
      currencies: ['PLN', 'EUR'],
      meatConsumptionKgPerCapita: 85,
      preferredMeatTypes: ['свинина', 'птица', 'говядина'],
      certificationsRequired: ['EU', 'CE'],
      standards: ['EN', 'EU Regulation'],
      isActive: true,
      priority: 2,
      industry: 'Мясопереработка',
      companiesCount: 800,
    },
    {
      code: 'DE',
      name: 'Германия',
      region: 'EUROPE' as const,
      description: 'Германия - крупнейший рынок ЕС, высокие стандарты качества',
      population: 83000000,
      gdpPerCapita: 48000,
      languages: ['немецкий'],
      currencies: ['EUR'],
      meatConsumptionKgPerCapita: 95,
      preferredMeatTypes: ['свинина', 'говядина', 'птица'],
      certificationsRequired: ['EU', 'CE', 'IFS'],
      standards: ['DIN', 'EU Regulation'],
      isActive: true,
      priority: 2,
      industry: 'Мясопереработка',
      companiesCount: 1200,
    },
    {
      code: 'CN',
      name: 'Китай',
      region: 'ASIA' as const,
      description: 'Китай - огромный рынок с растущим спросом на оборудование',
      population: 1400000000,
      gdpPerCapita: 12500,
      languages: ['китайский'],
      currencies: ['CNY'],
      meatConsumptionKgPerCapita: 70,
      preferredMeatTypes: ['свинина', 'птица', 'говядина'],
      certificationsRequired: ['CCC', 'CIQ'],
      standards: ['GB', 'ISO'],
      isActive: true,
      priority: 2,
      industry: 'Мясопереработка',
      companiesCount: 5000,
    },
  ];

  for (const market of markets) {
    const existing = await prisma.market.findUnique({ where: { code: market.code } });
    if (existing) {
      console.log(`Market ${market.code} already exists, updating...`);
      await prisma.market.update({
        where: { code: market.code },
        data: market,
      });
    } else {
      console.log(`Creating market ${market.code}...`);
      await prisma.market.create({ data: market });
    }
  }

  console.log('Markets seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });