import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // ← ВАЖНО: bcryptjs!

const prisma = new PrismaClient();

async function main() {
  // Очищаем
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Роли
  const adminRole = await prisma.role.create({
    data: { name: 'Admin', permissions: {} },
  });
  const managerRole = await prisma.role.create({
    data: { name: 'Manager', permissions: {} },
  });
  const engineerRole = await prisma.role.create({
    data: { name: 'Engineer', permissions: {} },
  });

  // Пароли
  const adminPass = await bcrypt.hash('admin123', 12);
  const userPass = await bcrypt.hash('user123', 12);

  // Пользователи
  const admin = await prisma.user.create({
    data: {
      email: 'admin@feleti.com',
      username: 'admin',
      passwordHash: adminPass,
      fullName: 'Администратор Системы',
      roleId: adminRole.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@feleti.com',
      username: 'manager',
      passwordHash: userPass,
      fullName: 'Менеджер Проектов',
      roleId: managerRole.id,
    },
  });

  const engineer = await prisma.user.create({
    data: {
      email: 'engineer@feleti.com',
      username: 'engineer',
      passwordHash: userPass,
      fullName: 'Инженер-Разработчик',
      roleId: engineerRole.id,
    },
  });

  // Проекты
  const p1 = await prisma.project.create({
    data: {
      code: 'K-200',
      name: 'Куттер K-200 v2.0',
      description: 'Модернизация куттера K-200',
      stage: 'DESIGN',
      status: 'ACTIVE',
      budget: 5000000,
      spent: 1200000,
      startDate: new Date('2024-01-15'),
      targetDate: new Date('2025-06-30'),
      ownerId: admin.id,
      priority: 'medium',
    },
  });

  const p2 = await prisma.project.create({
    data: {
      code: 'VAC-350',
      name: 'Вакуумный упаковщик VAC-350',
      description: 'Новый вакуумный упаковщик',
      stage: 'PROTOTYPE',
      status: 'ACTIVE',
      budget: 3000000,
      spent: 2100000,
      startDate: new Date('2024-03-01'),
      targetDate: new Date('2025-12-31'),
      ownerId: manager.id,
      priority: 'medium',
    },
  });

  await prisma.project.create({
    data: {
      code: 'CONV-100',
      name: 'Конвейер CONV-100',
      description: 'Автоматизированная линия',
      stage: 'TESTING',
      status: 'ACTIVE',
      budget: 8000000,
      spent: 6500000,
      startDate: new Date('2023-06-01'),
      targetDate: new Date('2025-03-31'),
      ownerId: admin.id,
      priority: 'medium',
    },
  });

  await prisma.project.create({
    data: {
      code: 'PACK-75',
      name: 'Упаковочная машина PACK-75',
      description: 'Упаковочная машина для малого бизнеса',
      stage: 'CONCEPT',
      status: 'ACTIVE',
      budget: 2000000,
      spent: 300000,
      startDate: new Date('2025-01-01'),
      targetDate: new Date('2026-06-30'),
      ownerId: manager.id,
      priority: 'medium',
    },
  });

  await prisma.project.create({
    data: {
      code: 'SMOKE-25',
      name: 'Коптильня SMOKE-25',
      description: 'Промышленная коптильная установка',
      stage: 'PRODUCTION',
      status: 'ACTIVE',
      budget: 4000000,
      spent: 3800000,
      startDate: new Date('2023-01-01'),
      targetDate: new Date('2024-12-31'),
      ownerId: admin.id,
      priority: 'medium',
    },
  });

  // Члены команды
  await prisma.projectMember.createMany({
    data: [
      { projectId: p1.id, userId: manager.id, role: 'Lead Engineer' },
      { projectId: p1.id, userId: engineer.id, role: 'Developer' },
      { projectId: p2.id, userId: engineer.id, role: 'Lead Engineer' },
    ],
  });
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
