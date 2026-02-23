/**
 * Templates Routes
 * API endpoints for project templates management
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AuthenticatedRequest } from '../../middlewares/authenticate';
import { templatesService } from './templates.service';

/**
 * Middleware to check if user has Admin role
 */
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authenticatedRequest = request as AuthenticatedRequest;
  const userId = authenticatedRequest.user?.userId;
  const userRole = authenticatedRequest.user?.role;

  if (!userId) {
    return reply.code(401).send({
      error: 'Требуется аутентификация',
    });
  }

  // Role is already attached by authenticate middleware
  if (userRole !== 'Admin') {
    return reply.code(403).send({
      error: 'Доступ запрещён. Только для Admin.',
    });
  }
}

interface CreateTemplateBody {
  name: string;
  description?: string;
  defaultStage?: string;
  estimatedBudget?: number;
  estimatedDays?: number;
  teamSize?: number;
  checklist?: string[];
}

interface UpdateTemplateBody {
  name?: string;
  description?: string;
  defaultStage?: string;
  estimatedBudget?: number;
  estimatedDays?: number;
  teamSize?: number;
  checklist?: string[];
}

interface TemplateParams {
  id: string;
}

export async function templatesRoutes(fastify: FastifyInstance) {
  // GET /api/templates - Get all templates (all authenticated users)
  fastify.get(
    '/templates',
    {
      preHandler: [fastify.authenticate],
    },
    async (_, reply) => {
      const templates = await templatesService.getAll();
      return reply.send(templates);
    }
  );

  // GET /api/templates/:id - Get template by ID (all authenticated users)
  fastify.get<{ Params: TemplateParams }>(
    '/templates/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;

      const template = await templatesService.getById(id);

      if (!template) {
        return reply.code(404).send({
          error: 'Шаблон не найден',
        });
      }

      return reply.send(template);
    }
  );

  // POST /api/templates - Create template (Admin only)
  fastify.post<{ Body: CreateTemplateBody }>(
    '/templates',
    {
      preHandler: [fastify.authenticate, requireAdmin],
    },
    async (request, reply) => {
      const authenticatedRequest = request as AuthenticatedRequest;
      const userId = authenticatedRequest.user.userId;
      const body = request.body;

      // Validate required fields
      if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        return reply.code(400).send({
          error: 'Название шаблона обязательно',
        });
      }

      try {
        const template = await templatesService.create({
          name: body.name.trim(),
          description: body.description?.trim(),
          defaultStage: body.defaultStage,
          estimatedBudget: body.estimatedBudget,
          estimatedDays: body.estimatedDays,
          teamSize: body.teamSize,
          checklist: body.checklist,
          createdById: userId,
        });

        return reply.code(201).send(template);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // PATCH /api/templates/:id - Update template (Admin only)
  fastify.patch<{ Params: TemplateParams; Body: UpdateTemplateBody }>(
    '/templates/:id',
    {
      preHandler: [fastify.authenticate, requireAdmin],
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      try {
        const template = await templatesService.update(id, {
          name: body.name?.trim(),
          description: body.description?.trim(),
          defaultStage: body.defaultStage,
          estimatedBudget: body.estimatedBudget,
          estimatedDays: body.estimatedDays,
          teamSize: body.teamSize,
          checklist: body.checklist,
        });

        return reply.send(template);
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === 'Template not found') {
          return reply.code(404).send({
            error: 'Шаблон не найден',
          });
        }
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );

  // DELETE /api/templates/:id - Delete template (Admin only)
  fastify.delete<{ Params: TemplateParams }>(
    '/templates/:id',
    {
      preHandler: [fastify.authenticate, requireAdmin],
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        await templatesService.delete(id);
        return reply.code(204).send();
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === 'Template not found') {
          return reply.code(404).send({
            error: 'Шаблон не найден',
          });
        }
        return reply.code(400).send({
          error: err.message,
        });
      }
    }
  );
}
