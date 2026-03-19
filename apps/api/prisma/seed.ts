import { PrismaClient, SettingValueType } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // ← ВАЖНО: bcryptjs!

const prisma = new PrismaClient();

/**
 * Дефолтные системные настройки AI
 */
const defaultSystemSettings = [
  {
    key: 'ai.provider',
    value: 'deepseek',
    valueType: SettingValueType.STRING,
    category: 'ai',
    label: 'Провайдер AI',
    description: 'Провайдер AI: deepseek, openai, anthropic, kimi',
    isEncrypted: false,
  },
  {
    key: 'ai.model',
    value: 'deepseek-chat',
    valueType: SettingValueType.STRING,
    category: 'ai',
    label: 'Модель AI',
    description: 'Модель AI (зависит от провайдера)',
    isEncrypted: false,
  },
  {
    key: 'ai.api_key',
    value: '',
    valueType: SettingValueType.ENCRYPTED,
    category: 'ai',
    label: 'API Ключ',
    description: 'API ключ провайдера (хранится зашифрованно, не попадает в git)',
    isEncrypted: true,
  },
  {
    key: 'ai.api_url',
    value: 'https://api.deepseek.com/v1/chat/completions',
    valueType: SettingValueType.STRING,
    category: 'ai',
    label: 'API URL',
    description: 'URL API провайдера',
    isEncrypted: false,
  },
  {
    key: 'ai.enabled',
    value: 'true',
    valueType: SettingValueType.BOOLEAN,
    category: 'ai',
    label: 'AI Ассистент включен',
    description: 'Глобальное включение/выключение AI-ассистента',
    isEncrypted: false,
  },
  {
    key: 'ai.max_tokens',
    value: '1000',
    valueType: SettingValueType.NUMBER,
    category: 'ai',
    label: 'Максимум токенов',
    description: 'Максимальное количество токенов в ответе AI',
    isEncrypted: false,
  },
];

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

  // Системные настройки AI (upsert чтобы не перезаписывать существующие)
  // eslint-disable-next-line no-console
  console.log('⚙️ Создание системных настроек AI...');
  for (const setting of defaultSystemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Не обновляем существующие
      create: {
        ...setting,
        updatedById: admin.id,
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log('✅ Системные настройки AI созданы');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
