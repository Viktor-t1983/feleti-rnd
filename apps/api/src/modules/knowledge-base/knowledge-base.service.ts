/**
 * Knowledge Base Service
 * Business logic for Equipment Catalog, Markets, Competitors
 */

import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

// Карта флагов стран по коду
const FLAG_MAP: Record<string, string> = {
  BY: '🇧🇾',
  RU: '🇷🇺',
  KZ: '🇰🇿',
  UA: '🇺🇦',
  PL: '🇵🇱',
  DE: '🇩🇪',
  CZ: '🇨🇿',
  IT: '🇮🇹',
  ES: '🇪🇸',
  FR: '🇫🇷',
  CN: '🇨🇳',
  BR: '🇧🇷',
  AR: '🇦🇷',
  US: '🇺🇸',
  TR: '🇹🇷',
  UZ: '🇺🇿',
  AZ: '🇦🇿',
  GE: '🇬🇪',
  AM: '🇦🇲',
  MD: '🇲🇩',
};

import type {
  CompetitorEquipmentInput,
  CompetitorFilters,
  CompetitorListItem,
  CompetitorMarketInput,
  CreateCompetitorInput,
  CreateEquipmentInput,
  CreateMarketInput,
  EquipmentFilters,
  EquipmentListItem,
  KnowledgeBaseSummary,
  MarketFilters,
  MarketListItem,
  UpdateCompetitorInput,
  UpdateEquipmentInput,
  UpdateMarketInput,
} from './knowledge-base.types';

export class KnowledgeBaseService {
  // ==========================================
  // SUMMARY
  // ==========================================

  async getSummary(): Promise<KnowledgeBaseSummary> {
    logger.debug('Getting knowledge base summary');

    const [equipmentStats, marketsStats, competitorsStats, calculationsStats] = await Promise.all([
      this.getEquipmentStats(),
      this.getMarketsStats(),
      this.getCompetitorsStats(),
      this.getCalculationsStats(),
    ]);

    return {
      equipment: equipmentStats,
      markets: marketsStats,
      competitors: competitorsStats,
      calculationsLibrary: calculationsStats,
    };
  }

  private async getEquipmentStats() {
    const [total, active, custom, byCategory] = await Promise.all([
      prisma.equipmentType.count(),
      prisma.equipmentType.count({ where: { isActive: true } }),
      prisma.equipmentType.count({ where: { isCustom: true } }),
      prisma.equipmentType.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
    ]);

    const byCategoryMap: Record<string, number> = {};
    for (const item of byCategory) {
      byCategoryMap[item.category] = item._count.category;
    }

    return { total, active, custom, byCategory: byCategoryMap };
  }

  private async getMarketsStats() {
    const [total, active, byRegion] = await Promise.all([
      prisma.market.count(),
      prisma.market.count({ where: { isActive: true } }),
      prisma.market.groupBy({
        by: ['region'],
        _count: { region: true },
      }),
    ]);

    const byRegionMap: Record<string, number> = {};
    for (const item of byRegion) {
      byRegionMap[item.region] = item._count.region;
    }

    return { total, active, byRegion: byRegionMap };
  }

  private async getCompetitorsStats() {
    const [total, active, byThreatLevel] = await Promise.all([
      prisma.competitorDetail.count(),
      prisma.competitorDetail.count({ where: { isActive: true } }),
      prisma.competitorDetail.groupBy({
        by: ['threatLevel'],
        _count: { threatLevel: true },
      }),
    ]);

    const byThreatLevelMap: Record<string, number> = {};
    for (const item of byThreatLevel) {
      byThreatLevelMap[item.threatLevel] = item._count.threatLevel;
    }

    return { total, active, byThreatLevel: byThreatLevelMap };
  }

  private async getCalculationsStats() {
    const [total, active, byCategory] = await Promise.all([
      prisma.calculationBlock.count(),
      prisma.calculationBlock.count({ where: { active: true } }),
      prisma.calculationBlock.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
    ]);

    const byCategoryMap: Record<string, number> = {};
    for (const item of byCategory) {
      byCategoryMap[item.category] = item._count.category;
    }

    return { total, active, byCategory: byCategoryMap };
  }

  // ==========================================
  // EQUIPMENT
  // ==========================================

