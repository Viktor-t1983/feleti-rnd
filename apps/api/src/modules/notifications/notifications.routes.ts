/**
 * Notifications Routes
 * REST API endpoints for notification management
 */

import { FastifyInstance } from 'fastify';
import { notificationsService } from './notifications.service';

interface NotificationParams {
  id: string;
}

export async function notificationsRoutes(fastify: FastifyInstance) {
  // GET /notifications - Get all notifications for current user
  fastify.get('/notifications', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { userId: string }).userId;
    const { limit } = request.query as { limit?: string };

    const notifications = await notificationsService.getByUser(
      userId,
      limit ? parseInt(limit, 10) : 20
    );

    return reply.send(notifications);
  });

  // GET /notifications/unread-count - Get unread notifications count
  fastify.get(
    '/notifications/unread-count',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { userId: string }).userId;

      const count = await notificationsService.getUnreadCount(userId);

      return reply.send({ count });
    }
  );

  // PATCH /notifications/:id/read - Mark notification as read
  fastify.patch<{ Params: NotificationParams }>(
    '/notifications/:id/read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as NotificationParams;

      const result = await notificationsService.markAsRead(id);

      return reply.send(result);
    }
  );

  // POST /notifications/mark-all-read - Mark all notifications as read
  fastify.post(
    '/notifications/mark-all-read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { userId: string }).userId;

      const result = await notificationsService.markAllAsRead(userId);

      return reply.send(result);
    }
  );

  // DELETE /notifications/:id - Delete single notification
  fastify.delete<{ Params: NotificationParams }>(
    '/notifications/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as NotificationParams;

      await notificationsService.delete(id);

      return reply.code(204).send();
    }
  );

  // DELETE /notifications - Delete all notifications for current user
  fastify.delete(
    '/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { userId: string }).userId;

      await notificationsService.deleteAll(userId);

      return reply.code(204).send();
    }
  );
}
