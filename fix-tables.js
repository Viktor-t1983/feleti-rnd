const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Исправление сломанных таблиц ===\n');

  const blocks = await prisma.projectBlock.findMany({
    where: {
      data: { path: ['content'], not: null },
    },
    select: { id: true, data: true },
  });

  let updated = 0;

  for (const block of blocks) {
    const content = block.data.content;
    if (!content || typeof content !== 'string') continue;

    // Проверяем есть ли сломанные таблицы (строки с | но не полная таблица)
    const lines = content.split('\n');
    let hasBrokenTable = false;
    
    for (const line of lines) {
      // Если строка содержит | но не полная табличная строка (несколько ячеек)
      const pipeCount = (line.match(/\|/g) || []).length;
      if (pipeCount > 0 && pipeCount < 4 && line.trim().startsWith('|')) {
        hasBrokenTable = true;
        break;
      }
    }

    if (!hasBrokenTable) continue;

    // Простое исправление: объединяем все строки в блоке там где они "рассыпались"
    // Найдем строки которые начинаются с | но содержат только одну ячейку
    const fixed = content
      .split('\n')
      .map(line => {
        // Если это строка таблицы с одной ячейкой ( | текст | )
        const match = line.match(/^\|\s*([^|]+)\s*\|$/);
        if (match) {
          // Это начало строки с одной ячейкой, нужно объединить с предыдущей
          return null; // пометим для объединения
        }
        return line;
      })
      .filter(line => line !== null)
      .join('\n');

    if (fixed !== content) {
      await prisma.projectBlock.update({
        where: { id: block.id },
        data: {
          data: {
            ...block.data,
            content: fixed,
          },
        },
      });
      updated++;
      console.log(`Обновлён блок ${block.id.slice(0, 8)}`);
    }
  }

  console.log(`\nВсего обновлено: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());