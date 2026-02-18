import { FastifyInstance, FastifyReply } from 'fastify';

import { AuthenticatedRequest } from '../../middlewares/authenticate';

import { AnalyticsService } from './analytics.service';

const analyticsService = new AnalyticsService();

export function analyticsRoutes(fastify: FastifyInstance): void {
  fastify.get(
    '/analytics/dashboard',
    {
      schema: {
        description: 'Get dashboard statistics',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const stats = await analyticsService.getDashboardStats(userId);
      return stats;
    }
  );

  fastify.get(
    '/analytics/trends',
    {
      schema: {
        description: 'Get projects trends',
        tags: ['analytics'],
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['week', 'month', 'year'] },
          },
          required: ['period'],
        },
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply: FastifyReply) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const { period } = request.query as { period: 'week' | 'month' | 'year' };

      // Валидация периода
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return reply.status(400).send({
          error: 'Invalid period',
          message: 'Period must be one of: week, month, year',
        });
      }

      const trends = await analyticsService.getProjectsTrend(userId, period);
      return trends;
    }
  );

  fastify.get(
    '/analytics/budget',
    {
      schema: {
        description: 'Get budget analysis',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const analysis = await analyticsService.getBudgetAnalysis(userId);
      return analysis;
    }
  );
}
