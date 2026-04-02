const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.projectBlock.findMany({
  where: { 
    project: { code: 'SMOKE-25' },
    data: { path: ['content'], not: null }
  },
  select: { data: true, templateBlock: { select: { name: true } } }
}).then(blocks => {
  console.log('=== ПРОВЕРКА БЛОКОВ ===\n');
  
  blocks.forEach((b, i) => {
    const content = b.data.content;
    if (content) {
      const hasPipe = content.includes(' | ');
      const hasHash = content.includes(' # ');
      const hasNewline = content.includes('\n');
      
      console.log(`${i+1}. ${b.templateBlock.name}`);
      console.log(`   | в ячейках: ${hasPipe}, # : ${hasHash}`);
      
      // Показать первые 300 символов
      console.log(`   Начало: ${content.substring(0, 300)}...`);
      console.log('');
    }
  });
}).finally(() => prisma.$disconnect());