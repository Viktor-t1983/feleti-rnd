/**
 * Analytics Service
 * Business logic for dashboard analytics
 */

import { BudgetAnalysis, DashboardStats, ProjectTrend } from './analytics.types';

import ExcelJS from 'exceljs';
import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get role for RBAC
    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter =
      role.isSystem || role.name === 'admin'
        ? {} // Admin sees all projects
        : {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          };

    // Общая статистика
    const [
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      projectsByStage,
      projectsByStatus,
      recentProjects,
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({ where: { ...projectFilter, status: 'ACTIVE' } }),
      prisma.project.aggregate({ _sum: { budget: true }, where: projectFilter }),
      prisma.project.aggregate({ _sum: { spent: true }, where: projectFilter }),
      prisma.project.groupBy({
        by: ['stage'],
        _count: true,
        where: projectFilter,
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: true,
        where: projectFilter,
      }),
      prisma.project.findMany({
        where: projectFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { fullName: true } } },
      }),
    ]);

    const budgetSum = totalBudget._sum.budget ?? 0;
    const spentSum = totalSpent._sum.spent ?? 0;

    // Transform recentProjects to match DashboardStats type
    const transformedRecentProjects = recentProjects.map((project) => ({
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
      scores:
        project.scores && typeof project.scores === 'object' && !Array.isArray(project.scores)
          ? (project.scores as Record<string, number>)
          : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
    }));

    return {
      summary: {
        totalProjects,
        activeProjects,
        totalBudget: budgetSum,
        totalSpent: spentSum,
        budgetUtilization: budgetSum > 0 ? (spentSum / budgetSum) * 100 : 0,
      },
      charts: {
        projectsByStage,
        projectsByStatus,
      },
      recentProjects: transformedRecentProjects,
    };
  }

  async getProjectsTrend(
    userId: string,
    period: 'week' | 'month' | 'year'
  ): Promise<ProjectTrend[]> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter =
      role.isSystem || role.name === 'admin'
        ? {}
        : {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          };

    // Тренд создания проектов по времени
    const startDate = this.getStartDate(period);

    const projects = await prisma.project.groupBy({
      by: ['createdAt'],
      where: {
        ...projectFilter,
        createdAt: { gte: startDate },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
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
      },
      new Map<string, { _count: number }>()
    );

    return Array.from(groupedByDate.entries()).map(([date, data]) => ({
      createdAt: new Date(date),
      _count: data._count,
    }));
  }

  async getBudgetAnalysis(userId: string): Promise<BudgetAnalysis[]> {
    // Get user role for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true, isSystem: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Build project filter based on RBAC
    const projectFilter =
      role.isSystem || role.name === 'admin'
        ? {}
        : {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          };

    // Анализ бюджетов по стадиям
    const analysis = await prisma.project.groupBy({
      by: ['stage'],
      _sum: { budget: true, spent: true },
      _avg: { budget: true, spent: true },
      _count: true,
      where: projectFilter,
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

  // ============================================
  // EXTENDED ANALYTICS METHODS
  // ============================================

  /**
   * Get budget trends grouped by month
   */
  async getBudgetTrends(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const projects = await prisma.project.findMany({
      where: filter,
      select: {
        id: true,
        budget: true,
        spent: true,
        startDate: true,
        createdAt: true,
        stage: true,
      },
    });

    // Group by month
    const byMonth = new Map<
      string,
      {
        budget: number;
        spent: number;
        count: number;
      }
    >();

    projects.forEach((p) => {
      const date = p.startDate || p.createdAt;
      const monthKey = new Date(date).toISOString().slice(0, 7);

      const existing = byMonth.get(monthKey) || {
        budget: 0,
        spent: 0,
        count: 0,
      };

      byMonth.set(monthKey, {
        budget: existing.budget + Number(p.budget || 0),
        spent: existing.spent + Number(p.spent || 0),
        count: existing.count + 1,
      });
    });

    return Array.from(byMonth.entries())
      .map(([month, data]) => ({
        month,
        budget: data.budget,
        spent: data.spent,
        remaining: data.budget - data.spent,
        projects: data.count,
        utilization: data.budget > 0 ? (data.spent / data.budget) * 100 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate ROI by project
   */
  async getROIByProject(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const projects = await prisma.project.findMany({
      where: {
        ...filter,
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        code: true,
        name: true,
        budget: true,
        spent: true,
        stage: true,
        status: true,
      },
    });

    return projects
      .map((p) => {
        const budget = Number(p.budget) || 0;
        const spent = Number(p.spent) || 0;

        const estimatedRevenue = budget * 1.3;
        const roi = spent > 0 ? ((estimatedRevenue - spent) / spent) * 100 : 0;

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          budget,
          spent,
          remaining: budget - spent,
          utilization: budget > 0 ? (spent / budget) * 100 : 0,
          roi: Math.round(roi * 10) / 10,
          stage: p.stage,
          status: p.status,
        };
      })
      .sort((a, b) => b.roi - a.roi);
  }

  /**
   * Get cumulative spending over time
   */
  async getSpendingOverTime(userId: string, startDate?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const dateFilter = startDate
      ? {
          createdAt: { gte: new Date(startDate) },
        }
      : {};

    const projects = await prisma.project.findMany({
      where: { ...filter, ...dateFilter },
      select: {
        spent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let cumulative = 0;
    const byMonth = new Map<string, number>();

    projects.forEach((p) => {
      const monthKey = new Date(p.createdAt).toISOString().slice(0, 7);
      cumulative += Number(p.spent || 0);
      byMonth.set(monthKey, cumulative);
    });

    return Array.from(byMonth.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Compare multiple projects
   * Фильтрует проекты по userId для предотвращения утечки данных
   */
  async compareProjects(projectIds: string[], userId: string) {
    // Проверяем доступ пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true, isSystem: true } } },
    });

    const isAdmin = user?.role.isSystem || user?.role.name === 'Admin';

    // Фильтр проектов - только те, к которым пользователь имеет доступ
    const projectFilter = isAdmin
      ? { id: { in: projectIds } }
      : {
          id: { in: projectIds },
          OR: [{ creatorId: userId }, { members: { some: { userId } } }],
        };

    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        code: true,
        name: true,
        budget: true,
        spent: true,
        startDate: true,
        targetDate: true,
        stage: true,
        status: true,
        _count: {
          select: {
            members: true,
            attachments: true,
          },
        },
      },
    });

    return projects.map((p) => {
      const budget = Number(p.budget) || 0;
      const spent = Number(p.spent) || 0;

      const start = p.startDate ? new Date(p.startDate) : null;
      const end = p.targetDate ? new Date(p.targetDate) : null;

      const durationDays =
        start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        budget,
        spent,
        remaining: budget - spent,
        utilization: budget > 0 ? (spent / budget) * 100 : 0,
        teamSize: p._count.members,
        filesCount: p._count.attachments,
        duration: durationDays,
        stage: p.stage,
        status: p.status,
      };
    });
  }

  /**
   * Get statistics by project stage
   */
  async getStageStatistics(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const stats = await prisma.project.groupBy({
      by: ['stage'],
      where: filter,
      _count: true,
      _sum: {
        budget: true,
        spent: true,
      },
      _avg: {
        budget: true,
        spent: true,
      },
    });

    return stats.map((s) => ({
      stage: s.stage,
      count: s._count,
      totalBudget: Number(s._sum.budget) || 0,
      totalSpent: Number(s._sum.spent) || 0,
      avgBudget: Number(s._avg.budget) || 0,
      avgSpent: Number(s._avg.spent) || 0,
      utilization:
        s._sum.budget && s._sum.spent ? (Number(s._sum.spent) / Number(s._sum.budget)) * 100 : 0,
    }));
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(userId: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FELETI R&D';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Общая статистика');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const [totalProjects, aggregate] = await Promise.all([
      prisma.project.count({ where: filter }),
      prisma.project.aggregate({
        where: filter,
        _sum: { budget: true, spent: true },
      }),
    ]);

    summarySheet.columns = [
      { header: 'Показатель', key: 'metric', width: 30 },
      { header: 'Значение', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Всего проектов', value: totalProjects },
      { metric: 'Общий бюджет', value: Number(aggregate._sum.budget) || 0 },
      { metric: 'Всего потрачено', value: Number(aggregate._sum.spent) || 0 },
      {
        metric: 'Остаток',
        value: (Number(aggregate._sum.budget) || 0) - (Number(aggregate._sum.spent) || 0),
      },
    ]);

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const projectsSheet = workbook.addWorksheet('Проекты');

    const projects = await prisma.project.findMany({
      where: filter,
      select: {
        code: true,
        name: true,
        stage: true,
        status: true,
        budget: true,
        spent: true,
        startDate: true,
        targetDate: true,
        owner: { select: { fullName: true } },
      },
    });

    projectsSheet.columns = [
      { header: 'Код', key: 'code', width: 12 },
      { header: 'Название', key: 'name', width: 30 },
      { header: 'Стадия', key: 'stage', width: 15 },
      { header: 'Статус', key: 'status', width: 12 },
      { header: 'Бюджет', key: 'budget', width: 15 },
      { header: 'Потрачено', key: 'spent', width: 15 },
      { header: 'Остаток', key: 'remaining', width: 15 },
      { header: 'Использ.%', key: 'utilization', width: 12 },
      { header: 'Руководитель', key: 'creator', width: 25 },
    ];

    projects.forEach((p) => {
      const budget = Number(p.budget) || 0;
      const spent = Number(p.spent) || 0;

      projectsSheet.addRow({
        code: p.code,
        name: p.name,
        stage: p.stage,
        status: p.status,
        budget,
        spent,
        remaining: budget - spent,
        utilization: budget > 0 ? ((spent / budget) * 100).toFixed(1) + '%' : '0%',
        creator: p.owner.fullName,
      });
    });

    projectsSheet.getRow(1).font = { bold: true };
    projectsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    projectsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Promise<Buffer>;
  }

  /**
   * Generate CSV report
   */
  async generateCSVReport(userId: string): Promise<Buffer> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    const filter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    const projects = await prisma.project.findMany({
      where: filter,
      select: {
        code: true,
        name: true,
        stage: true,
        status: true,
        budget: true,
        spent: true,
        owner: { select: { fullName: true } },
      },
    });

    const headers = [
      'Код',
      'Название',
      'Стадия',
      'Статус',
      'Бюджет',
      'Потрачено',
      'Остаток',
      'Использование %',
      'Руководитель',
    ];

    const rows = projects.map((p) => {
      const budget = Number(p.budget) || 0;
      const spent = Number(p.spent) || 0;

      return [
        p.code,
        p.name,
        p.stage,
        p.status,
        budget,
        spent,
        budget - spent,
        budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0,
        p.owner.fullName,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');

    return Buffer.from(csv, 'utf-8');
  }
}
