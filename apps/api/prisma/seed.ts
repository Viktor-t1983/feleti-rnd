import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Создайте роли
  console.log('📦 Creating roles...')
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        users: ['read', 'write', 'delete'],
        projects: ['read', 'write', 'delete'],
        financials: ['read', 'write'],
        competitors: ['read', 'write'],
        tasks: ['read', 'write'],
      },
      isSystem: true,
    },
  })

  const engineerRole = await prisma.role.create({
    data: {
      name: 'engineer',
      description: 'R&D Engineer',
      permissions: {
        projects: ['read', 'write'],
        financials: ['read'],
        competitors: ['read'],
        tasks: ['read', 'write'],
      },
      isSystem: false,
    },
  })

  // 2. Создайте пользователей
  console.log('👤 Creating users...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@feleti.com',
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 12),
      fullName: 'Admin User',
      roleId: adminRole.id,
    },
  })

  const engineer1 = await prisma.user.create({
    data: {
      email: 'ivanov@feleti.com',
      username: 'ivanov',
      passwordHash: await bcrypt.hash('engineer123', 12),
      fullName: 'Ivan Ivanov',
      roleId: engineerRole.id,
    },
  })

  const engineer2 = await prisma.user.create({
    data: {
      email: 'petrov@feleti.com',
      username: 'petrov',
      passwordHash: await bcrypt.hash('engineer123', 12),
      fullName: 'Petr Petrov',
      roleId: engineerRole.id,
    },
  })

  // 3. Создайте конкурентов
  console.log('🏆 Creating competitors...')
  const gea = await prisma.competitor.create({
    data: {
      name: 'GEA Group',
      description: 'German industrial equipment manufacturer',
      website: 'https://www.gea.com',
      strengths: ['technology', 'global presence', 'quality'],
      weaknesses: ['high price', 'slow adaptation'],
    },
  })

  const laska = await prisma.competitor.create({
    data: {
      name: 'Laska',
      description: 'Czech refrigeration equipment manufacturer',
      website: 'https://www.laska.cz',
      strengths: ['price', 'service', 'local presence'],
      weaknesses: ['limited assortment'],
    },
  })

  const kilia = await prisma.competitor.create({
    data: {
      name: 'KILIA',
      description: 'Belarusian compressor equipment manufacturer',
      website: 'https://www.kilia.by',
      strengths: ['price', 'ease of maintenance'],
      weaknesses: ['outdated technologies'],
    },
  })

  const bitzer = await prisma.competitor.create({
    data: {
      name: 'BITZER',
      description: 'German compressor manufacturer',
      website: 'https://www.bitzer.de',
      strengths: ['quality', 'reliability', 'technology'],
      weaknesses: ['high price'],
    },
  })

  const frick = await prisma.competitor.create({
    data: {
      name: 'Frick',
      description: 'American industrial refrigeration systems manufacturer',
      website: 'https://www.frick.com',
      strengths: ['industrial solutions', 'reliability'],
      weaknesses: ['limited presence in CIS'],
    },
  })

  // 4. Создайте проекты
  console.log('📊 Creating projects...')
  const k200 = await prisma.project.create({
    data: {
      code: 'K-200',
      name: 'Compressor K-200',
      description: 'High-performance compressor for industrial cooling',
      stage: 'development',
      status: 'active',
      priority: 'high',
      ownerId: engineer1.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      budget: 5000000,
      scores: {
        technical: 85,
        market: 90,
        financial: 80,
      },
    },
  })

  const k300 = await prisma.project.create({
    data: {
      code: 'K-300',
      name: 'Compressor K-300',
      description: 'Ultra-powerful compressor for heavy industry',
      stage: 'concept',
      status: 'active',
      priority: 'medium',
      ownerId: engineer2.id,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-06-30'),
      budget: 8000000,
      scores: {
        technical: 75,
        market: 85,
        financial: 70,
      },
    },
  })

  const v150 = await prisma.project.create({
    data: {
      code: 'V-150',
      name: 'Fan V-150',
      description: 'Energy-efficient fan for ventilation systems',
      stage: 'testing',
      status: 'active',
      priority: 'high',
      ownerId: engineer1.id,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
      budget: 3000000,
      scores: {
        technical: 90,
        market: 80,
        financial: 85,
      },
    },
  })

  // 5. Создайте связи проектов с конкурентами
  console.log('🔗 Creating competitor-project links...')
  await prisma.competitorProject.createMany({
    data: [
      { projectId: k200.id, competitorId: gea.id, notes: 'Direct competitor in industrial segment' },
      { projectId: k200.id, competitorId: bitzer.id, notes: 'Technology benchmark' },
      { projectId: k300.id, competitorId: frick.id, notes: 'Heavy industry solutions' },
      { projectId: v150.id, competitorId: laska.id, notes: 'Regional competitor' },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('📊 Demo data summary:')
  console.log('   - 2 roles (admin, engineer)')
  console.log('   - 3 users')
  console.log('   - 5 competitors')
  console.log('   - 3 projects')
  console.log('   - 4 competitor-project links')
  console.log('')
  console.log('🔑 Login credentials:')
  console.log('   Admin: admin@feleti.com / admin123')
  console.log('   Engineer: ivanov@feleti.com / engineer123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })