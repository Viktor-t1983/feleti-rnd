const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Очистка <br> тегов в БД ===\n');

  // Найти все блоки с <br> в content
  const blocksWithBr = await prisma.projectBlock.findMany({
    where: {
      data: {
        path: ['content'],
        string_contains: '<br>',
      },
    },
    select: { id: true, data: true },
  });

  console.log(`Найдено блоков с <br>: ${blocksWithBr.length}`);

  let updated = 0;
  for (const block of blocksWithBr) {
    const content = block.data.content;
    if (content && typeof content === 'string') {
      // Заменяем <br> на перенос строки
      const cleaned = content.replace(/<br\s*\/?>/gi, '\n');
      
      await prisma.projectBlock.update({
        where: { id: block.id },
        data: {
          data: {
            ...block.data,
            content: cleaned,
          },
        },
      });
      updated++;
    }
  }

  console.log(`Обновлено блоков: ${updated}`);
  console.log('\nГотово!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());