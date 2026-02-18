/**
 * Calendar Routes
 * API endpoints for calendar events
 */

import { FastifyInstance } from 'fastify';

import { AuthenticatedRequest } from '../../middlewares/authenticate';
import { CalendarService } from './calendar.service';

const calendarService = new CalendarService();

export async function calendarRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /calendar/events
   * Get calendar events for projects
   */
  fastify.get(
    '/calendar/events',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const userId = req.user.userId;
      const events = await calendarService.getEvents(userId);
      return reply.send(events);
    }
  );
}
