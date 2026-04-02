const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Очистка контента от артефактов ===\n');

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

    let fixed = content;

    // 1. Убираем одиночные # в начале строки (кроме заголовков)
    // Но НЕ убираем ### заголовки
    // Оставляем только реальные заголовки

    // 2. Очищаем таблицы - убираем переносы внутри ячеек
    // Это сложная логика - найдём и заменим проблемные места
    
    // Простейший подход: заменим все | которые не являются разделителями таблицы
    // Но сложно отличить... 
    
    // Лучше: заменим проблемные \n в местах где они не нужны
    // Например, внутри ячеек таблицы, между разделителем | и содержимым
    
    // Пока просто проверим изменилось ли что-то
    if (fixed !== content) {
      await prisma.projectBlock.update({
        where: { id: block.id },
        data: { data: { ...block.data, content: fixed } },
      });
      updated++;
    }
  }

  console.log(`Обновлено: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());