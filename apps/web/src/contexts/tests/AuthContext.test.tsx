import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthProvider, useAuth } from '../AuthContext';

// Mock api module BEFORE importing AuthContext
vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initial state', () => {
    it('should have null user and loading false initially (after initialization)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for useEffect to complete
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load user from token on mount', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const { api } = await import('../../lib/api');
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      localStorage.setItem('accessToken', 'test-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/api/auth/me');
    });

    it('should not load user if no token', async () => {
      const { api } = await import('../../lib/api');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear token and user', async () => {
      localStorage.setItem('accessToken', 'test-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });
});
