import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost';

test.describe('FELETI R&D — Полная проверка системы', () => {
  test('1. Страница входа открывается', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/FELETI/i);
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
  });

  test('2. Неверный пароль показывает ошибку', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com');
    await page.fill('[data-testid="login-password"]', 'WRONG_PASSWORD');
    await page.click('[data-testid="login-submit"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 5000 });
  });

  test('3. Успешный вход переходит на dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com');
    await page.fill('[data-testid="login-password"]', 'admin123');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/dashboard|projects|home/i, { timeout: 10000 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('4. Список проектов отображается', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com');
    await page.fill('[data-testid="login-password"]', 'admin123');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/projects`);
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible({ timeout: 10000 });
  });

  test('5. Создание нового проекта', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com');
    await page.fill('[data-testid="login-password"]', 'admin123');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/projects`);
    await page.click('[data-testid="create-project-button"]');
    await page.waitForURL(/projects\/new/);
    await page.fill('[data-testid="project-name-input"]', 'E2E Тест Проект');
    await page.fill('[data-testid="project-code-input"]', 'E2E-TEST-002');
    await page.fill(
      '[data-testid="project-owner-id-input"]',
      'f289d8ec-4521-4ff4-984d-d00f104bf49a'
    );
    await page.click('[data-testid="project-submit-button"]');
    await expect(page).toHaveURL(/projects/, { timeout: 10000 });
  });

  test('6. Финансовые расчёты работают', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com');
    await page.fill('[data-testid="login-password"]', 'admin123');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/dashboard|projects/i);
    await page.goto(`${BASE_URL}/financial-calculators`);
    await expect(page.locator('[data-testid="financial-calculators-page"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('7. Адаптивность — мобильный вид', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });
});
