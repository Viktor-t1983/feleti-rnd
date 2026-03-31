import { prisma } from './src/lib/prisma';

async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: { category: 'ai' },
    orderBy: { key: 'asc' },
  });
  
  console.log('AI Settings found:', settings.length);
  settings.forEach(s => {
    console.log(`- ${s.key}: ${s.label}`);
  });
  
  const providers = await prisma.aIProviderConfig.findMany({
    orderBy: { priority: 'asc' },
  });
  
  console.log('\nAI Providers found:', providers.length);
  providers.forEach(p => {
    console.log(`- ${p.providerCode}: ${p.name} (priority: ${p.priority})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