  async createEquipment(data: CreateEquipmentInput, userId: string): Promise<EquipmentListItem> {
    logger.debug({ code: data.code }, 'Creating equipment');

    const existing = await prisma.equipmentType.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Оборудование с таким кодом уже существует');
    }

    const equipment = await prisma.equipmentType.create({
      data: {
        code: data.code,
        name: data.name,
        shortName: data.shortName,
        category: data.category,
        description: data.description,
        specifications: data.specifications
          ? (data.specifications as unknown as Prisma.JsonArray)
          : undefined,
        basePrice: data.basePrice,
        currency: data.currency,
        images: data.images,
        documentationUrl: data.documentationUrl,
        manufacturer: data.manufacturer,
        countryOfOrigin: data.countryOfOrigin,
        leadTimeDays: data.leadTimeDays,
        isCustom: data.isCustom,
        createdById: userId,
      },
    });

    logger.info({ id: equipment.id, code: equipment.code }, 'Equipment created');
    return this.mapToEquipmentListItem(equipment);
  }

  async getEquipmentById(id: string) {
    const equipment = await prisma.equipmentType.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { projects: true, competitorEquipment: true },
        },
      },
    });

    if (!equipment) {
      throw new Error('Оборудование не найдено');
    }

    return equipment;
  }

  async getEquipmentList(filters: EquipmentFilters = {}): Promise<{
    items: EquipmentListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { category, isActive, search, page = 1, limit = 20 } = filters;

    const where: Prisma.EquipmentTypeWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.equipmentType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.equipmentType.count({ where }),
    ]);

    return {
      items: items.map(this.mapToEquipmentListItem),
      total,
      page,
      limit,
    };
  }

  async updateEquipment(id: string, data: UpdateEquipmentInput): Promise<EquipmentListItem> {
    logger.debug({ id }, 'Updating equipment');

    const equipment = await prisma.equipmentType.update({
      where: { id },
      data: {
        name: data.name,
        shortName: data.shortName,
        category: data.category,
        description: data.description,
        specifications: data.specifications
          ? (data.specifications as unknown as Prisma.JsonArray)
          : undefined,
        basePrice: data.basePrice,
        currency: data.currency,
        images: data.images,
        documentationUrl: data.documentationUrl,
        manufacturer: data.manufacturer,
        countryOfOrigin: data.countryOfOrigin,
        leadTimeDays: data.leadTimeDays,
        isActive: data.isActive,
      },
    });

    logger.info({ id }, 'Equipment updated');
    return this.mapToEquipmentListItem(equipment);
  }

  async deleteEquipment(id: string): Promise<void> {
    logger.debug({ id }, 'Deleting equipment');

    await prisma.equipmentType.delete({
      where: { id },
    });

    logger.info({ id }, 'Equipment deleted');
  }

  private mapToEquipmentListItem(
    equipment: Prisma.EquipmentTypeGetPayload<Record<string, never>>
  ): EquipmentListItem {
    return {
      id: equipment.id,
      code: equipment.code,
      name: equipment.name,
      shortName: equipment.shortName,
      category: equipment.category,
      basePrice: equipment.basePrice,
      currency: equipment.currency,
      isActive: equipment.isActive,
      isCustom: equipment.isCustom,
      manufacturer: equipment.manufacturer,
      leadTimeDays: equipment.leadTimeDays,
      createdAt: equipment.createdAt,
    };
  }

  // ==========================================
  // MARKETS
  // ==========================================

  async createMarket(data: CreateMarketInput): Promise<MarketListItem> {
    logger.debug({ code: data.code }, 'Creating market');

    const existing = await prisma.market.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Рынок с таким кодом уже существует');
    }

    const market = await prisma.market.create({
      data: {
        code: data.code,
        name: data.name,
        region: data.region,
        description: data.description,
        population: data.population,
        gdpPerCapita: data.gdpPerCapita,
        languages: data.languages,
        currencies: data.currencies,
        meatConsumptionKgPerCapita: data.meatConsumptionKgPerCapita,
        preferredMeatTypes: data.preferredMeatTypes,
        certificationsRequired: data.certificationsRequired,
        standards: data.standards,
        importTaxes: data.importTaxes as unknown as Prisma.JsonObject | undefined,
        priority: data.priority,
        industry: data.industry,
        companiesCount: data.companiesCount,
        productionVolumeTons: data.productionVolumeTons,
        exportVolumeTons: data.exportVolumeTons,
        importVolumeTons: data.importVolumeTons,
        dataSource: data.dataSource,
        dataYear: data.dataYear,
        flagEmoji: data.flagEmoji || FLAG_MAP[data.code] || '🏳️',
      },
      include: {
        _count: {
          select: { competitors: true, equipment: true },
        },
      },
    });

    logger.info({ id: market.id, code: market.code }, 'Market created');
    return this.mapToMarketListItem(market);
  }

  async getMarketById(id: string) {
    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        _count: {
          select: { competitors: true, equipment: true },
        },
        competitors: {
          include: {
            competitor: true,
          },
        },
        equipment: {
          include: {
            equipmentType: true,
          },
        },
      },
    });

    if (!market) {
      throw new Error('Рынок не найден');
    }

    return market;
  }

  async getMarketsList(filters: MarketFilters = {}): Promise<{
    items: MarketListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { region, isActive, search, page = 1, limit = 20 } = filters;

    const where: Prisma.MarketWhereInput = {};

    if (region) {
      where.region = region;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.market.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priority: 'desc' },
        include: {
          _count: {
            select: { competitors: true, equipment: true },
          },
        },
      }),
      prisma.market.count({ where }),
    ]);

    return {
      items: items.map(this.mapToMarketListItem),
      total,
      page,
      limit,
    };
  }

  async updateMarket(id: string, data: UpdateMarketInput): Promise<MarketListItem> {
    logger.debug({ id }, 'Updating market');

    const market = await prisma.market.update({
      where: { id },
      data: {
        name: data.name,
        region: data.region,
        description: data.description,
        population: data.population,
        gdpPerCapita: data.gdpPerCapita,
        languages: data.languages,
        currencies: data.currencies,
        meatConsumptionKgPerCapita: data.meatConsumptionKgPerCapita,
        preferredMeatTypes: data.preferredMeatTypes,
        certificationsRequired: data.certificationsRequired,
        standards: data.standards,
        importTaxes: data.importTaxes as unknown as Prisma.JsonObject | undefined,
        isActive: data.isActive,
        priority: data.priority,
        industry: data.industry,
        companiesCount: data.companiesCount,
        productionVolumeTons: data.productionVolumeTons,
        exportVolumeTons: data.exportVolumeTons,
        importVolumeTons: data.importVolumeTons,
        dataSource: data.dataSource,
        dataYear: data.dataYear,
        flagEmoji: data.flagEmoji,
      },
      include: {
        _count: {
          select: { competitors: true, equipment: true },
        },
      },
    });

    logger.info({ id }, 'Market updated');
    return this.mapToMarketListItem(market);
  }

  async deleteMarket(id: string): Promise<void> {
    logger.debug({ id }, 'Deleting market');

    await prisma.market.delete({
      where: { id },
    });

    logger.info({ id }, 'Market deleted');
  }

  private mapToMarketListItem(
    market: Prisma.MarketGetPayload<{ include: { _count: true } }>
  ): MarketListItem {
    return {
      id: market.id,
      code: market.code,
      name: market.name,
      region: market.region,
      population: market.population,
      gdpPerCapita: market.gdpPerCapita,
      meatConsumptionKgPerCapita: market.meatConsumptionKgPerCapita,
      isActive: market.isActive,
      priority: market.priority,
      _count: market._count,
      // Новые поля
      flagEmoji: market.flagEmoji ?? this.getFlagForCode(market.code),
      industry: market.industry,
      companiesCount: market.companiesCount,
      productionVolumeTons: market.productionVolumeTons,
      exportVolumeTons: market.exportVolumeTons,
      importVolumeTons: market.importVolumeTons,
      dataSource: market.dataSource,
      dataYear: market.dataYear,
    };
  }

  private getFlagForCode(code: string): string {
    return FLAG_MAP[code] || '🏳️';
  }

  // ==========================================
  // COMPETITORS
  // ==========================================

  async createCompetitor(data: CreateCompetitorInput): Promise<CompetitorListItem> {
    logger.debug({ name: data.name }, 'Creating competitor');

    const existing = await prisma.competitorDetail.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Конкурент с таким названием уже существует');
    }

    const competitor = await prisma.competitorDetail.create({
      data: {
        name: data.name,
        legalName: data.legalName,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        country: data.country,
        countryCode: data.countryCode,
        foundedYear: data.foundedYear,
        employeesCount: data.employeesCount,
        annualRevenue: data.annualRevenue,
        marketShare: data.marketShare,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        productRange: data.productRange || [],
        priceSegment: data.priceSegment || 'mid',
        threatLevel: data.threatLevel || 'medium',
      },
      include: {
      _count: {
        select: { markets: true, equipment: true, projectLinks: true },
      },
      },
    });

    logger.info({ id: competitor.id, name: competitor.name }, 'Competitor created');
    return this.mapToCompetitorListItem(competitor);
  }

  async getCompetitorById(id: string) {
    const competitor = await prisma.competitorDetail.findUnique({
      where: { id },
      include: {
      _count: {
        select: { markets: true, equipment: true, projectLinks: true },
      },
        markets: {
          include: {
            market: true,
          },
        },
        equipment: {
          include: {
            equipmentType: true,
          },
        },
        projectLinks: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!competitor) {
      throw new Error('Конкурент не найден');
    }

    return competitor;
  }

  async getCompetitorsList(filters: CompetitorFilters = {}): Promise<{
    items: CompetitorListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { isActive, threatLevel, search, page = 1, limit = 20 } = filters;

    const where: Prisma.CompetitorDetailWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (threatLevel) {
      where.threatLevel = threatLevel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { productRange: { has: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.competitorDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { threatLevel: 'desc' },
        include: {
          _count: {
            select: { markets: true, equipment: true, projectLinks: true },
          },
        },
      }),
      prisma.competitorDetail.count({ where }),
    ]);

    return {
      items: items.map(this.mapToCompetitorListItem),
      total,
      page,
      limit,
    };
  }

  async updateCompetitor(id: string, data: UpdateCompetitorInput): Promise<CompetitorListItem> {
    logger.debug({ id }, 'Updating competitor');

    const competitor = await prisma.competitorDetail.update({
      where: { id },
      data: {
        name: data.name,
        legalName: data.legalName,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        country: data.country,
        countryCode: data.countryCode,
        foundedYear: data.foundedYear,
        employeesCount: data.employeesCount,
        annualRevenue: data.annualRevenue,
        marketShare: data.marketShare,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        productRange: data.productRange,
        priceSegment: data.priceSegment,
        threatLevel: data.threatLevel,
        isActive: data.isActive,
      },
      include: {
      _count: {
        select: { markets: true, equipment: true, projectLinks: true },
      },
      },
    });

    logger.info({ id }, 'Competitor updated');
    return this.mapToCompetitorListItem(competitor);
  }

  async deleteCompetitor(id: string): Promise<void> {
    logger.debug({ id }, 'Deleting competitor');

    await prisma.competitorDetail.delete({
      where: { id },
    });

    logger.info({ id }, 'Competitor deleted');
  }

  async addCompetitorEquipment(competitorId: string, data: CompetitorEquipmentInput) {
    logger.debug({ competitorId }, 'Adding competitor equipment');

    return prisma.competitorEquipment.create({
      data: {
        competitorId,
        equipmentTypeId: data.equipmentTypeId,
        name: data.name,
        modelNumber: data.modelNumber,
        specifications: data.specifications as unknown as Prisma.JsonObject | undefined,
        advantages: data.advantages || [],
        disadvantages: data.disadvantages || [],
        priceRangeMin: data.priceRangeMin,
        priceRangeMax: data.priceRangeMax,
        currency: data.currency || 'EUR',
      },
    });
  }

  async addCompetitorMarket(competitorId: string, data: CompetitorMarketInput) {
    logger.debug({ competitorId, marketId: data.marketId }, 'Adding competitor market');

    const existing = await prisma.competitorMarket.findUnique({
      where: {
        competitorId_marketId: {
          competitorId,
          marketId: data.marketId,
        },
      },
    });

    if (existing) {
      throw new Error('Конкурент уже присутствует на этом рынке');
    }

    return prisma.competitorMarket.create({
      data: {
        competitorId,
        marketId: data.marketId,
        marketShare: data.marketShare,
        entryYear: data.entryYear,
        notes: data.notes,
      },
    });
  }

  async addCompetitorProject(competitorId: string, data: { projectId: string; notes?: string }) {
    const competitor = await prisma.competitorDetail.findUnique({
      where: { id: competitorId },
    });
    if (!competitor) {
      throw new Error('Конкурент не найден');
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) {
      throw new Error('Проект не найден');
    }

    const existing = await prisma.competitorProject.findUnique({
      where: {
        projectId_competitorId: {
          projectId: data.projectId,
          competitorId,
        },
      },
    });

    if (existing) {
      throw new Error('Конкурент уже связан с этим проектом');
    }

    return prisma.competitorProject.create({
      data: {
        competitorId,
        projectId: data.projectId,
        notes: data.notes,
      },
    });
  }

  async removeCompetitorProject(competitorId: string, projectId: string) {
    const link = await prisma.competitorProject.findUnique({
      where: {
        projectId_competitorId: {
          projectId,
          competitorId,
        },
      },
    });

    if (!link) {
      throw new Error('Связь не найдена');
    }

    return prisma.competitorProject.delete({
      where: { id: link.id },
    });
  }

  private mapToCompetitorListItem(
    competitor: Prisma.CompetitorDetailGetPayload<{ include: { _count: { select: { markets: true, equipment: true, projectLinks: true } } } }>
  ): CompetitorListItem {
    return {
      id: competitor.id,
      name: competitor.name,
      legalName: competitor.legalName,
      website: competitor.website,
      country: competitor.country,
      countryCode: competitor.countryCode,
      annualRevenue: competitor.annualRevenue,
      marketShare: competitor.marketShare,
      priceSegment: competitor.priceSegment,
      isActive: competitor.isActive,
      threatLevel: competitor.threatLevel,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      productRange: competitor.productRange,
      foundedYear: competitor.foundedYear,
      employeesCount: competitor.employeesCount,
      _count: competitor._count,
    };
  }

  async getCompetitorsForProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        equipmentTypes: true,
      },
    });

    if (!project) {
      throw new Error('Проект не найден');
    }

    const equipmentTypeNames = project.equipmentTypes.map((et) => et.name);
    const projectName = project.name.toLowerCase();
    const searchTerms = [...equipmentTypeNames, projectName].filter(Boolean);

    if (searchTerms.length === 0) {
      return [];
    }

    const competitors = await prisma.competitorDetail.findMany({
      where: {
        isActive: true,
        OR: [
          {
            equipment: {
              some: {
                name: { in: searchTerms, mode: 'insensitive' },
              },
            },
          },
          {
            productRange: {
              hasSome: searchTerms,
            },
          },
        ],
      },
      include: {
        _count: {
          select: { markets: true, equipment: true, projectLinks: true },
        },
        equipment: true,
      },
      orderBy: { threatLevel: 'asc' },
      take: 10,
    });

    const results = competitors.map((c) => {
      let reason: 'equipment' | 'productRange' | 'name' = 'name';
      
      const hasEquipmentMatch = c.equipment.some(
        (e: { name: string }) => searchTerms.some(
          (term) => e.name.toLowerCase().includes(term.toLowerCase()) ||
                    term.toLowerCase().includes(e.name.toLowerCase())
        )
      );
      const hasProductRangeMatch = c.productRange.some(
        (p: string) => searchTerms.some(
          (term) => p.toLowerCase().includes(term.toLowerCase()) ||
                    term.toLowerCase().includes(p.toLowerCase())
        )
      );

      if (hasEquipmentMatch) reason = 'equipment';
      else if (hasProductRangeMatch) reason = 'productRange';

      return {
        id: c.id,
        name: c.name,
        country: c.country,
        countryCode: c.countryCode,
        threatLevel: c.threatLevel,
        priceSegment: c.priceSegment,
        reason,
        _count: c._count,
      };
    });

    return results;
  }

  // ==========================================
  // CALCULATIONS LIBRARY
  // ==========================================

  async getCalculationsLibrary(filters: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, isActive, search, page = 1, limit = 20 } = filters;

    const where: Prisma.CalculationBlockWhereInput = {};

    if (category) {
      where.category = category as Prisma.EnumCalculationCategoryFilter;
    }

    if (isActive !== undefined) {
      where.active = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.calculationBlock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          description: true,
          active: true,
        },
      }),
      prisma.calculationBlock.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        description: item.description,
        isActive: item.active,
      })),
      total,
      page,
      limit,
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
