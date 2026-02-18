import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:5173')
    await page.evaluate(() => localStorage.clear())
  })

  test('user can register and login', async ({ page }) => {
    // Generate unique email to avoid conflict
    const timestamp = Date.now()
    const uniqueEmail = `newuser${timestamp}@test.com`
    
    // Register
    await page.goto('http://localhost:5173/register')
    await page.waitForLoadState('networkidle')
    
    await page.fill('[data-testid="register-email"]', uniqueEmail)
    await page.fill('[data-testid="register-username"]', `newuser${timestamp}`)
    await page.fill('[data-testid="register-password"]', 'Password123!')
    await page.fill('[data-testid="register-fullname"]', 'New User')
    
    await page.click('[data-testid="register-submit"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for redirect

    // After registration, user is automatically logged in and redirected to dashboard
    // This is the current behavior, so we'll check for dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()

    // Logout to test login flow
    await page.click('button:has-text("Sign out")')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Should be on login page after logout
    await expect(page).toHaveURL(/login/)

    // Login with newly created user
    await page.fill('[data-testid="login-email"]', uniqueEmail)
    await page.fill('[data-testid="login-password"]', 'Password123!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for redirect

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
  })

  test('user can login with demo credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('[data-testid="login-email"]', 'admin@feleti.com')
    await page.fill('[data-testid="login-password"]', 'admin123')
    await page.click('[data-testid="login-submit"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for redirect

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
  })

  test('shows validation errors on empty login form', async ({ page }) => {
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.click('[data-testid="login-submit"]')

    await expect(page.locator('text=Invalid email')).toBeVisible()
    await expect(page.locator('text=Password required')).toBeVisible()
  })

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('no console errors on login page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // Check that form is visible and usable
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()

    // Take screenshot for visual verification
    await page.screenshot({ path: 'e2e-screenshots/login-mobile.png' })
  })
})