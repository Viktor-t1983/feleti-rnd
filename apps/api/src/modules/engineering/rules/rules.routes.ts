import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma';
import { rulesEngineService } from './rules-engine.service';

export async function rulesRoutes(fastify: FastifyInstance) {
  // POST /rules/evaluate - оценить правила
  fastify.post(
    '/rules/evaluate',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const context = request.body as Record<string, unknown>;

      try {
        const results = await rulesEngineService.evaluateRules(context as never);
        return reply.send(results);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // GET /rules/blockers/:projectId - проверить blockers
  fastify.get(
    '/rules/blockers/:projectId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { projectId: string };
      const result = await rulesEngineService.checkBlockers(params.projectId);
      return reply.send(result);
    }
  );

  // GET /rules/violations/:projectId - нарушения проекта
  fastify.get(
    '/rules/violations/:projectId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { projectId: string };
      const query = request.query as Record<string, unknown>;
      const violations = await rulesEngineService.getProjectViolations(
        params.projectId,
        query as never
      );
      return reply.send(violations);
    }
  );

  // PATCH /rules/violations/:id/acknowledge
  fastify.patch(
    '/rules/violations/:id/acknowledge',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const params = request.params as { id: string };
      const violation = await rulesEngineService.acknowledgeViolation(params.id, userId);
      return reply.send(violation);
    }
  );

  // PATCH /rules/violations/:id/resolve
  fastify.patch(
    '/rules/violations/:id/resolve',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const params = request.params as { id: string };
      const body = request.body as { resolution: string };
      const violation = await rulesEngineService.resolveViolation(
        params.id,
        userId,
        body.resolution
      );
      return reply.send(violation);
    }
  );

  // PATCH /rules/violations/:id/waive
  fastify.patch(
    '/rules/violations/:id/waive',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const params = request.params as { id: string };
      const body = request.body as { reason: string };
      try {
        const violation = await rulesEngineService.waiveViolation(params.id, userId, body.reason);
        return reply.send(violation);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(403).send({ error: err.message });
      }
    }
  );

  // GET /rules/violations/stats
  fastify.get(
    '/rules/violations/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const query = request.query as Record<string, unknown>;
      const stats = await rulesEngineService.getViolationStats(query as never);
      return reply.send(stats);
    }
  );

  // POST /rules - создать правило (Admin only)
  fastify.post(
    '/rules',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (dbUser?.role?.name !== 'Admin') {
        return reply.code(403).send({ error: 'Только Admin может создавать правила' });
      }
      const data = request.body as Record<string, unknown>;
      try {
        const rule = await rulesEngineService.createRule(data as never);
        return reply.code(201).send(rule);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // GET /rules - получить все правила
  fastify.get(
    '/rules',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const query = request.query as Record<string, unknown>;
      const rules = await rulesEngineService.getRules(query as never);
      return reply.send(rules);
    }
  );

  // GET /rules/:id - получить правило
  fastify.get(
    '/rules/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { id: string };
      try {
        const rule = await rulesEngineService.getRule(params.id);
        return reply.send(rule);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(404).send({ error: err.message });
      }
    }
  );

  // PATCH /rules/:id - обновить правило (Admin)
  fastify.patch(
    '/rules/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const params = request.params as { id: string };
      const data = request.body as Record<string, unknown>;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (dbUser?.role?.name !== 'Admin') {
        return reply.code(403).send({ error: 'Только Admin может изменять правила' });
      }
      const rule = await rulesEngineService.updateRule(params.id, data as never);
      return reply.send(rule);
    }
  );

  // DELETE /rules/:id - деактивировать (Admin)
  fastify.delete(
    '/rules/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const user = request.user as { id?: string; userId?: string };
      const userId = user.id || user.userId || '';
      const params = request.params as { id: string };
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (dbUser?.role?.name !== 'Admin') {
        return reply.code(403).send({ error: 'Только Admin может удалять правила' });
      }
      await rulesEngineService.deactivateRule(params.id);
      return reply.code(204).send();
    }
  );
}
