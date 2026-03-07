import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  CalculationBlockReference,
  KPIMetric,
  RequirementTemplate,
  ValidationCriterion,
} from '../types';
import { productClassesService } from './product-classes.service';

export async function productClassesRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/product-classes - Получить все Product Classes
   */
  fastify.get(
    '/product-classes',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Получить все Product Classes',
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            active: { type: 'boolean' },
            parentId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { category, active, parentId } = request.query as {
          category?: string;
          active?: boolean;
          parentId?: string;
        };
        const classes = await productClassesService.getAll({
          category,
          active,
          parentId,
        });
        return reply.send(classes);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch product classes',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/product-classes/:id - Получить Product Class по ID
   */
  fastify.get(
    '/product-classes/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Получить Product Class по ID',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const productClass = await productClassesService.getById(id);
        return reply.send(productClass);
      } catch (error) {
        request.log.error(error);
        const statusCode =
          error instanceof Error && error.message.includes('не найден') ? 404 : 500;
        return reply.status(statusCode).send({
          error: 'Failed to fetch product class',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /api/product-classes - Создать Product Class
   */
  fastify.post(
    '/product-classes',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Создать Product Class',
        body: {
          type: 'object',
          required: ['code', 'name', 'category'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            category: { type: 'string' },
            parentId: { type: 'string' },
            typicalRequirements: { type: 'array' },
            calculationBlocks: { type: 'array' },
            validationCriteria: { type: 'array' },
            kpiMetrics: { type: 'array' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const productClass = await productClassesService.create(
          request.body as {
            code: string;
            name: string;
            description?: string;
            icon?: string;
            category: string;
            parentId?: string;
            typicalRequirements?: RequirementTemplate[];
            calculationBlockRefs?: CalculationBlockReference[];
            validationCriteria?: ValidationCriterion[];
            kpiMetrics?: KPIMetric[];
          }
        );
        return reply.status(201).send(productClass);
      } catch (error) {
        request.log.error(error);
        const statusCode =
          error instanceof Error && error.message.includes('уже существует') ? 409 : 500;
        return reply.status(statusCode).send({
          error: 'Failed to create product class',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * PUT /api/product-classes/:id - Обновить Product Class
   */
  fastify.put(
    '/product-classes/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Обновить Product Class',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const productClass = await productClassesService.update(
          id,
          request.body as {
            name?: string;
            description?: string;
            icon?: string;
            category?: string;
            typicalRequirements?: RequirementTemplate[];
            calculationBlockRefs?: CalculationBlockReference[];
            validationCriteria?: ValidationCriterion[];
            kpiMetrics?: KPIMetric[];
            metadata?: Record<string, unknown>;
            active?: boolean;
          }
        );
        return reply.send(productClass);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to update product class',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * DELETE /api/product-classes/:id - Удалить Product Class
   */
  fastify.delete(
    '/product-classes/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Удалить Product Class',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await productClassesService.update(id, { active: false });
        return reply.status(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to delete product class',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/product-classes/hierarchy - Получить иерархию
   */
  fastify.get(
    '/product-classes/hierarchy',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Engineering'],
        description: 'Получить иерархию Product Classes',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const hierarchy = await productClassesService.getHierarchy();
        return reply.send(hierarchy);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch hierarchy',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
