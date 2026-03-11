import { chromium } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup for E2E tests
 * Logs in once via API and saves authentication state to avoid rate limiting
 */
async function globalSetup() {
  const baseURL =
    process.env.CI || process.env.DOCKER ? 'http://localhost' : 'http://localhost:5173';
  const apiURL = 'http://localhost:3001';

  // Use absolute path for auth file - same directory as this file
  const authFile = path.join(__dirname, '.auth.json');

  try {
    // Login via API to get tokens
    const loginResponse = await fetch(`${apiURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@feleti.com',
        password: 'admin123',
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken;

    // Now use browser to set localStorage
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to the app
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Set localStorage with auth token
    await page.evaluate((token) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
    }, accessToken);

    // Reload to apply auth
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Save authentication state
    await page.context().storageState({ path: authFile });

    await browser.close();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
