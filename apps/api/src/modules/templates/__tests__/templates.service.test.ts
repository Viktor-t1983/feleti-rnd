/**
 * Templates Service Tests
 * TDD: Tests written BEFORE implementation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplatesService } from '../templates.service';

import { prisma } from '../../../lib/prisma';

// Type definitions for mock objects
interface MockTemplate {
  id: string;
  name: string;
  description: string | null;
  defaultStage: string;
  estimatedBudget: number | null;
  estimatedDays: number | null;
  teamSize: number | null;
  checklist: string[] | null;
  createdById: string;
  createdBy: {
    fullName: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Helper to get typed mock functions
const getMockedPrisma = (): {
  projectTemplate: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
} =>
  prisma as unknown as {
    projectTemplate: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

// Mock Prisma Singleton
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    projectTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('TemplatesService', () => {
  let service: TemplatesService;
  let mockedPrisma: ReturnType<typeof getMockedPrisma>;

  const mockTemplate: MockTemplate = {
    id: 'tpl-1',
    name: 'НИР',
    description: 'Научно-исследовательская работа',
    defaultStage: 'CONCEPT',
    estimatedBudget: 1000000,
    estimatedDays: 180,
    teamSize: 5,
    checklist: ['Шаг 1', 'Шаг 2'],
    createdById: 'user-1',
    createdBy: {
      fullName: 'Admin User',
      username: 'admin',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TemplatesService();
    mockedPrisma = getMockedPrisma();
  });

  describe('create', () => {
    it('should create template with all fields', async () => {
      mockedPrisma.projectTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.create({
        name: 'НИР',
        description: 'Описание',
        defaultStage: 'CONCEPT',
        estimatedBudget: 1000000,
        estimatedDays: 180,
        teamSize: 5,
        checklist: ['Шаг 1'],
        createdById: 'user-1',
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('НИР');
      expect(mockedPrisma.projectTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'НИР',
            description: 'Описание',
            defaultStage: 'CONCEPT',
          }),
          include: {
            createdBy: {
              select: {
                fullName: true,
                username: true,
              },
            },
          },
        })
      );
    });

    it('should create template with minimal fields', async () => {
      const minimalTemplate = {
        ...mockTemplate,
        id: 'tpl-minimal',
        name: 'Minimal Template',
        description: null,
        estimatedBudget: null,
        estimatedDays: null,
        teamSize: null,
        checklist: [],
        defaultStage: 'IDEA',
      };
      mockedPrisma.projectTemplate.create.mockResolvedValue(minimalTemplate);

      const result = await service.create({
        name: 'Minimal Template',
        createdById: 'user-1',
      });

      expect(result.name).toBe('Minimal Template');
      expect(result.defaultStage).toBe('IDEA');
    });
  });

  describe('getAll', () => {
    it('should return all templates', async () => {
      const templates = [mockTemplate];
      mockedPrisma.projectTemplate.findMany.mockResolvedValue(templates);

      const result = await service.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('НИР');
      expect(mockedPrisma.projectTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: {
              select: {
                fullName: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when no templates', async () => {
      mockedPrisma.projectTemplate.findMany.mockResolvedValue([]);

      const result = await service.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return template by id', async () => {
      mockedPrisma.projectTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.getById('tpl-1');

      expect(result).toHaveProperty('name');
      expect(result?.name).toBe('НИР');
      expect(mockedPrisma.projectTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        include: {
          createdBy: {
            select: {
              fullName: true,
              username: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent template', async () => {
      mockedPrisma.projectTemplate.findUnique.mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update template name', async () => {
      const updatedTemplate = {
        ...mockTemplate,
        name: 'НИР обновлённый',
      };
      mockedPrisma.projectTemplate.update.mockResolvedValue(updatedTemplate);

      const result = await service.update('tpl-1', { name: 'НИР обновлённый' });

      expect(result.name).toBe('НИР обновлённый');
      expect(mockedPrisma.projectTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: { name: 'НИР обновлённый' },
      });
    });

    it('should update multiple fields', async () => {
      const updatedTemplate = {
        ...mockTemplate,
        name: 'Updated',
        estimatedBudget: 2000000,
        teamSize: 10,
      };
      mockedPrisma.projectTemplate.update.mockResolvedValue(updatedTemplate);

      const result = await service.update('tpl-1', {
        name: 'Updated',
        estimatedBudget: 2000000,
        teamSize: 10,
      });

      expect(result.name).toBe('Updated');
      expect(result.estimatedBudget).toBe(2000000);
      expect(result.teamSize).toBe(10);
    });
  });

  describe('delete', () => {
    it('should delete template', async () => {
      mockedPrisma.projectTemplate.delete.mockResolvedValue(mockTemplate);

      const result = await service.delete('tpl-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('tpl-1');
      expect(mockedPrisma.projectTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
      });
    });

    it('should throw NotFoundError for non-existent template', async () => {
      const prismaError = new Error('Record not found') as Error & { code: string };
      prismaError.code = 'P2025';
      mockedPrisma.projectTemplate.delete.mockRejectedValue(prismaError);

      await expect(service.delete('non-existent')).rejects.toThrow();
    });
  });
});
