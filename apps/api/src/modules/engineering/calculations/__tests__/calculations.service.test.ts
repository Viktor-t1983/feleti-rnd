/* eslint-disable @typescript-eslint/no-explicit-any -- Mock data for testing */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CalculationRequest } from '../../types';

// Create hoisted mock for prisma
const mockPrisma = vi.hoisted(() => ({
  calculationBlock: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  calculation: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
}));

// Mock @prisma/client before any imports
vi.mock('@prisma/client', () => ({
  Prisma: {},
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock the prisma lib to return our mock
vi.mock('../../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock rules engine
vi.mock('../rules/rules-engine.service', () => ({
  rulesEngineService: {
    evaluateRules: vi.fn().mockResolvedValue([]),
  },
}));

// Import service after mocks are set up
import { CalculationsService } from '../calculations.service';

describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CalculationsService();
  });

  describe('execute', () => {
    const mockRequest: CalculationRequest = {
      projectId: 'proj-1',
      blockCode: 'TEST-BLOCK',
      inputs: { investment: 1000000, rate: 0.1 },
      executedBy: 'user-1',
    };

    const mockBlock = {
      id: 'block-1',
      code: 'TEST-BLOCK',
      active: true,
      inputSchema: [
        { name: 'investment', type: 'number', required: true },
        { name: 'rate', type: 'number', required: true },
      ],
      formulae: {
        result: 'investment * rate',
      },
    };

    it('should execute calculation successfully', async () => {
      mockPrisma.calculationBlock.findUnique.mockResolvedValue(mockBlock as any);
      mockPrisma.calculation.create.mockResolvedValue({
        id: 'calc-1',
        status: 'SUCCESS',
        createdAt: new Date(),
      } as any);

      const result = await service.execute(mockRequest);

      expect(result.status).toBe('SUCCESS');
      expect(mockPrisma.calculation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            blockId: 'block-1',
            status: 'SUCCESS',
          }),
        })
      );
    });

    it('should fail when block not found', async () => {
      mockPrisma.calculationBlock.findUnique.mockResolvedValue(null);

      await expect(service.execute(mockRequest)).rejects.toThrow('Block TEST-BLOCK not found');
    });

    it('should fail when block is inactive', async () => {
      mockPrisma.calculationBlock.findUnique.mockResolvedValue({
        ...mockBlock,
        active: false,
      } as any);

      await expect(service.execute(mockRequest)).rejects.toThrow('Block TEST-BLOCK is inactive');
    });

    it('should validate inputs and fail on missing required field', async () => {
      mockPrisma.calculationBlock.findUnique.mockResolvedValue(mockBlock as any);
      mockPrisma.calculation.create.mockResolvedValue({
        id: 'calc-failed',
        status: 'FAILED',
        createdAt: new Date(),
      } as any);

      const invalidRequest = {
        ...mockRequest,
        inputs: { investment: 1000000 }, // missing 'rate'
      };

      const result = await service.execute(invalidRequest);

      expect(result.status).toBe('FAILED');
    });
  });

  describe('getProjectCalculations', () => {
    it('should return project calculations', async () => {
      const mockCalculations = [
        { id: 'calc-1', projectId: 'proj-1', type: 'npv' },
        { id: 'calc-2', projectId: 'proj-1', type: 'irr' },
      ];

      mockPrisma.calculation.findMany.mockResolvedValue(mockCalculations as any);
      mockPrisma.calculation.count.mockResolvedValue(2);

      const result = await service.getProjectCalculations('proj-1');

      expect(result.calculations).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.calculation.findMany.mockResolvedValue([]);
      mockPrisma.calculation.count.mockResolvedValue(0);

      await service.getProjectCalculations('proj-1', { status: 'SUCCESS' });

      expect(mockPrisma.calculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-1',
            status: 'SUCCESS',
          }),
        })
      );
    });
  });

  describe('getCalculationStats', () => {
    it('should return calculation statistics', async () => {
      mockPrisma.calculation.count.mockResolvedValue(10);
      mockPrisma.calculation.groupBy.mockResolvedValue([
        { status: 'SUCCESS', _count: 7 },
        { status: 'FAILED', _count: 2 },
        { status: 'WARNING', _count: 1 },
      ] as any);
      mockPrisma.calculationBlock.findMany.mockResolvedValue([
        { category: 'financial', _count: { calculations: 5 } },
        { category: 'engineering', _count: { calculations: 5 } },
      ] as any);
      mockPrisma.calculation.aggregate.mockResolvedValue({
        _avg: { executionTime: 150 },
      } as any);

      const stats = await service.getCalculationStats();

      expect(stats.total).toBe(10);
      expect(stats.byStatus).toHaveLength(3);
      expect(stats.avgExecutionTime).toBe(150);
    });
  });

  describe('saveCalculation', () => {
    const mockSaveData = {
      projectId: 'proj-1',
      type: 'npv',
      category: 'FINANCIAL' as const,
      inputData: { investment: 1000000, rate: 0.1 },
      resultData: { npv: 71784, decision: 'ACCEPT' },
      notes: 'Базовый сценарий',
    };

    it('should save calculation successfully', async () => {
      mockPrisma.calculationBlock.findFirst.mockResolvedValue(null);
      mockPrisma.calculationBlock.create.mockResolvedValue({
        id: 'block-generic-npv',
        code: 'GENERIC_NPV',
      } as any);
      mockPrisma.calculation.create.mockResolvedValue({
        id: 'calc-1',
        type: 'npv',
        category: 'FINANCIAL',
        projectId: 'proj-1',
        executedById: 'user-1',
        createdAt: new Date(),
      } as any);

      const result = await service.saveCalculation(mockSaveData, 'user-1');

      expect(result.type).toBe('npv');
      expect(result.category).toBe('FINANCIAL');
      expect(mockPrisma.calculation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            type: 'NPV',
            category: 'FINANCIAL',
            inputData: mockSaveData.inputData,
            resultData: mockSaveData.resultData,
            notes: 'Базовый сценарий',
            executedById: 'user-1',
          }),
        })
      );
    });

    it('should link to existing generic block', async () => {
      const mockBlock = { id: 'block-npv', code: 'GENERIC_NPV' };
      mockPrisma.calculationBlock.findFirst.mockResolvedValue(mockBlock as any);
      mockPrisma.calculation.create.mockResolvedValue({
        id: 'calc-2',
        blockId: 'block-npv',
        type: 'NPV',
      } as any);

      await service.saveCalculation(mockSaveData, 'user-1');

      expect(mockPrisma.calculation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blockId: 'block-npv',
          }),
        })
      );
    });

    it('should save engineering calculation', async () => {
      const engineeringData = {
        projectId: 'proj-1',
        type: 'shaft_strength' as string,
        category: 'ENGINEERING' as const,
        inputData: { diameter: 50, torque: 1000 },
        resultData: { stress: 250, safety_factor: 2.5 },
      };

      mockPrisma.calculationBlock.findFirst.mockResolvedValue(null);
      mockPrisma.calculationBlock.create.mockResolvedValue({
        id: 'block-generic-shaft',
        code: 'GENERIC_SHAFT_STRENGTH',
      } as any);
      mockPrisma.calculation.create.mockResolvedValue({
        id: 'calc-eng-1',
        type: 'SHAFT_STRENGTH',
        category: 'ENGINEERING',
      } as any);

      const result = await service.saveCalculation(engineeringData, 'user-1');

      expect(result.category).toBe('ENGINEERING');
    });
  });

  describe('getCalculationSummary', () => {
    it('should return summary with financial and engineering counts', async () => {
      const mockCalculations = [
        { id: 'calc-1', type: 'NPV', category: 'FINANCIAL', createdAt: new Date(), block: null },
        { id: 'calc-2', type: 'IRR', category: 'FINANCIAL', createdAt: new Date(), block: null },
        {
          id: 'calc-3',
          type: 'SHAFT_STRENGTH',
          category: 'ENGINEERING',
          createdAt: new Date(),
          block: null,
        },
        {
          id: 'calc-4',
          type: 'THERMAL',
          category: 'ENGINEERING',
          createdAt: new Date(),
          block: null,
        },
      ];

      mockPrisma.calculation.findMany.mockResolvedValue(mockCalculations as any);

      const summary = await service.getCalculationSummary('proj-1');

      expect(summary.total).toBe(4);
      expect(summary.financial).toBe(2);
      expect(summary.engineering).toBe(2);
      expect(summary.byType).toEqual({
        NPV: 1,
        IRR: 1,
        SHAFT_STRENGTH: 1,
        THERMAL: 1,
      });
    });

    it('should handle empty calculations list', async () => {
      mockPrisma.calculation.findMany.mockResolvedValue([]);

      const summary = await service.getCalculationSummary('proj-1');

      expect(summary.total).toBe(0);
      expect(summary.financial).toBe(0);
      expect(summary.engineering).toBe(0);
      expect(summary.lastCalculation).toBe(null);
    });

    it('should categorize by block category when type is not set', async () => {
      const mockCalculations = [
        {
          id: 'calc-1',
          type: null,
          category: null,
          block: { code: 'ECONOMIC_BLOCK', category: 'ECONOMIC' },
          createdAt: new Date(),
        },
        {
          id: 'calc-2',
          type: null,
          category: null,
          block: { code: 'THERMAL_BLOCK', category: 'THERMAL' },
          createdAt: new Date(),
        },
      ];

      mockPrisma.calculation.findMany.mockResolvedValue(mockCalculations as any);

      const summary = await service.getCalculationSummary('proj-1');

      expect(summary.financial).toBe(1);
      expect(summary.engineering).toBe(1);
    });
  });
});
