/**
 * ActivityLog Routes
 * API endpoints для работы с историей активности
 */

import { FastifyInstance } from 'fastify';

import { prisma } from '../../lib/prisma';
import { activityLogService } from './activity-log.service';

/**
 * Регистрация маршрутов для работы с логами активности
 */
export async function activityLogRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /activity-logs - получить список логов
  fastify.get('/activity-logs', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { userId: string }).userId;

    const { projectId, action, startDate, endDate, limit, offset } = request.query as {
      projectId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };

    // Проверяем роль для общего доступа
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role?.name === 'Admin';

    const logs = await activityLogService.getLogs({
      userId: isAdmin ? undefined : userId,
      projectId,
      action: action as
        | 'PROJECT_CREATED'
        | 'PROJECT_UPDATED'
        | 'PROJECT_DELETED'
        | 'MEMBER_ADDED'
        | 'MEMBER_REMOVED'
        | 'COMMENT_CREATED'
        | 'COMMENT_DELETED'
        | 'FILE_UPLOADED'
        | 'FILE_DELETED'
        | 'BUDGET_UPDATED',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return reply.send(logs);
  });

  // GET /activity-logs/count - получить количество логов
  fastify.get(
    '/activity-logs/count',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { userId: string }).userId;

      const { projectId, action } = request.query as {
        projectId?: string;
        action?: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      });

      const isAdmin = user?.role?.name === 'Admin';

      const count = await activityLogService.getCount({
        userId: isAdmin ? undefined : userId,
        projectId,
        action: action as
          | 'PROJECT_CREATED'
          | 'PROJECT_UPDATED'
          | 'PROJECT_DELETED'
          | 'MEMBER_ADDED'
          | 'MEMBER_REMOVED'
          | 'COMMENT_CREATED'
          | 'COMMENT_DELETED'
          | 'FILE_UPLOADED'
          | 'FILE_DELETED'
          | 'BUDGET_UPDATED',
      });

      return reply.send({ count });
    }
  );
}
