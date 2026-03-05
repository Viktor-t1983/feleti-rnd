/**
 * Projects Routes
 * API endpoints for project management
 */

import { FastifyInstance } from 'fastify';

import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middlewares/authenticate';
import { ReportsService } from '../reports/reports.service';

import {
  addProjectMemberSchema,
  createProjectSchema,
  projectFiltersSchema,
  projectIdParamSchema,
  projectMemberParamsSchema,
  updateProjectSchema,
} from './projects.schemas';
import { ProjectsService } from './projects.service';

// Singleton instance of ProjectsService
let projectsServiceInstance: ProjectsService | null = null;

function getProjectsService(): ProjectsService {
  if (!projectsServiceInstance) {
    projectsServiceInstance = new ProjectsService();
  }
  return projectsServiceInstance;
}

export function projectsRoutes(fastify: FastifyInstance): void {
  const projectsService = getProjectsService();

  // Get all projects with filters
  fastify.get(
    '/projects',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const filters = projectFiltersSchema.parse(request.query);
      const result = await projectsService.getProjects(filters);
      return reply.send(result);
    }
  );

  // Get project by ID
  fastify.get(
    '/projects/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = projectIdParamSchema.parse(request.params);
      const project = await projectsService.getProjectById(id);

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      return reply.send(project);
    }
  );

  // Create new project
  fastify.post(
    '/projects',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const parsedBody = createProjectSchema.parse(request.body);
      // If ownerId not provided, use current user from auth token
      const input = {
        ...parsedBody,
        ownerId: parsedBody.ownerId ?? request.user.userId,
      };
      const project = await projectsService.createProject(input);
      return reply.status(201).send(project);
    }
  );

  // Update project
  fastify.put(
    '/projects/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = projectIdParamSchema.parse(request.params);
      const input = updateProjectSchema.parse(request.body);

      const userId = request.user.userId;
      const isAdmin = request.user.role === 'admin';

      const project = await projectsService.updateProject(id, input, userId, isAdmin);
      return reply.send(project);
    }
  );

  // Delete project (soft delete)
  fastify.delete(
    '/projects/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = projectIdParamSchema.parse(request.params);

      const userId = request.user.userId;
      const isAdmin = request.user.role === 'admin';

      await projectsService.deleteProject(id, userId, isAdmin);
      return reply.status(204).send();
    }
  );

  // Get project members
  fastify.get(
    '/projects/:id/members',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = projectIdParamSchema.parse(request.params);
      const members = await projectsService.getProjectMembers(id);
      return reply.send(members);
    }
  );

  // Add project member
  fastify.post(
    '/projects/:id/members',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id: projectId } = projectIdParamSchema.parse(request.params);
      const input = addProjectMemberSchema.parse(request.body);

      const member = await projectsService.addProjectMember({
        ...input,
        projectId,
      });

      return reply.status(201).send(member);
    }
  );

  // Remove project member
  fastify.delete(
    '/projects/:id/members/:userId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id: projectId, userId } = projectMemberParamsSchema.parse(request.params);

      await projectsService.removeProjectMember(projectId, userId);
      return reply.status(204).send();
    }
  );

  // Export project as PDF
  fastify.get(
    '/projects/:id/pdf',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = projectIdParamSchema.parse(request.params);

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: { select: { fullName: true } },
          members: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
      });

      if (!project) {
        return reply.code(404).send({
          error: 'Project not found',
        });
      }

      // Transform to match ReportsService interface
      const projectData = {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description || '',
        stage: project.stage,
        status: project.status,
        budget: project.budget,
        spent: project.spent,
        startDate: project.startDate,
        targetDate: project.targetDate,
        creator: { fullName: project.owner.fullName },
        members: project.members.map((m: { role: string; user?: { fullName: string } }) => ({
          role: m.role,
          user: m.user ? { fullName: m.user.fullName } : undefined,
        })),
      };

      const reportsService = new ReportsService();
      const buffer = await reportsService.generateProjectPDF(projectData);

      const filename = `project-${project.code}-${Date.now()}.pdf`;

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length)
        .send(buffer);
    }
  );
}
