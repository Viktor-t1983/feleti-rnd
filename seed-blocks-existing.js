const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Finding projects without blocks...');
  
  // Get all projects
  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
  });
  
  console.log(`Total projects: ${projects.length}`);
  
  // Get any equipment type to use
  const equipmentType = await prisma.equipmentType.findFirst();
  if (!equipmentType) {
    console.log('No equipment types found!');
    return;
  }
  console.log(`Using equipment type: ${equipmentType.name} (${equipmentType.id})`);
  
  // Get any user to be the updatedBy
  const user = await prisma.user.findFirst({ select: { id: true } });
  const userId = user?.id || 'system';
  console.log(`Using user ID: ${userId}`);
  
  // For each project, check if it has blocks
  for (const project of projects) {
    const blockCount = await prisma.projectBlock.count({
      where: { projectId: project.id },
    });
    
    if (blockCount === 0) {
      console.log(`Project ${project.code} has no blocks, initializing...`);
      
      try {
        // Initialize charter using existing endpoint logic
        const templateBlocks = await prisma.templateBlock.findMany({
          where: { equipmentTypeId: equipmentType.id },
          orderBy: { sortOrder: 'asc' },
        });
        
        console.log(`  Found ${templateBlocks.length} template blocks`);
        
        // Create project blocks
        for (const tb of templateBlocks) {
          await prisma.projectBlock.create({
            data: {
              projectId: project.id,
              templateBlockId: tb.id,
              status: 'EMPTY',
              data: {},
              updatedBy: userId,
            },
          });
        }
        
        console.log(`  Created ${templateBlocks.length} blocks for ${project.code}`);
      } catch (e) {
        console.error(`  Error: ${e.message}`);
      }
    } else {
      console.log(`Project ${project.code} already has ${blockCount} blocks`);
    }
  }
  
  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { prisma.$disconnect(); });