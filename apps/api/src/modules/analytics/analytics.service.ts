/**
 * Analytics Service
 * Business logic for dashboard analytics
 */

import { BudgetAnalysis, DashboardStats, ProjectTrend } from './analytics.types';

import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get role for RBAC
    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter = role.isSystem || role.name === 'admin'
      ? {} // Admin sees all projects
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        };

    // Общая статистика
    const [
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      projectsByStage,
      projectsByStatus,
      recentProjects
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({ where: { ...projectFilter, status: 'ACTIVE' } }),
      prisma.project.aggregate({ _sum: { budget: true }, where: projectFilter }),
      prisma.project.aggregate({ _sum: { spent: true }, where: projectFilter }),
      prisma.project.groupBy({
        by: ['stage'],
        _count: true,
        where: projectFilter
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: true,
        where: projectFilter
      }),
      prisma.project.findMany({
        where: projectFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { fullName: true } } }
      })
    ]);

    const budgetSum = totalBudget._sum.budget ?? 0;
    const spentSum = totalSpent._sum.spent ?? 0;

    // Transform recentProjects to match DashboardStats type
    const transformedRecentProjects = recentProjects.map(project => ({
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      stage: project.stage,
      status: project.status,
      priority: project.priority,
      ownerId: project.ownerId,
      startDate: project.startDate,
      endDate: project.endDate,
      targetDate: project.targetDate,
      completedAt: project.completedAt,
      budget: project.budget,
      spent: project.spent,
      // Convert JsonValue scores to Record<string, number> | null
      scores: project.scores && typeof project.scores === 'object' && !Array.isArray(project.scores)
        ? project.scores as Record<string, number>
        : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner
    }));

    return {
      summary: {
        totalProjects,
        activeProjects,
        totalBudget: budgetSum,
        totalSpent: spentSum,
        budgetUtilization: budgetSum > 0
          ? (spentSum / budgetSum) * 100
          : 0
      },
      charts: {
        projectsByStage,
        projectsByStatus
      },
      recentProjects: transformedRecentProjects
    };
  }

  async getProjectsTrend(userId: string, period: 'week' | 'month' | 'year'): Promise<ProjectTrend[]> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter = role.isSystem || role.name === 'admin'
      ? {}
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        };

    // Тренд создания проектов по времени
    const startDate = this.getStartDate(period);

    const projects = await prisma.project.groupBy({
      by: ['createdAt'],
      where: {
        ...projectFilter,
        createdAt: { gte: startDate }
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    });

    // Группируем по дате (без времени) для корректного отображения тренда
    const groupedByDate = projects.reduce<Map<string, { _count: number }>>(
      (acc, item: { createdAt: Date; _count: number }) => {
        const dateKey = new Date(item.createdAt).toISOString().split('T')[0] ?? '';
        const existing = acc.get(dateKey);
        if (existing) {
          existing._count += item._count;
        } else {
          acc.set(dateKey, { _count: item._count });
        }
        return acc;
      }, new Map<string, { _count: number }>());

    return Array.from(groupedByDate.entries()).map(([date, data]) => ({
      createdAt: new Date(date),
      _count: data._count
    }));
  }

  async getBudgetAnalysis(userId: string): Promise<BudgetAnalysis[]> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter = role.isSystem || role.name === 'admin'
      ? {}
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        };

    // Анализ бюджетов по стадиям
    const analysis = await prisma.project.groupBy({
      by: ['stage'],
      _sum: { budget: true, spent: true },
      _avg: { budget: true, spent: true },
      _count: true,
      where: projectFilter
    });

    return analysis;
  }

  private getStartDate(period: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}
