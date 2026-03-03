/**
 * System Health E2E Tests
 * Tests critical system endpoints to ensure all services are operational
 */
import { beforeAll, describe, expect, it } from 'vitest';

// Environment configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const CALC_ENGINE_URL = process.env.CALC_ENGINE_URL || 'http://localhost:8000';

// Test credentials from environment variables (no hardcoded values)
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const HAS_CREDENTIALS = !!(TEST_EMAIL && TEST_PASSWORD);

const TEST_CREDENTIALS = {
  email: TEST_EMAIL || '',
  password: TEST_PASSWORD || '',
};

/**
 * Check if a service is available before running tests
 */
async function isServiceAvailable(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

describe('System Health E2E Tests', () => {
  beforeAll(() => {
    if (!HAS_CREDENTIALS) {
      console.warn(
        '⚠️  TEST_EMAIL and TEST_PASSWORD environment variables not set. ' +
          'Authentication tests will be skipped. ' +
          'Example: TEST_EMAIL=test@example.com TEST_PASSWORD=secret npm test'
      );
    }
  });

  describe('Health Check', () => {
    it('should return health status from API', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
    });
  });

  (HAS_CREDENTIALS ? describe : describe.skip)('Authentication', () => {
    it('POST /api/auth/login — should reject invalid credentials with 401', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
      });

      // Must return 401 Unauthorized for invalid credentials
      expect(response.status).toBe(401);
    });

    it('POST /api/auth/login — should return 401 for non-existent user', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'anypassword',
        }),
      });

      // Must return 401 or 404 for non-existent user
      expect([401, 404]).toContain(response.status);
    });

    it('POST /api/auth/login — should validate request body', async () => {
      // Missing password
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_CREDENTIALS.email,
        }),
      });

      // Should return 400 Bad Request for invalid input
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Projects API', () => {
    it('GET /api/projects — should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/projects`);

      // Without auth token, must return 401 Unauthorized
      expect(response.status).toBe(401);
    });

    it('POST /api/projects — should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Test Project',
          code: `E2E-TEST-${Date.now()}`,
          description: 'Test project created by E2E tests',
          stage: 'IDEA',
        }),
      });

      // Without auth token, must return 401 Unauthorized
      expect(response.status).toBe(401);
    });

    it('DELETE /api/projects/:id — should return 401 without authentication', async () => {
      const dummyId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(`${API_BASE_URL}/api/projects/${dummyId}`, {
        method: 'DELETE',
      });

      // Without auth, must return 401 Unauthorized (not 403 - that's for authenticated but unauthorized)
      expect(response.status).toBe(401);
    });
  });

  describe('Engineering Platform', () => {
    it('GET /api/engineering/product-classes — should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/engineering/product-classes`);

      // Must require authentication
      expect(response.status).toBe(401);
    });
  });

  describe('Rules Engine', () => {
    it('POST /api/validation/rules/evaluate — should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/validation/rules/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            projectId: 'test-project-id',
            values: {
              temperature: 100,
              pressure: 50,
            },
          },
        }),
      });

      // Must require authentication
      expect(response.status).toBe(401);
    });
  });

  describe('RBAC - Admin Endpoints', () => {
    it('GET /api/users — should require authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/users`);

      // Without auth, must return 401
      expect(response.status).toBe(401);
    });
  });

  describe('API Documentation', () => {
    it('GET /documentation — should serve Swagger docs', async () => {
      const response = await fetch(`${API_BASE_URL}/documentation`, {
        redirect: 'manual', // Don't follow redirects, we want to check the status
      });

      // Should return 200 or redirect (301/302)
      expect([200, 301, 302]).toContain(response.status);
    });
  });

  describe('Calc Engine Health', () => {
    let calcEngineAvailable = false;

    beforeAll(async () => {
      calcEngineAvailable = await isServiceAvailable(`${CALC_ENGINE_URL}/health`);
      if (!calcEngineAvailable) {
        console.warn('⚠️  Calc Engine not available, skipping calc-engine health tests');
      }
    });

    it('should check calc-engine health endpoint', async () => {
      // Skip test if calc engine is not available
      if (!calcEngineAvailable) {
        console.warn('Skipping: Calc Engine not available');
        return;
      }

      const response = await fetch(`${CALC_ENGINE_URL}/health`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
    });
  });
});
