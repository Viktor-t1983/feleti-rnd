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

  // ============================================
  // EXTENDED ANALYTICS ROUTES
  // ============================================

  fastify.get(
    '/analytics/budget-trends',
    {
      schema: {
        description: 'Get budget trends by month',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const trends = await analyticsService.getBudgetTrends(userId);
      return trends;
    }
  );

  fastify.get(
    '/analytics/roi',
    {
      schema: {
        description: 'Get ROI by project',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const roi = await analyticsService.getROIByProject(userId);
      return roi;
    }
  );

  fastify.get(
    '/analytics/spending-over-time',
    {
      schema: {
        description: 'Get cumulative spending over time',
        tags: ['analytics'],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
          },
        },
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const { startDate } = request.query as { startDate?: string };
      const spending = await analyticsService.getSpendingOverTime(userId, startDate);
      return spending;
    }
  );

  fastify.post(
    '/analytics/compare',
    {
      schema: {
        description: 'Compare multiple projects',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const { projectIds } = request.body as { projectIds: string[] };

      // Валидация: пользователь должен иметь доступ ко всем проектам
      const comparison = await analyticsService.compareProjects(projectIds, userId);
      return comparison;
    }
  );

  fastify.get(
    '/analytics/stage-stats',
    {
      schema: {
        description: 'Get statistics by project stage',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;
      const stats = await analyticsService.getStageStatistics(userId);
      return stats;
    }
  );

  fastify.get(
    '/analytics/export/excel',
    {
      schema: {
        description: 'Export analytics to Excel',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;

      const buffer = await analyticsService.generateExcelReport(userId);

      const filename = `feleti-report-${Date.now()}.xlsx`;

      return reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    }
  );

  fastify.get(
    '/analytics/export/csv',
    {
      schema: {
        description: 'Export analytics to CSV',
        tags: ['analytics'],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.userId as string;

      const buffer = await analyticsService.generateCSVReport(userId);

      const filename = `feleti-report-${Date.now()}.csv`;

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    }
  );
}
