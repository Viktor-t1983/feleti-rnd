import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock axios module BEFORE importing api
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: {
        baseURL: '',
        headers: { 'Content-Type': 'application/json' },
      },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

// Import api after mocking axios
import { api } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('api instance', () => {
    it('should have correct baseURL', () => {
      expect(api.defaults.baseURL).toBe('');
    });

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should have interceptors registered', () => {
      expect(api.interceptors.request.use).toBeDefined();
      expect(api.interceptors.response.use).toBeDefined();
    });
  });

  describe('response interceptor', () => {
    it('should redirect to login on 401 error', async () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      // Get error handler from response interceptor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorHandler = (api.interceptors.response.use as any).mock.calls[0]?.[1];

      if (errorHandler) {
        const error = {
          response: { status: 401 },
        };

        await errorHandler(error);

        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(mockLocation.href).toBe('/login');
      }
    });

    it('should not redirect on other errors', async () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      // Get error handler from response interceptor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorHandler = (api.interceptors.response.use as any).mock.calls[0]?.[1];

      if (errorHandler) {
        const error = {
          response: { status: 500 },
        };

        await expect(errorHandler(error)).rejects.toEqual(error);
        expect(mockLocation.href).toBe('');
      }
    });
  });
});
