const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Простая очистка переносов в таблицах ===\n');

  const blocks = await prisma.projectBlock.findMany({
    where: { data: { path: ['content'], not: null } },
    select: { id: true, data: true },
  });

  let updated = 0;

  for (const block of blocks) {
    const content = block.data.content;
    if (!content || typeof content !== 'string') continue;

    // Простой подход: внутри табличных строк убрать переносы
    let fixed = content.split('\n').map(line => {
      // Если строка таблицы (начинается с |)
      if (line.trim().startsWith('|') && !line.match(/^[\s|:-]+$/)) {
        // Убрать все переносы и лишние пробелы
        return line.replace(/\s+/g, ' ').trim();
      }
      return line;
    }).join('\n');

    if (fixed !== content) {
      await prisma.projectBlock.update({
        where: { id: block.id },
        data: { data: { ...block.data, content: fixed } },
      });
      updated++;
    }
  }

  console.log('Готово! Обновлено:', updated);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());