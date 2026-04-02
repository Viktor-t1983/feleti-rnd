const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Глубокая очистка таблиц ===\n');

  const blocks = await prisma.projectBlock.findMany({
    where: { data: { path: ['content'], not: null } },
    select: { id: true, data: true },
  });

  let updated = 0;

  for (const block of blocks) {
    const content = block.data.content;
    if (!content || typeof content !== 'string') continue;

    // Упрощённый подход: просто заменяем переносы внутри疑似табличных строк
    // Находим блоки между | --- | и объединяем их
    
    const lines = content.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isSeparator = /^[\s|:-]+$/.test(line);
      const isRow = line.trim().startsWith('|');
      
      if (isRow && !isSeparator) {
        // Начало новой таблицы или строки
        if (!inTable) {
          inTable = true;
          tableLines = [line];
        } else {
          // Мы уже в таблице - значит это следующая строка данных
          tableLines.push(line);
        }
      } else if (isSeparator && inTable) {
        // Разделитель - добавляем к буферу
        tableLines.push(line);
      } else if (!isRow && inTable) {
        // Конец таблицы - обрабатываем буфер
        const fixedTable = processTableBuffer(tableLines);
        result.push(...fixedTable);
        tableLines = [];
        inTable = false;
        result.push(line);
      } else {
        if (inTable && tableLines.length > 0) {
          const fixedTable = processTableBuffer(tableLines);
          result.push(...fixedTable);
          tableLines = [];
        }
        inTable = false;
        result.push(line);
      }
    }
    
    // Последняя таблица
    if (inTable && tableLines.length > 0) {
      const fixedTable = processTableBuffer(tableLines);
      result.push(...fixedTable);
    }

    const fixedContent = result.join('\n');

    if (fixedContent !== content) {
      await prisma.projectBlock.update({
        where: { id: block.id },
        data: { data: { ...block.data, content: fixedContent } },
      });
      updated++;
      console.log(`Блок ${block.id.slice(0,8)} обновлён`);
    }
  }

  console.log(`\nВсего: ${updated}`);
}

function processTableBuffer(lines: string[]): string[] {
  // Найти заголовок и разделитель
  const headerIdx = lines.findIndex(l => l.trim().startsWith('|') && !l.match(/^[\s|:-]+$/));
  const sepIdx = lines.findIndex(l => l.match(/^[\s|:-]+$/));
  
  if (headerIdx === -1) return lines;
  
  // Разделить на header, separator, body
  const header = lines[headerIdx];
  const separator = sepIdx !== -1 ? lines[sepIdx] : '';
  const bodyLines = [];
  
  // Собрать все строки между header и separator (или до конца)
  const startBody = sepIdx !== -1 ? sepIdx + 1 : headerIdx + 1;
  for (let i = startBody; i < lines.length; i++) {
    if (lines[i].match(/^[\s|:-]+$/)) continue;
    if (lines[i].trim().startsWith('|')) bodyLines.push(lines[i]);
  }
  
  // Каждую строку body очистить - убрать переносы внутри ячеек
  const cleanBody = bodyLines.map(row => {
    // Если в строке есть переносы - значит она разбита
    // Находим все ячейки | cell1 | cell2 | и объединяем
    const parts = row.split('|').filter(p => p !== undefined);
    let currentCell = '';
    const mergedCells: string[] = [];
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;
      
      // Если ячейка содержит перенос - добавляем к текущей
      if (trimmed.includes('\n')) {
        currentCell += ' ' + trimmed.replace(/\n/g, ' ');
      } else if (currentCell) {
        // Новая ячейка после переноса
        mergedCells.push(currentCell.trim());
        currentCell = trimmed;
      } else {
        currentCell = trimmed;
      }
    }
    if (currentCell) mergedCells.push(currentCell.trim());
    
    // Собрать обратно в строку
    return '| ' + mergedCells.join(' | ') + ' |';
  });
  
  if (separator) {
    return [header, separator, ...cleanBody];
  }
  return [header, ...cleanBody];
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());