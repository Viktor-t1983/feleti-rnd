/**
 * Charter Service Tests
 * Unit tests for charter templates and project blocks
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma before importing the service
const mockPrisma = vi.hoisted(() => ({
  templateBlock: {
    findMany: vi.fn().mockResolvedValue([
      { id: 'tb-1', name: 'Привод', icon: '', sortOrder: 0, blockType: 'PARAMS_TABLE', isRequired: true },
      { id: 'tb-2', name: 'Чаша', icon: '', sortOrder: 1, blockType: 'PARAMS_TABLE', isRequired: true },
    ]),
    create: vi.fn().mockResolvedValue({ id: 'tb-1', name: 'Привод', icon: '' }),
    update: vi.fn().mockResolvedValue({ id: 'tb-1', name: 'Привод обновлён' }),
    delete: vi.fn().mockResolvedValue({ id: 'tb-1' }),
  },
  projectBlock: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'pb-1', data: {}, aiHistory: [], aiFlags: [], status: 'EMPTY'
    }),
    update: vi.fn().mockResolvedValue({
      id: 'pb-1', status: 'IN_PROGRESS', aiHistory: [{ role: 'user', content: 'тест' }]
    }),
    create: vi.fn().mockResolvedValue({ id: 'pb-1' }),
  },
  project: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'proj-1',
      name: 'Фаршмешалка 3т',
      ownerId: 'user-1',
      equipmentTypes: [{
        id: 'eq-1',
        templateBlocks: [{ id: 'tb-1' }, { id: 'tb-2' }]
      }],
      blocks: [
        { id: 'pb-1', templateBlockId: 'tb-1', templateBlock: { id: 'tb-1', name: 'Привод' } },
        { id: 'pb-2', templateBlockId: 'tb-2', templateBlock: { id: 'tb-2', name: 'Чаша' } },
      ]
    }),
  },
}));

vi.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));

// Import service after mock setup
import { charterService } from '../charter.service';

describe('CharterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Blocks', () => {
    it('получает блоки шаблона', async () => {
      const blocks = await charterService.getTemplateBlocks('eq-1');
      expect(blocks).toHaveLength(2);
      expect(blocks[0].name).toBe('Привод');
      expect(mockPrisma.templateBlock.findMany).toHaveBeenCalledWith({
        where: { equipmentTypeId: 'eq-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('создаёт блок шаблона', async () => {
      const block = await charterService.createTemplateBlock({
        equipmentTypeId: 'eq-1',
        name: 'Привод',
        icon: '',
        blockType: 'PARAMS_TABLE',
      });
      expect(block.name).toBe('Привод');
      expect(mockPrisma.templateBlock.create).toHaveBeenCalled();
    });

    it('обновляет блок шаблона', async () => {
      const block = await charterService.updateTemplateBlock('tb-1', { name: 'Привод обновлён' });
      expect(block.name).toBe('Привод обновлён');
      expect(mockPrisma.templateBlock.update).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
        data: expect.objectContaining({ name: 'Привод обновлён' }),
      });
    });

    it('удаляет блок шаблона', async () => {
      const result = await charterService.deleteTemplateBlock('tb-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.templateBlock.delete).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
      });
    });

    it('изменяет порядок блоков', async () => {
      const result = await charterService.reorderBlocks([
        { id: 'tb-1', sortOrder: 1 },
        { id: 'tb-2', sortOrder: 0 },
      ]);
      expect(result.success).toBe(true);
      expect(mockPrisma.templateBlock.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Project Charter', () => {
    it('получает устав проекта с блоками', async () => {
      const charter = await charterService.getProjectCharter('proj-1');
      expect(charter).toBeDefined();
      expect(charter.blocks).toHaveLength(2);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        include: expect.any(Object),
      });
    });

    it('создаёт недостающие блоки при получении устава', async () => {
      // Мокаем проект без блоков
      mockPrisma.project.findUnique.mockResolvedValueOnce({
        id: 'proj-1',
        name: 'Фаршмешалка 3т',
        ownerId: 'user-1',
        equipmentTypes: [{
          id: 'eq-1',
          templateBlocks: [{ id: 'tb-1' }, { id: 'tb-2' }, { id: 'tb-3' }]
        }],
        blocks: [
          { id: 'pb-1', templateBlockId: 'tb-1', templateBlock: { id: 'tb-1', name: 'Привод' } },
        ]
      });

      await charterService.getProjectCharter('proj-1');
      
      // Должны создаться 2 недостающих блока
      expect(mockPrisma.projectBlock.create).toHaveBeenCalledTimes(2);
    });

    it('выбрасывает ошибку если проект не найден', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce(null);
      
      await expect(charterService.getProjectCharter('non-existent')).rejects.toThrow('Project not found');
    });
  });

  describe('Project Blocks', () => {
    it('обновляет блок проекта', async () => {
      const block = await charterService.updateProjectBlock('pb-1', 'user-1', {
        data: { power: '11kW' },
        status: 'DONE',
      });
      expect(block).toBeDefined();
      expect(mockPrisma.projectBlock.update).toHaveBeenCalledWith({
        where: { id: 'pb-1' },
        data: expect.objectContaining({
          data: { power: '11kW' },
          status: 'DONE',
          updatedBy: 'user-1',
        }),
      });
    });

    it('сохраняет AI-сообщение в историю блока', async () => {
      const block = await charterService.saveAiMessage('pb-1', 'user-1', {
        role: 'user',
        content: 'Мощность привода 11 кВт на 1.5т',
      });
      expect(block.status).toBe('IN_PROGRESS');
      expect(mockPrisma.projectBlock.update).toHaveBeenCalledWith({
        where: { id: 'pb-1' },
        data: expect.objectContaining({
          aiHistory: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Мощность привода 11 кВт на 1.5т',
            })
          ]),
          updatedBy: 'user-1',
          status: 'IN_PROGRESS',
        }),
      });
    });

    it('сохраняет флаги рисков из AI-сообщения', async () => {
      const block = await charterService.saveAiMessage('pb-1', 'user-1', {
        role: 'assistant',
        content: 'Обнаружен риск',
        flags: [{ level: 'red', title: 'Высокая нагрузка', text: 'Редуктор работает на пределе' }],
      });
      expect(block).toBeDefined();
      expect(mockPrisma.projectBlock.update).toHaveBeenCalledWith({
        where: { id: 'pb-1' },
        data: expect.objectContaining({
          aiFlags: expect.arrayContaining([
            expect.objectContaining({
              level: 'red',
              title: 'Высокая нагрузка',
            })
          ]),
        }),
      });
    });

    it('выбрасывает ошибку если блок не найден при сохранении AI-сообщения', async () => {
      mockPrisma.projectBlock.findUnique.mockResolvedValueOnce(null);
      
      await expect(
        charterService.saveAiMessage('non-existent', 'user-1', {
          role: 'user',
          content: 'test',
        })
      ).rejects.toThrow('Block not found');
    });
  });
});
