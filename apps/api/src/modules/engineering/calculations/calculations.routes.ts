/* eslint-disable @typescript-eslint/no-explicit-any -- Required for request body handling */
import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma';
import { calculationsService } from './calculations.service';

export async function calculationsRoutes(fastify: FastifyInstance) {
  // POST /calculations/save - save calculation result directly (simple endpoint)
  fastify.post(
    '/calculations/save',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const userId = (request.user as { userId: string }).userId;
      const data = request.body as {
        projectId: string;
        type: string;
        category: 'FINANCIAL' | 'ENGINEERING';
        inputData: Record<string, unknown>;
        resultData: Record<string, unknown>;
        notes?: string;
      };

      try {
        const calculation = await calculationsService.saveCalculation(data, userId);
        return reply.status(201).send({ success: true, data: calculation });
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // POST /calculations/execute - execute calculation
  fastify.post(
    '/calculations/execute',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const userId = (request.user as { userId: string }).userId;
      const data = request.body as {
        projectId: string;
        blockCode: string;
        inputs: Record<string, unknown>;
      };

      try {
        const result = await calculationsService.execute({
          projectId: data.projectId,
          blockCode: data.blockCode,
          inputs: data.inputs,
          executedBy: userId,
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

  // GET /calculations/projects/:projectId
  fastify.get(
    '/calculations/projects/:projectId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { projectId: string };
      const filters = request.query as Record<string, unknown>;

      const result = await calculationsService.getProjectCalculations(params.projectId, filters);

      return reply.send(result);
    }
  );

  // POST /api/calculations/blocks - create block (Admin)
  fastify.post(
    '/calculations/blocks',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const userId = (request.user as { userId: string }).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (user?.role.name !== 'Admin') {
        return reply.code(403).send({
          error: 'Only Admin can create blocks',
        });
      }

      const data = request.body as Record<string, unknown>;

      try {
        const block = await calculationsService.createBlock(data as never);

        return reply.code(201).send(block);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // GET /api/calculations/blocks - get all blocks
  fastify.get(
    '/calculations/blocks',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const filters = request.query as Record<string, unknown>;

      const blocks = await calculationsService.getBlocks(filters as never);

      return reply.send(blocks);
    }
  );

  // GET /api/calculations/blocks/:id - get block
  fastify.get(
    '/calculations/blocks/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { id: string };

      try {
        const block = await calculationsService.getBlock(params.id);

        return reply.send(block);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(404).send({
          error: err.message,
        });
      }
    }
  );

  // PATCH /api/calculations/blocks/:id - update (Admin)
  fastify.patch(
    '/calculations/blocks/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const userId = (request.user as { userId: string }).userId;
      const params = request.params as { id: string };
      const data = request.body as Record<string, unknown>;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (user?.role.name !== 'Admin') {
        return reply.code(403).send({
          error: 'Only Admin can modify blocks',
        });
      }

      try {
        const block = await calculationsService.updateBlock(params.id, data as never);

        return reply.send(block);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // GET /api/calculations/stats
  fastify.get(
    '/calculations/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const filters = request.query as Record<string, unknown>;

      const stats = await calculationsService.getCalculationStats(filters as never);

      return reply.send(stats);
    }
  );

  // GET /api/projects/:projectId/calculations - get all project calculations
  fastify.get(
    '/projects/:projectId/calculations',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { projectId: string };

      const calculations = await prisma.calculation.findMany({
        where: { projectId: params.projectId },
        orderBy: { createdAt: 'desc' },
        include: {
          executedBy: { select: { fullName: true, email: true } },
          block: { select: { code: true, name: true, category: true } },
        },
      });

      return reply.send({ success: true, data: calculations });
    }
  );

  // GET /api/projects/:projectId/calculations/summary - get calculation summary
  fastify.get(
    '/projects/:projectId/calculations/summary',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { projectId: string };

      try {
        const summary = await calculationsService.getCalculationSummary(params.projectId);
        return reply.send({ success: true, data: summary });
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // GET /api/calculations/:id - get calculation by ID
  fastify.get(
    '/calculations/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { id: string };

      const calculation = await prisma.calculation.findUnique({
        where: { id: params.id },
        include: {
          executedBy: { select: { fullName: true, email: true } },
          project: { select: { code: true, name: true } },
          block: { select: { code: true, name: true, category: true } },
        },
      });

      if (!calculation) {
        return reply.code(404).send({ error: 'Calculation not found' });
      }

      return reply.send({ success: true, data: calculation });
    }
  );

  // DELETE /api/calculations/:id - delete calculation
  fastify.delete(
    '/calculations/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply) => {
      const params = request.params as { id: string };
      const userId = (request.user as { userId: string }).userId;

      const calculation = await prisma.calculation.findUnique({
        where: { id: params.id },
      });

      if (!calculation) {
        return reply.code(404).send({ error: 'Calculation not found' });
      }

      // Check if user has permission (creator or admin)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const isAdmin = user?.role.name === 'Admin';
      const isCreator = calculation.executedById === userId;

      if (!isAdmin && !isCreator) {
        return reply.code(403).send({ error: 'Forbidden: only creator or admin can delete' });
      }

      await prisma.calculation.delete({
        where: { id: params.id },
      });

      return reply.send({ success: true });
    }
  );
}
