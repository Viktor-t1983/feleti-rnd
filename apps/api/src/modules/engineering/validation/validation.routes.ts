import { FastifyInstance } from 'fastify';
import { prisma } from '../../../lib/prisma';
import { validationGatesService } from './validation-gates.service';

export async function validationRoutes(fastify: FastifyInstance) {
  // POST /validation/gates/:gateCode/validate
  fastify.post(
    '/validation/gates/:gateCode/validate',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId?: string; id?: string };
      const userId = user.userId || user.id || '';
      const { gateCode } = request.params as {
        gateCode: string;
      };
      const { projectId, force } = request.body as {
        projectId: string;
        force?: boolean;
      };

      try {
        const result = await validationGatesService.validateGate({
          projectId,
          gateCode,
          validatedBy: userId,
          force,
        });

        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // GET /validation/projects/:projectId/status
  fastify.get(
    '/validation/projects/:projectId/status',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      try {
        const status = await validationGatesService.getProjectGatesStatus(projectId);

        return reply.send(status);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(404).send({
          error: err.message,
        });
      }
    }
  );

  // POST /api/validation/gates - создать Gate (Admin)
  fastify.post(
    '/api/validation/gates',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId?: string; id?: string };
      const userId = user.userId || user.id || '';

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (dbUser?.role.name !== 'Admin') {
        return reply.code(403).send({
          error: 'Только Admin может создавать Gates',
        });
      }

      const data = request.body as unknown as Record<string, unknown>;

      try {
        const gate = await validationGatesService.createGate(
          data as Parameters<typeof validationGatesService.createGate>[0]
        );

        return reply.code(201).send(gate);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // GET /api/validation/gates - получить все Gates
  fastify.get(
    '/api/validation/gates',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const filters = request.query as Record<string, unknown>;

      const gates = await validationGatesService.getGates(
        filters as Parameters<typeof validationGatesService.getGates>[0]
      );

      return reply.send(gates);
    }
  );

  // GET /api/validation/gates/:id - получить Gate
  fastify.get(
    '/api/validation/gates/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const gate = await validationGatesService.getGate(id);

        return reply.send(gate);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(404).send({
          error: err.message,
        });
      }
    }
  );

  // PATCH /api/validation/gates/:id - обновить (Admin)
  fastify.patch(
    '/api/validation/gates/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId?: string; id?: string };
      const userId = user.userId || user.id || '';
      const { id } = request.params as { id: string };
      const data = request.body as Record<string, unknown>;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (dbUser?.role.name !== 'Admin') {
        return reply.code(403).send({
          error: 'Только Admin может изменять Gates',
        });
      }

      const gate = await validationGatesService.updateGate(
        id,
        data as Parameters<typeof validationGatesService.updateGate>[1]
      );

      return reply.send(gate);
    }
  );

  // PATCH /api/validation/validations/:id/waive
  fastify.patch(
    '/api/validation/validations/:id/waive',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId?: string; id?: string };
      const userId = user.userId || user.id || '';
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };

      try {
        const result = await validationGatesService.waiveGate(id, userId, reason);

        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(403).send({
          error: err.message,
        });
      }
    }
  );

  // GET /api/validation/stats
  fastify.get(
    '/api/validation/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const filters = request.query as Record<string, unknown>;

      const stats = await validationGatesService.getGatesStats(
        filters as Parameters<typeof validationGatesService.getGatesStats>[0]
      );

      return reply.send(stats);
    }
  );
}
