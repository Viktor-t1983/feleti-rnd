const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Фиксация таблиц в БД ===\n');

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

    // Применяем ту же логику объединения что в parseSimpleMarkdown
    const tableLines = content.split('\n');
    const fixedLines = [];
    let tableBuffer = '';

    for (const line of tableLines) {
      if (!line) continue;

      const isSeparator = /^[\s|:-]+$/.test(line);
      const isRow = line.trim().startsWith('|');

      if (isRow && !isSeparator) {
        if (tableBuffer) fixedLines.push(tableBuffer);
        tableBuffer = line;
      } else if (tableBuffer && isSeparator) {
        tableBuffer += '\n' + line;
      } else if (tableBuffer && !isRow) {
        fixedLines.push(tableBuffer);
        tableBuffer = '';
        fixedLines.push(line);
      } else if (tableBuffer && isRow && isSeparator) {
        tableBuffer += '\n' + line;
      } else {
        fixedLines.push(line);
      }
    }
    if (tableBuffer) fixedLines.push(tableBuffer);

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
      console.log(`Обновлён блок ${block.id.slice(0, 8)}`);
    }
  }

  console.log(`\nВсего обновлено: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());