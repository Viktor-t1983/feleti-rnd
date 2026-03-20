/**
 * Knowledge Base Routes
 * API routes for Equipment Catalog, Markets, Competitors, Calculations Library
 */

import { FastifyInstance } from 'fastify';

import { knowledgeBaseService } from './knowledge-base.service';

export async function knowledgeBaseRoutes(fastify: FastifyInstance) {
  // ==========================================
  // SUMMARY
  // ==========================================

  // GET /api/knowledge/summary - общая статистика базы знаний
  fastify.get(
    '/knowledge/summary',
    { preHandler: [fastify.authenticate] },
    async (request, _reply) => {
      const result = await knowledgeBaseService.getSummary();
      request.log.info({ result }, 'Knowledge summary response');
      return result;
    }
  );

  // ==========================================
  // EQUIPMENT ROUTES
  // ==========================================

  // GET /api/knowledge/equipment - список оборудования
  fastify.get<{
    Querystring: {
      category?: string;
      isActive?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/knowledge/equipment', { preHandler: [fastify.authenticate] }, async (request) => {
    const { category, isActive, search, page, limit } = request.query;

    return knowledgeBaseService.getEquipmentList({
      category: category as
        | 'THERMAL'
        | 'MECHANICAL'
        | 'HYDRAULIC'
        | 'ELECTRICAL'
        | 'AUTOMATION'
        | 'PACKAGING'
        | 'TRANSPORT'
        | 'OTHER',
      isActive: isActive ? isActive === 'true' : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });

  // POST /api/knowledge/equipment - создать оборудование
  fastify.post<{
    Body: {
      code: string;
      name: string;
      shortName?: string;
      category: string;
      description?: string;
      specifications?: Array<{
        key: string;
        value: string | number;
        unit?: string;
      }>;
      basePrice?: number;
      currency?: string;
      images?: string[];
      documentationUrl?: string;
      manufacturer?: string;
      countryOfOrigin?: string;
      leadTimeDays?: number;
      isCustom?: boolean;
    };
  }>('/knowledge/equipment', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as unknown as { id: string; userId: string };

    const equipment = await knowledgeBaseService.createEquipment(
      {
        ...request.body,
        category: request.body.category as
          | 'THERMAL'
          | 'MECHANICAL'
          | 'HYDRAULIC'
          | 'ELECTRICAL'
          | 'AUTOMATION'
          | 'PACKAGING'
          | 'TRANSPORT'
          | 'OTHER',
      },
      user.id || user.userId
    );

    return reply.code(201).send(equipment);
  });

  // GET /api/knowledge/equipment/:id - получить оборудование по ID
  fastify.get<{ Params: { id: string } }>(
    '/knowledge/equipment/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const equipment = await knowledgeBaseService.getEquipmentById(request.params.id);
        return equipment;
      } catch {
        return reply.code(404).send({ error: 'Оборудование не найдено' });
      }
    }
  );

  // PATCH /api/knowledge/equipment/:id - обновить оборудование
  fastify.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      shortName?: string;
      category?: string;
      description?: string;
      specifications?: Array<{
        key: string;
        value: string | number;
        unit?: string;
      }>;
      basePrice?: number;
      currency?: string;
      images?: string[];
      documentationUrl?: string;
      manufacturer?: string;
      countryOfOrigin?: string;
      leadTimeDays?: number;
      isActive?: boolean;
    };
  }>('/knowledge/equipment/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const equipment = await knowledgeBaseService.updateEquipment(request.params.id, {
        ...request.body,
        category: request.body.category as
          | 'THERMAL'
          | 'MECHANICAL'
          | 'HYDRAULIC'
          | 'ELECTRICAL'
          | 'AUTOMATION'
          | 'PACKAGING'
          | 'TRANSPORT'
          | 'OTHER'
          | undefined,
      });
      return equipment;
    } catch {
      return reply.code(404).send({ error: 'Оборудование не найдено' });
    }
  });

  // DELETE /api/knowledge/equipment/:id - удалить оборудование
  fastify.delete<{ Params: { id: string } }>(
    '/knowledge/equipment/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        await knowledgeBaseService.deleteEquipment(request.params.id);
        return reply.code(204).send();
      } catch {
        return reply.code(404).send({ error: 'Оборудование не найдено' });
      }
    }
  );

  // ==========================================
  // MARKETS ROUTES
  // ==========================================

  // GET /api/knowledge/markets - список рынков
  fastify.get<{
    Querystring: {
      region?: string;
      isActive?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/knowledge/markets', { preHandler: [fastify.authenticate] }, async (request) => {
    const { region, isActive, search, page, limit } = request.query;

    return knowledgeBaseService.getMarketsList({
      region: region as
        | 'EUROPE'
        | 'NORTH_AMERICA'
        | 'SOUTH_AMERICA'
        | 'ASIA'
        | 'AFRICA'
        | 'AUSTRALIA'
        | 'MIDDLE_EAST'
        | undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });

  // POST /api/knowledge/markets - создать рынок
  fastify.post<{
    Body: {
      code: string;
      name: string;
      region: string;
      description?: string;
      population?: number;
      gdpPerCapita?: number;
      languages?: string[];
      currencies?: string[];
      meatConsumptionKgPerCapita?: number;
      preferredMeatTypes?: string[];
      certificationsRequired?: string[];
      standards?: string[];
      importTaxes?: Record<string, unknown>;
      priority?: number;
      industry?: string;
      companiesCount?: number;
      productionVolumeTons?: number;
      exportVolumeTons?: number;
      importVolumeTons?: number;
      dataSource?: string;
      dataYear?: number;
      flagEmoji?: string;
    };
  }>('/knowledge/markets', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const market = await knowledgeBaseService.createMarket({
      ...request.body,
      region: request.body.region as
        | 'EUROPE'
        | 'NORTH_AMERICA'
        | 'SOUTH_AMERICA'
        | 'ASIA'
        | 'AFRICA'
        | 'AUSTRALIA'
        | 'MIDDLE_EAST',
    });

    return reply.code(201).send(market);
  });

  // GET /api/knowledge/markets/:id - получить рынок по ID
  fastify.get<{ Params: { id: string } }>(
    '/knowledge/markets/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const market = await knowledgeBaseService.getMarketById(request.params.id);
        return market;
      } catch {
        return reply.code(404).send({ error: 'Рынок не найден' });
      }
    }
  );

  // PATCH /api/knowledge/markets/:id - обновить рынок
  fastify.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      region?: string;
      description?: string;
      population?: number;
      gdpPerCapita?: number;
      languages?: string[];
      currencies?: string[];
      meatConsumptionKgPerCapita?: number;
      preferredMeatTypes?: string[];
      certificationsRequired?: string[];
      standards?: string[];
      importTaxes?: Record<string, unknown>;
      isActive?: boolean;
      priority?: number;
      industry?: string;
      companiesCount?: number;
      productionVolumeTons?: number;
      exportVolumeTons?: number;
      importVolumeTons?: number;
      dataSource?: string;
      dataYear?: number;
      flagEmoji?: string;
    };
  }>('/knowledge/markets/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const market = await knowledgeBaseService.updateMarket(request.params.id, {
        ...request.body,
        region: request.body.region as
          | 'EUROPE'
          | 'NORTH_AMERICA'
          | 'SOUTH_AMERICA'
          | 'ASIA'
          | 'AFRICA'
          | 'AUSTRALIA'
          | 'MIDDLE_EAST'
          | undefined,
      });
      return market;
    } catch {
      return reply.code(404).send({ error: 'Рынок не найден' });
    }
  });

  // DELETE /api/knowledge/markets/:id - удалить рынок
  fastify.delete<{ Params: { id: string } }>(
    '/knowledge/markets/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        await knowledgeBaseService.deleteMarket(request.params.id);
        return reply.code(204).send();
      } catch {
        return reply.code(404).send({ error: 'Рынок не найден' });
      }
    }
  );

  // ==========================================
  // COMPETITORS ROUTES
  // ==========================================

  // GET /api/knowledge/competitors - список конкурентов
  fastify.get<{
    Querystring: {
      isActive?: string;
      threatLevel?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/knowledge/competitors', { preHandler: [fastify.authenticate] }, async (request) => {
    const { isActive, threatLevel, search, page, limit } = request.query;

    return knowledgeBaseService.getCompetitorsList({
      isActive: isActive ? isActive === 'true' : undefined,
      threatLevel: threatLevel as 'low' | 'medium' | 'high' | undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });

  // POST /api/knowledge/competitors - создать конкурента
  fastify.post<{
    Body: {
      name: string;
      legalName?: string;
      website?: string;
      email?: string;
      phone?: string;
      address?: string;
      foundedYear?: number;
      employeesCount?: number;
      annualRevenue?: number;
      marketShare?: number;
      strengths?: string[];
      weaknesses?: string[];
      productRange?: string[];
      priceSegment?: 'low' | 'mid' | 'premium';
      threatLevel?: 'low' | 'medium' | 'high';
    };
  }>('/knowledge/competitors', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const competitor = await knowledgeBaseService.createCompetitor(request.body);
    return reply.code(201).send(competitor);
  });

  // GET /api/knowledge/competitors/:id - получить конкурента по ID
  fastify.get<{ Params: { id: string } }>(
    '/knowledge/competitors/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const competitor = await knowledgeBaseService.getCompetitorById(request.params.id);
        return competitor;
      } catch {
        return reply.code(404).send({ error: 'Конкурент не найден' });
      }
    }
  );

  // PATCH /api/knowledge/competitors/:id - обновить конкурента
  fastify.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      legalName?: string;
      website?: string;
      email?: string;
      phone?: string;
      address?: string;
      foundedYear?: number;
      employeesCount?: number;
      annualRevenue?: number;
      marketShare?: number;
      strengths?: string[];
      weaknesses?: string[];
      productRange?: string[];
      priceSegment?: 'low' | 'mid' | 'premium';
      threatLevel?: 'low' | 'medium' | 'high';
      isActive?: boolean;
    };
  }>(
    '/knowledge/competitors/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const competitor = await knowledgeBaseService.updateCompetitor(
          request.params.id,
          request.body
        );
        return competitor;
      } catch {
        return reply.code(404).send({ error: 'Конкурент не найден' });
      }
    }
  );

  // DELETE /api/knowledge/competitors/:id - удалить конкурента
  fastify.delete<{ Params: { id: string } }>(
    '/knowledge/competitors/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        await knowledgeBaseService.deleteCompetitor(request.params.id);
        return reply.code(204).send();
      } catch {
        return reply.code(404).send({ error: 'Конкурент не найден' });
      }
    }
  );

  // POST /api/knowledge/competitors/:id/equipment - добавить оборудование конкурента
  fastify.post<{
    Params: { id: string };
    Body: {
      equipmentTypeId?: string;
      name: string;
      modelNumber?: string;
      specifications?: Record<string, unknown>;
      advantages?: string[];
      disadvantages?: string[];
      priceRangeMin?: number;
      priceRangeMax?: number;
      currency?: string;
    };
  }>(
    '/knowledge/competitors/:id/equipment',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const equipment = await knowledgeBaseService.addCompetitorEquipment(
          request.params.id,
          request.body
        );
        return reply.code(201).send(equipment);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ошибка';
        return reply.code(400).send({ error: message });
      }
    }
  );

  // POST /api/knowledge/competitors/:id/markets - добавить рынок конкурента
  fastify.post<{
    Params: { id: string };
    Body: {
      marketId: string;
      marketShare?: number;
      entryYear?: number;
      notes?: string;
    };
  }>(
    '/knowledge/competitors/:id/markets',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const market = await knowledgeBaseService.addCompetitorMarket(
          request.params.id,
          request.body
        );
        return reply.code(201).send(market);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ошибка';
        return reply.code(400).send({ error: message });
      }
    }
  );

  // ==========================================
  // CALCULATIONS LIBRARY ROUTES
  // ==========================================

  // GET /api/knowledge/calculations - библиотека расчётов
  fastify.get<{
    Querystring: {
      category?: string;
      isActive?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/knowledge/calculations', { preHandler: [fastify.authenticate] }, async (request) => {
    const { category, isActive, search, page, limit } = request.query;

    return knowledgeBaseService.getCalculationsLibrary({
      category,
      isActive: isActive ? isActive === 'true' : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });
}
