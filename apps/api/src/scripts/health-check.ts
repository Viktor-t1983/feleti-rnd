import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function healthCheck() {
  // eslint-disable-next-line no-console
  console.log('🏥 FELETI Engineering Platform - Health Check\n');
  
  const results = {
    database: false,
    productClasses: false,
    rules: false,
    gates: false,
    calculations: false,
    ai: false
  };

  try {
    // 1. Database
    // eslint-disable-next-line no-console
    console.log('📊 Checking Database...');
    await prisma.$connect();
    results.database = true;
    // eslint-disable-next-line no-console
    console.log('✅ Database: OK\n');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database: FAILED\n', error);
  }

  try {
    // 2. Product Classes
    // eslint-disable-next-line no-console
    console.log('🏭 Checking Product Classes...');
    const classes = await prisma.productClass.findMany();
    results.productClasses = classes.length >= 3;
    // eslint-disable-next-line no-console
    console.log(`✅ Product Classes: ${classes.length} found\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Product Classes: FAILED\n');
  }

  try {
    // 3. Rules
    // eslint-disable-next-line no-console
    console.log('📏 Checking Engineering Rules...');
    const rules = await prisma.engineeringRule.findMany({
      where: { active: true }
    });
    results.rules = rules.length >= 5;
    // eslint-disable-next-line no-console
    console.log(`✅ Engineering Rules: ${rules.length} active\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Engineering Rules: FAILED\n');
  }

  try {
    // 4. Gates
    // eslint-disable-next-line no-console
    console.log('🚪 Checking Validation Gates...');
    const gates = await prisma.validationGate.findMany({
      where: { active: true }
    });
    results.gates = gates.length >= 5;
    // eslint-disable-next-line no-console
    console.log(`✅ Validation Gates: ${gates.length} active\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Validation Gates: FAILED\n');
  }

  try {
    // 5. Calculations
    // eslint-disable-next-line no-console
    console.log('🧮 Checking Calculation Blocks...');
    const blocks = await prisma.calculationBlock.findMany({
      where: { active: true }
    });
    results.calculations = blocks.length >= 3;
    // eslint-disable-next-line no-console
    console.log(`✅ Calculation Blocks: ${blocks.length} active\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Calculation Blocks: FAILED\n');
  }

  try {
    // 6. AI - Check environment variable
    // eslint-disable-next-line no-console
    console.log('🤖 Checking AI Provider...');
    const apiKey = process.env['DEEPSEEK_API_KEY'];
    results.ai = !!apiKey && apiKey.length > 0;
    if (results.ai) {
      // eslint-disable-next-line no-console
      console.log('✅ AI Provider: DeepSeek configured\n');
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ AI Provider: Not configured (optional)\n');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️ AI Provider: Not available (optional)\n');
  }

  // Summary
  // eslint-disable-next-line no-console
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // eslint-disable-next-line no-console
  console.log('📊 SUMMARY:');
  // eslint-disable-next-line no-console
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const critical = ['database', 'productClasses', 'rules', 'gates', 'calculations'];
  const criticalPassed = critical.filter(k => results[k as keyof typeof results]).length;
  
  // eslint-disable-next-line no-console
  console.log(`Total Checks: ${passed}/${total}`);
  // eslint-disable-next-line no-console
  console.log(`Critical Checks: ${criticalPassed}/${critical.length}`);
  
  if (criticalPassed === critical.length) {
    // eslint-disable-next-line no-console
    console.log('\n✅ System Status: HEALTHY');
    // eslint-disable-next-line no-console
    console.log('🚀 Ready for production!\n');
  } else {
    // eslint-disable-next-line no-console
    console.log('\n❌ System Status: UNHEALTHY');
    // eslint-disable-next-line no-console
    console.log('⚠️ Please fix issues before deployment\n');
  }

  await prisma.$disconnect();
  
  return criticalPassed === critical.length;
}

healthCheck()
  .then(healthy => {
    process.exit(healthy ? 0 : 1);
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
