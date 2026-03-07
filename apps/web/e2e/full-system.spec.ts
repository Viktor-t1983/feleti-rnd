import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost';

test.describe('FELETI R&D — Полная проверка системы', () => {
  test('1. Страница входа открывается', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/FELETI/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('2. Неверный пароль показывает ошибку', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@feleti.com');
    await page.fill('input[type="password"]', 'WRONG_PASSWORD');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"], .error, .toast')).toBeVisible({ timeout: 5000 });
  });

  test('3. Успешный вход переходит на dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@feleti.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|projects|home/i, { timeout: 10000 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('4. Список проектов отображается', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@feleti.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/projects`);
    await expect(page.locator('table, [data-testid="projects-list"], .project-card')).toBeVisible({
      timeout: 10000,
    });
  });

  test('5. Создание нового проекта', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@feleti.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/projects`);
    const createButton = page.locator(
      'button:has-text("Создать"), button:has-text("Новый"), button:has-text("Create")'
    );
    await createButton.click();
    await page.fill('input[name="name"], input[placeholder*="название"]', 'E2E Тест Проект');
    await page.fill('input[name="code"], input[placeholder*="код"]', 'E2E-TEST-001');
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Сохранить"), button:has-text("Создать")'
    );
    await submitButton.click();
    await expect(page.locator('text=E2E Тест Проект')).toBeVisible({ timeout: 10000 });
  });

  test('6. Финансовые расчёты работают', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@feleti.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/calculations`);
    const investmentInput = page.locator('input[name*="invest"], input[placeholder*="инвест"]');
    if (await investmentInput.isVisible()) {
      await investmentInput.fill('1000000');
      await page.click('button:has-text("Рассчитать"), button:has-text("Calculate")');
      await expect(page.locator('text=NPV, text=IRR')).toBeVisible({ timeout: 10000 });
    }
  });

  test('7. Адаптивность — мобильный вид', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
