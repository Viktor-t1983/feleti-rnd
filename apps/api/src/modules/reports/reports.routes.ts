/**
 * Reports Routes
 * API endpoints for PDF report generation
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export async function reportsRoutes(fastify: FastifyInstance) {
  // GET /reports/project/:id
  fastify.get(
    '/reports/project/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

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
          error: 'Проект не найден',
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

      const buffer = await reportsService.generateProjectPDF(projectData);

      const filename = `project-${project.code}-${Date.now()}.pdf`;

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length)
        .send(buffer);
    }
  );

  // GET /reports/dashboard
  fastify.get(
    '/reports/dashboard',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const isAdmin = request.user.role === 'admin';

      const filter = isAdmin
        ? {}
        : {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          };

      const [totalProjects, activeProjects, budgetAgg, spentAgg, projectsByStage] =
        await Promise.all([
          prisma.project.count({ where: filter }),
          prisma.project.count({
            where: { ...filter, status: 'ACTIVE' },
          }),
          prisma.project.aggregate({
            where: filter,
            _sum: { budget: true },
          }),
          prisma.project.aggregate({
            where: filter,
            _sum: { spent: true },
          }),
          prisma.project.groupBy({
            by: ['stage'],
            where: filter,
            _count: true,
          }),
        ]);

      const totalBudget = Number(budgetAgg._sum.budget) || 0;
      const totalSpent = Number(spentAgg._sum.spent) || 0;

      const stats = {
        totalProjects,
        activeProjects,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        projectsByStage: projectsByStage.map((s: { stage: string; _count: number }) => ({
          stage: s.stage,
          _count: s._count,
        })),
      };

      const buffer = await reportsService.generateDashboardPDF(stats);

      const filename = `dashboard-${Date.now()}.pdf`;

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length)
        .send(buffer);
    }
  );
}
