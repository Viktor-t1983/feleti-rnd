/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Charter Service Tests
 * Тесты для сервиса уставов проектов и AI-чата
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    projectBlock: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    templateBlock: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock AI providers service
vi.mock('../../ai/ai-providers.service', () => ({
  getBlockAIConfig: vi.fn(),
  getProviderByCode: vi.fn(),
  getProviderApiKey: vi.fn(),
  getNextFallbackProvider: vi.fn(),
  isAutoFallbackEnabled: vi.fn(),
  getResearchProvider: vi.fn(),
}));

import { prisma } from '../../../lib/prisma';
import {
  getBlockAIConfig,
  getProviderByCode,
  getProviderApiKey,
  isAutoFallbackEnabled,
  getResearchProvider,
} from '../../ai/ai-providers.service';
import { CharterService } from '../charter.service';

describe('CharterService', () => {
  let service: CharterService;

  beforeEach(() => {
    service = new CharterService();
    vi.clearAllMocks();
  });

  describe('getTemplateBlocks', () => {
    it('should return template blocks for equipment type', async () => {
      const mockBlocks = [
        { id: '1', name: 'Block 1', sortOrder: 0 },
        { id: '2', name: 'Block 2', sortOrder: 1 },
      ];
      vi.mocked(prisma.templateBlock.findMany).mockResolvedValue(mockBlocks as any);

      const result = await service.getTemplateBlocks('eq-1');

      expect(result).toEqual(mockBlocks);
      expect(prisma.templateBlock.findMany).toHaveBeenCalledWith({
        where: { equipmentTypeId: 'eq-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('aiChat', () => {
    it('should throw error when block is not found', async () => {
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue(null);

      await expect(service.aiChat('block-1', 'user-1', 'Hello', [])).rejects.toThrow(
        'Блок не найден'
      );
    });

    it('should throw error when API key is not configured', async () => {
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        templateBlock: {
          aiModel: 'deepseek',
        },
      } as any);

      vi.mocked(getBlockAIConfig).mockResolvedValue({
        primaryProvider: 'deepseek',
      });
      vi.mocked(getProviderByCode).mockResolvedValue({
        providerCode: 'deepseek',
        apiEndpoint: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
      });
      vi.mocked(getProviderApiKey).mockResolvedValue(null);

      await expect(service.aiChat('block-1', 'user-1', 'Hello', [])).rejects.toThrow(
        'API ключ для deepseek'
      );
    });

    it('should use settings from database', async () => {
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        templateBlock: {
          aiModel: 'deepseek',
          aiPrompt: 'Ты эксперт',
        },
      } as any);

      vi.mocked(getBlockAIConfig).mockResolvedValue({
        primaryProvider: 'deepseek',
      });

      vi.mocked(getProviderByCode).mockResolvedValue({
        providerCode: 'deepseek',
        apiEndpoint: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
      });

      vi.mocked(getProviderApiKey).mockResolvedValue('sk-test-key');

      vi.mocked(isAutoFallbackEnabled).mockResolvedValue(false);
      vi.mocked(getResearchProvider).mockResolvedValue(null);

      vi.mocked(prisma.projectBlock.update).mockResolvedValue({} as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Ответ AI FLAG:red:Риск:Описание риска' } }],
        }),
      } as any);

      const result = await service.aiChat('block-1', 'user-1', 'Hello', []);

      expect(result.text).toBeDefined();
      expect(result.flags).toHaveLength(1);
      expect(result.flags?.[0].level).toBe('red');
    });

    it('should handle different providers correctly', async () => {
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        templateBlock: { aiModel: 'deepseek', aiPrompt: 'Test' },
      } as any);

      vi.mocked(getBlockAIConfig).mockResolvedValue({
        primaryProvider: 'deepseek',
      });

      vi.mocked(getProviderByCode).mockResolvedValue({
        providerCode: 'deepseek',
        apiEndpoint: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
      });

      vi.mocked(getProviderApiKey).mockResolvedValue('sk-test-key');

      vi.mocked(isAutoFallbackEnabled).mockResolvedValue(false);
      vi.mocked(getResearchProvider).mockResolvedValue(null);

      vi.mocked(prisma.projectBlock.update).mockResolvedValue({} as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Ответ AI' } }],
        }),
      } as any);

      await service.aiChat('block-1', 'user-1', 'Hello', []);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('saveAiMessage', () => {
    it('should save AI message and flags', async () => {
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        aiHistory: [],
        aiFlags: [],
      } as any);

      vi.mocked(prisma.projectBlock.update).mockResolvedValue({
        id: 'block-1',
        status: 'IN_PROGRESS',
      } as any);

      const result = await service.saveAiMessage(
        'block-1',
        'user-1',
        'Test message',
        []
      );

      expect(result).toBeDefined();
      expect(prisma.projectBlock.update).toHaveBeenCalled();
    });
  });
});
