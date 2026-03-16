/**
 * Knowledge Base Service Tests
 * Unit tests for Equipment Catalog, Markets, Competitors
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CreateCompetitorInput,
  CreateEquipmentInput,
  CreateMarketInput,
} from '../knowledge-base.types';

// Mock Prisma before importing the service
const mockPrisma = vi.hoisted(() => ({
  equipmentType: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  market: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  competitorDetail: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  competitorEquipment: {
    create: vi.fn(),
  },
  competitorMarket: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  calculationBlock: {
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: {},
  PrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));

// Import service after mock setup
import { knowledgeBaseService } from '../knowledge-base.service';

describe('KnowledgeBaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // SUMMARY TESTS
  // ==========================================

  describe('getSummary', () => {
    it('should return summary with all stats', async () => {
      mockPrisma.equipmentType.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      mockPrisma.equipmentType.groupBy.mockResolvedValueOnce([
        { category: 'THERMAL', _count: { category: 5 } },
        { category: 'MECHANICAL', _count: { category: 5 } },
      ]);

      mockPrisma.market.count.mockResolvedValueOnce(5).mockResolvedValueOnce(4);
      mockPrisma.market.groupBy.mockResolvedValueOnce([
        { region: 'EUROPE', _count: { region: 3 } },
        { region: 'ASIA', _count: { region: 2 } },
      ]);

      mockPrisma.competitorDetail.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
      mockPrisma.competitorDetail.groupBy.mockResolvedValueOnce([
        { threatLevel: 'medium', _count: { threatLevel: 2 } },
        { threatLevel: 'high', _count: { threatLevel: 1 } },
      ]);

      mockPrisma.calculationBlock.count.mockResolvedValueOnce(8).mockResolvedValueOnce(7);
      mockPrisma.calculationBlock.groupBy.mockResolvedValueOnce([
        { category: 'THERMAL', _count: { category: 4 } },
        { category: 'MECHANICAL', _count: { category: 4 } },
      ]);

      const result = await knowledgeBaseService.getSummary();

      expect(result.equipment.total).toBe(10);
      expect(result.equipment.active).toBe(8);
      expect(result.markets.total).toBe(5);
      expect(result.competitors.total).toBe(3);
      expect(result.calculationsLibrary.total).toBe(8);
    });
  });

  // ==========================================
  // EQUIPMENT TESTS
  // ==========================================

  describe('createEquipment', () => {
    const equipmentInput: CreateEquipmentInput = {
      code: 'FELETI-TK-100',
      name: 'Термокамера 100',
      category: 'THERMAL',
      description: 'Тестовое описание',
      basePrice: 50000,
      manufacturer: 'FELETI',
    };

    it('should create equipment successfully', async () => {
      const userId = 'user-123';
      const mockEquipment = {
        id: 'eq-123',
        code: equipmentInput.code,
        name: equipmentInput.name,
        shortName: null,
        category: equipmentInput.category,
        basePrice: equipmentInput.basePrice,
        currency: 'EUR',
        isActive: true,
        isCustom: false,
        manufacturer: 'FELETI',
        leadTimeDays: null,
        createdAt: new Date(),
      };

      mockPrisma.equipmentType.findUnique.mockResolvedValueOnce(null);
      mockPrisma.equipmentType.create.mockResolvedValueOnce(mockEquipment);

      const result = await knowledgeBaseService.createEquipment(equipmentInput, userId);

      expect(result.code).toBe(equipmentInput.code);
      expect(result.name).toBe(equipmentInput.name);
      expect(mockPrisma.equipmentType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: equipmentInput.code,
          name: equipmentInput.name,
          category: equipmentInput.category,
          createdById: userId,
        }),
      });
    });

    it('should throw error if equipment code already exists', async () => {
      mockPrisma.equipmentType.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        knowledgeBaseService.createEquipment(equipmentInput, 'user-123')
      ).rejects.toThrow('Оборудование с таким кодом уже существует');
    });
  });

  describe('getEquipmentList', () => {
    it('should return paginated equipment list', async () => {
      const mockEquipment = [
        {
          id: 'eq-1',
          code: 'TK-100',
          name: 'Термокамера 100',
          shortName: null,
          category: 'THERMAL',
          basePrice: 50000,
          currency: 'EUR',
          isActive: true,
          isCustom: false,
          manufacturer: 'FELETI',
          leadTimeDays: 30,
          createdAt: new Date(),
        },
      ];

      mockPrisma.equipmentType.findMany.mockResolvedValueOnce(mockEquipment);
      mockPrisma.equipmentType.count.mockResolvedValueOnce(1);

      const result = await knowledgeBaseService.getEquipmentList({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by category', async () => {
      mockPrisma.equipmentType.findMany.mockResolvedValueOnce([]);
      mockPrisma.equipmentType.count.mockResolvedValueOnce(0);

      await knowledgeBaseService.getEquipmentList({ category: 'THERMAL' });

      expect(mockPrisma.equipmentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'THERMAL' }),
        })
      );
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment successfully', async () => {
      const mockEquipment = {
        id: 'eq-123',
        code: 'TK-100',
        name: 'Обновленное название',
        shortName: null,
        category: 'THERMAL',
        basePrice: 60000,
        currency: 'EUR',
        isActive: true,
        isCustom: false,
        manufacturer: 'FELETI',
        leadTimeDays: 30,
        createdAt: new Date(),
      };

      mockPrisma.equipmentType.update.mockResolvedValueOnce(mockEquipment);

      const result = await knowledgeBaseService.updateEquipment('eq-123', {
        name: 'Обновленное название',
        basePrice: 60000,
      });

      expect(result.name).toBe('Обновленное название');
      expect(result.basePrice).toBe(60000);
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      mockPrisma.equipmentType.delete.mockResolvedValueOnce({});

      await knowledgeBaseService.deleteEquipment('eq-123');

      expect(mockPrisma.equipmentType.delete).toHaveBeenCalledWith({
        where: { id: 'eq-123' },
      });
    });
  });

  // ==========================================
  // MARKETS TESTS
  // ==========================================

  describe('createMarket', () => {
    const marketInput: CreateMarketInput = {
      code: 'DE',
      name: 'Germany',
      region: 'EUROPE',
      population: 83000000,
    };

    it('should create market successfully', async () => {
      const mockMarket = {
        id: 'market-123',
        code: marketInput.code,
        name: marketInput.name,
        region: marketInput.region,
        population: marketInput.population,
        gdpPerCapita: null,
        meatConsumptionKgPerCapita: null,
        isActive: true,
        priority: 0,
        _count: { competitors: 0, equipment: 0 },
      };

      mockPrisma.market.findUnique.mockResolvedValueOnce(null);
      mockPrisma.market.create.mockResolvedValueOnce(mockMarket);

      const result = await knowledgeBaseService.createMarket(marketInput);

      expect(result.code).toBe(marketInput.code);
      expect(result.name).toBe(marketInput.name);
    });

    it('should throw error if market code already exists', async () => {
      mockPrisma.market.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(knowledgeBaseService.createMarket(marketInput)).rejects.toThrow(
        'Рынок с таким кодом уже существует'
      );
    });
  });

  describe('getMarketsList', () => {
    it('should return markets with counts', async () => {
      const mockMarkets = [
        {
          id: 'm-1',
          code: 'DE',
          name: 'Germany',
          region: 'EUROPE',
          population: 83000000,
          gdpPerCapita: 45000,
          meatConsumptionKgPerCapita: 60,
          isActive: true,
          priority: 10,
          _count: { competitors: 3, equipment: 5 },
        },
      ];

      mockPrisma.market.findMany.mockResolvedValueOnce(mockMarkets);
      mockPrisma.market.count.mockResolvedValueOnce(1);

      const result = await knowledgeBaseService.getMarketsList();

      expect(result.items[0]._count?.competitors).toBe(3);
      expect(result.items[0]._count?.equipment).toBe(5);
    });
  });

  // ==========================================
  // COMPETITORS TESTS
  // ==========================================

  describe('createCompetitor', () => {
    const competitorInput: CreateCompetitorInput = {
      name: 'Competitor Inc',
      website: 'https://competitor.com',
      priceSegment: 'mid',
      threatLevel: 'medium',
    };

    it('should create competitor successfully', async () => {
      const mockCompetitor = {
        id: 'comp-123',
        name: competitorInput.name,
        legalName: null,
        website: competitorInput.website,
        email: null,
        annualRevenue: null,
        marketShare: null,
        priceSegment: 'mid',
        isActive: true,
        threatLevel: 'medium',
        _count: { markets: 0, equipment: 0 },
      };

      mockPrisma.competitorDetail.findUnique.mockResolvedValueOnce(null);
      mockPrisma.competitorDetail.create.mockResolvedValueOnce(mockCompetitor);

      const result = await knowledgeBaseService.createCompetitor(competitorInput);

      expect(result.name).toBe(competitorInput.name);
      expect(result.website).toBe(competitorInput.website);
    });

    it('should throw error if competitor name already exists', async () => {
      mockPrisma.competitorDetail.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(knowledgeBaseService.createCompetitor(competitorInput)).rejects.toThrow(
        'Конкурент с таким названием уже существует'
      );
    });
  });

  describe('getCompetitorsList', () => {
    it('should filter by threat level', async () => {
      mockPrisma.competitorDetail.findMany.mockResolvedValueOnce([]);
      mockPrisma.competitorDetail.count.mockResolvedValueOnce(0);

      await knowledgeBaseService.getCompetitorsList({ threatLevel: 'high' });

      expect(mockPrisma.competitorDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ threatLevel: 'high' }),
        })
      );
    });
  });

  describe('addCompetitorMarket', () => {
    it('should add market to competitor', async () => {
      mockPrisma.competitorMarket.findUnique.mockResolvedValueOnce(null);
      mockPrisma.competitorMarket.create.mockResolvedValueOnce({
        id: 'cm-123',
        competitorId: 'comp-123',
        marketId: 'market-123',
      });

      const result = await knowledgeBaseService.addCompetitorMarket('comp-123', {
        marketId: 'market-123',
        marketShare: 15,
        entryYear: 2020,
      });

      expect(result.competitorId).toBe('comp-123');
      expect(result.marketId).toBe('market-123');
    });

    it('should throw error if competitor already has this market', async () => {
      mockPrisma.competitorMarket.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        knowledgeBaseService.addCompetitorMarket('comp-123', { marketId: 'market-123' })
      ).rejects.toThrow('Конкурент уже присутствует на этом рынке');
    });
  });

  // ==========================================
  // CALCULATIONS LIBRARY TESTS
  // ==========================================

  describe('getCalculationsLibrary', () => {
    it('should return calculations library', async () => {
      const mockCalculations = [
        {
          id: 'calc-1',
          code: 'THERM-001',
          name: 'Heat Balance',
          category: 'THERMAL',
          description: 'Thermal calculation',
          active: true,
        },
      ];

      mockPrisma.calculationBlock.findMany.mockResolvedValueOnce(mockCalculations);
      mockPrisma.calculationBlock.count.mockResolvedValueOnce(1);

      const result = await knowledgeBaseService.getCalculationsLibrary({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].code).toBe('THERM-001');
      expect(result.items[0].isActive).toBe(true);
    });
  });
});
