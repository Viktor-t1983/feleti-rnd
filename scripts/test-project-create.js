const { chromium } = require('playwright');

async function testProjectCreate() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:8080/login');
  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', 'admin@feleti.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  // Navigate to project create
  await page.goto('http://localhost:8080/projects/new');
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Fill form with F374476
  await page.fill('input[id="code"]', 'F374476');
  await page.fill('input[id="name"]', 'Тестовый проект F374476');
  await page.fill('textarea[id="description"]', 'Проверка новой валидации кода');
  await page.fill('input[id="budget"]', '1000000');
  
  // Get owner ID from current user
  const ownerId = '070f5fcf-c7f0-46fd-992c-af4da85dcdc4';
  await page.fill('input[id="ownerId"]', ownerId);
  
  await page.screenshot({ path: 'screenshots/project-form-filled.png' });
  console.log('Form filled screenshot: screenshots/project-form-filled.png');
  
  // Try to submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Check if redirected to projects list (success) or still on form (error)
  const url = page.url();
  if (url.includes('/projects') && !url.includes('/new')) {
    console.log('✅ Проект успешно создан!');
    await page.screenshot({ path: 'screenshots/project-created-success.png' });
  } else {
    console.log('❌ Ошибка создания проекта');
    await page.screenshot({ path: 'screenshots/project-create-error.png' });
  }
  
  await browser.close();
}

testProjectCreate().catch(console.error);
