/**
 * Analytics Types
 * Type definitions for analytics module
 */

export interface DashboardStats {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
  };
  charts: {
    projectsByStage: Array<{
      stage: string;
      _count: number;
    }>;
    projectsByStatus: Array<{
      status: string;
      _count: number;
    }>;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    stage: string;
    status: string;
    priority: string;
    ownerId: string;
    startDate: Date | null;
    endDate: Date | null;
    targetDate: Date | null;
    completedAt: Date | null;
    budget: number | null;
    spent: number;
    scores: Record<string, number> | null;
    createdAt: Date;
    updatedAt: Date;
    owner: {
      fullName: string;
    };
  }>;
}

export interface ProjectTrend {
  createdAt: Date;
  _count: number;
}

export interface BudgetAnalysis {
  stage: string;
  _sum: {
    budget: number | null;
    spent: number | null;
  };
  _avg: {
    budget: number | null;
    spent: number | null;
  };
  _count: number;
}

export interface GetProjectsTrendParams {
  period: 'week' | 'month' | 'year';
}
