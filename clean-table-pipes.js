const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Очистка | внутри таблиц ===\n');

  // Найти все блоки с контентом
  const blocks = await prisma.projectBlock.findMany({
    where: {
      data: {
        path: ['content'],
        not: null,
      },
    },
    select: { id: true, data: true },
  });

  let updated = 0;
  
  for (const block of blocks) {
    const content = block.data.content;
    if (content && typeof content === 'string' && content.includes('|')) {
      // Обрабатываем каждую строку таблицы
      const lines = content.split('\n');
      const fixedLines = lines.map(line => {
        // Если строка внутри таблицы (содержит | но не является разделителем ---)
        if (line.includes('|') && !line.match(/^[\s|;-]+$/)) {
          // Заменяем " | " на "\n" (пробел-палочка-пробел → перенос)
          // Но НЕ внутри markdown разделителей таблицы
          return line.replace(/ \| /g, '\n');
        }
        return line;
      });
      
      const fixedContent = fixedLines.join('\n');
      
      if (fixedContent !== content) {
        await prisma.projectBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...block.data,
              content: fixedContent,
            },
          },
        });
        updated++;
        console.log(`Обновлён блок ${block.id.slice(0,8)}`);
      }
    }
  }

  console.log(`\nВсего обновлено блоков: ${updated}`);
  console.log('Готово!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());