/**
 * AI Providers Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AIProvidersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should have getAllProviders function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getAllProviders).toBe('function');
    });

    it('should have getEnabledProviders function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getEnabledProviders).toBe('function');
    });

    it('should have getProviderByCode function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getProviderByCode).toBe('function');
    });

    it('should have getBlockAIConfig function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getBlockAIConfig).toBe('function');
    });

    it('should have getFallbackChain function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getFallbackChain).toBe('function');
    });

    it('should have isAutoFallbackEnabled function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.isAutoFallbackEnabled).toBe('function');
    });

    it('should have getResearchProvider function', async () => {
      const module = await import('../ai-providers.service');
      expect(typeof module.getResearchProvider).toBe('function');
    });
  });
});
