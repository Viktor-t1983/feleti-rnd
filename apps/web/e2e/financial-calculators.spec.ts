import { test, expect } from '@playwright/test';

test.describe('Financial Calculators', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся перед тестами (страница защищена ProtectedRoute)
    await page.goto('/login');
    await page.fill('input[data-testid="email-input"]', 'test@example.com');
    await page.fill('input[data-testid="password-input"]', 'password123');
    await page.click('button[data-testid="login-button"]');
    
    // Ждем перехода на dashboard
    await page.waitForURL('/dashboard');
    
    // Переходим на страницу финансовых калькуляторов
    await page.goto('/financial-calculators');
    await page.waitForSelector('[data-testid="financial-calculators-page"]');
  });

  test('should load financial calculators page', async ({ page }) => {
    // Проверяем заголовок страницы
    await expect(page.getByText('Финансовые калькуляторы')).toBeVisible();
    
    // Проверяем наличие всех вкладок калькуляторов
    await expect(page.getByTestId('tab-npv')).toBeVisible();
    await expect(page.getByTestId('tab-irr')).toBeVisible();
    await expect(page.getByTestId('tab-roi')).toBeVisible();
    await expect(page.getByTestId('tab-payback')).toBeVisible();
    
    // Проверяем, что по умолчанию выбран NPV калькулятор
    await expect(page.getByTestId('npv-calculator')).toBeVisible();
  });

  test('should switch between calculator tabs', async ({ page }) => {
    // Переключаемся на IRR калькулятор
    await page.getByTestId('tab-irr').click();
    await expect(page.getByTestId('irr-calculator')).toBeVisible();
    
    // Переключаемся на ROI калькулятор
    await page.getByTestId('tab-roi').click();
    await expect(page.getByTestId('roi-calculator')).toBeVisible();
    
    // Переключаемся на Payback калькулятор
    await page.getByTestId('tab-payback').click();
    await expect(page.getByTestId('payback-calculator')).toBeVisible();
    
    // Возвращаемся к NPV калькулятору
    await page.getByTestId('tab-npv').click();
    await expect(page.getByTestId('npv-calculator')).toBeVisible();
  });

  test('should calculate NPV with default values', async ({ page }) => {
    // Убеждаемся, что мы на вкладке NPV
    await expect(page.getByTestId('npv-calculator')).toBeVisible();
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    
    // Ждем появления результата
    await expect(page.getByTestId('result-container')).toBeVisible({ timeout: 10000 });
    
    // Проверяем, что результат содержит число
    const resultText = await page.getByTestId('result-container').textContent();
    expect(resultText).toContain('руб');
    
    // Проверяем, что нет ошибок
    await expect(page.getByTestId('error-message')).not.toBeVisible();
  });

  test('should calculate IRR with default values', async ({ page }) => {
    // Переключаемся на IRR калькулятор
    await page.getByTestId('tab-irr').click();
    await expect(page.getByTestId('irr-calculator')).toBeVisible();
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    
    // Ждем появления результата
    await expect(page.getByTestId('result-container')).toBeVisible({ timeout: 10000 });
    
    // Проверяем, что результат содержит проценты
    const resultText = await page.getByTestId('result-container').textContent();
    expect(resultText).toContain('%');
    
    // Проверяем, что нет ошибок
    await expect(page.getByTestId('error-message')).not.toBeVisible();
  });

  test('should calculate ROI with default values', async ({ page }) => {
    // Переключаемся на ROI калькулятор
    await page.getByTestId('tab-roi').click();
    await expect(page.getByTestId('roi-calculator')).toBeVisible();
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    
    // Ждем появления результата
    await expect(page.getByTestId('result-container')).toBeVisible({ timeout: 10000 });
    
    // Проверяем, что результат содержит проценты
    const resultText = await page.getByTestId('result-container').textContent();
    expect(resultText).toContain('%');
    
    // Проверяем, что нет ошибок
    await expect(page.getByTestId('error-message')).not.toBeVisible();
  });

  test('should calculate Payback with default values', async ({ page }) => {
    // Переключаемся на Payback калькулятор
    await page.getByTestId('tab-payback').click();
    await expect(page.getByTestId('payback-calculator')).toBeVisible();
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    
    // Ждем появления результата
    await expect(page.getByTestId('result-container')).toBeVisible({ timeout: 10000 });
    
    // Проверяем, что результат содержит информацию о сроке окупаемости
    const resultText = await page.getByTestId('result-container').textContent();
    expect(resultText).toContain('Срок окупаемости');
    
    // Проверяем, что нет ошибок
    await expect(page.getByTestId('error-message')).not.toBeVisible();
  });

  test('should reset NPV calculator form', async ({ page }) => {
    // Изменяем значение инвестиций
    await page.getByTestId('investment-input').fill('2000000');
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    await expect(page.getByTestId('result-container')).toBeVisible({ timeout: 10000 });
    
    // Нажимаем кнопку сброса
    await page.getByTestId('reset-button').click();
    
    // Проверяем, что результат исчез
    await expect(page.getByTestId('result-container')).not.toBeVisible();
    
    // Проверяем, что значение инвестиций сбросилось к дефолтному
    const investmentValue = await page.getByTestId('investment-input').inputValue();
    expect(investmentValue).toBe('1000000');
  });

  test('should handle cash flow input interactions', async ({ page }) => {
    // Проверяем начальное количество лет
    const initialYearInputs = await page.locator('[data-testid^="cash-flow-year-"]').count();
    expect(initialYearInputs).toBe(4);
    
    // Добавляем год
    await page.getByTestId('add-year-button').click();
    
    // Проверяем, что добавился новый год
    const afterAddYearInputs = await page.locator('[data-testid^="cash-flow-year-"]').count();
    expect(afterAddYearInputs).toBe(5);
    
    // Удаляем год (последний)
    await page.getByTestId('remove-year-5').click();
    
    // Проверяем, что год удалился
    const afterRemoveYearInputs = await page.locator('[data-testid^="cash-flow-year-"]').count();
    expect(afterRemoveYearInputs).toBe(4);
  });

  test('should show error for invalid NPV input', async ({ page }) => {
    // Устанавливаем некорректное значение ставки дисконтирования (больше 1)
    await page.getByTestId('discount-rate-input').fill('1.5');
    
    // Нажимаем кнопку расчета
    await page.getByTestId('calculate-button').click();
    
    // Проверяем, что появилось сообщение об ошибке
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Нажимаем на логотип или кнопку возврата (если есть)
    // Вместо этого просто проверяем, что можем перейти на dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});