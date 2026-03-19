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

// Mock settings service
vi.mock('../../settings/settings.service', () => ({
  getSettingByKey: vi.fn(),
}));

import { prisma } from '../../../lib/prisma';
import { getSettingByKey } from '../../settings/settings.service';
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
    it('should throw error when API key is not configured', async () => {
      vi.mocked(getSettingByKey).mockResolvedValue(null);

      await expect(service.aiChat('block-1', 'user-1', 'Hello', [])).rejects.toThrow(
        'AI-ассистент не настроен'
      );
    });

    it('should use settings from database', async () => {
      // Mock settings from DB
      vi.mocked(getSettingByKey)
        .mockResolvedValueOnce({ value: 'deepseek' } as any) // provider
        .mockResolvedValueOnce({ value: 'deepseek-chat' } as any) // model
        .mockResolvedValueOnce({ value: 'sk-test-key' } as any) // api_key
        .mockResolvedValueOnce({ value: '1000' } as any); // max_tokens

      // Mock block
      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        templateBlock: {
          aiPrompt: 'Ты эксперт',
        },
      } as any);

      // Mock saveAiMessage
      vi.mocked(prisma.projectBlock.update).mockResolvedValue({} as any);

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Ответ AI FLAG:red:Риск:Описание риска' } }],
        }),
      } as any);

      const result = await service.aiChat('block-1', 'user-1', 'Hello', []);

      // Проверяем что fetch был вызван с правильными параметрами
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('deepseek-chat'),
        })
      );

      // Проверяем результат
      expect(result.text).toBeDefined();
      expect(result.flags).toHaveLength(1);
      expect(result.flags?.[0].level).toBe('red');
    });

    it('should handle different providers correctly', async () => {
      // Test for Anthropic
      vi.mocked(getSettingByKey)
        .mockResolvedValueOnce({ value: 'anthropic' } as any) // provider
        .mockResolvedValueOnce({ value: 'claude-sonnet-4-20250514' } as any) // model
        .mockResolvedValueOnce({ value: 'sk-ant-test' } as any) // api_key
        .mockResolvedValueOnce({ value: '1000' } as any); // max_tokens

      vi.mocked(prisma.projectBlock.findUnique).mockResolvedValue({
        id: 'block-1',
        templateBlock: { aiPrompt: 'Test' },
      } as any);

      vi.mocked(prisma.projectBlock.update).mockResolvedValue({} as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Ответ Claude' }],
        }),
      } as any);

      await service.aiChat('block-1', 'user-1', 'Hello', []);

      // Проверяем Anthropic-specific headers
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
            'anthropic-version': '2023-06-01',
          }),
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

      const result = await service.saveAiMessage('block-1', 'user-1', {
        role: 'assistant',
        content: 'Test',
        flags: [{ level: 'red', title: 'Risk', text: 'Description' }],
      });

      expect(result.status).toBe('IN_PROGRESS');
      expect(prisma.projectBlock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aiHistory: expect.any(Array),
            aiFlags: expect.any(Array),
          }),
        })
      );
    });
  });
});
