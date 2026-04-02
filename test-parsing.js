const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.projectBlock.findFirst({
  where: { 
    project: { code: 'SMOKE-25' },
    templateBlock: { name: { contains: 'Рынок' } }
  },
  select: { data: true }
}).then(b => {
  let html = b.data.content;
  
  const tableLines = html.split('\n');
  let inTable = false;
  const fixedLines = [];
  let tableBuffer = '';
  
  for (const line of tableLines) {
    if (!line) continue;
    
    const isSeparator = /^[\s|:-]+$/.test(line);
    const isRow = line.trim().startsWith('|');
    
    if (isRow && !isSeparator) {
      if (!inTable && tableBuffer) {
        fixedLines.push(tableBuffer);
        tableBuffer = '';
      }
      inTable = true;
      tableBuffer = tableBuffer ? tableBuffer + '\n' + line : line;
    } else if (inTable && isSeparator) {
      tableBuffer += '\n' + line;
    } else if (inTable && isRow === false) {
      fixedLines.push(tableBuffer);
      tableBuffer = '';
      inTable = false;
      fixedLines.push(line);
    } else {
      fixedLines.push(line);
    }
  }
  if (tableBuffer) fixedLines.push(tableBuffer);
  
  console.log('=== ПОСЛЕ ОБРАБОТКИ ===');
  console.log(fixedLines.join('\n').substring(0, 2000));
}).finally(() => prisma.$disconnect());