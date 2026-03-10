import { useQuery } from '@tanstack/react-query';

import { KPICard } from '../components/dashboard/KPICard';
import { Header } from '../components/layout/Header';
import { useReports } from '../hooks/useReports';
import { ru } from '../i18n/ru';
import { api } from '../lib/api';

interface DashboardStats {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
  };
  charts: {
    projectsByStage: Array<{ stage: string; _count: number }>;
    projectsByStatus: Array<{ status: string; _count: number }>;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    code: string;
    stage: string;
    budget: number;
    spent: number;
    owner: { fullName: string };
  }>;
}

export function DashboardPage(): JSX.Element {
  const { downloadDashboardReport } = useReports();

  // Fetch dashboard data
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      api.get<DashboardStats>('/api/analytics/dashboard').then((response) => response.data),
  });

  // Budget data query - temporarily disabled (waiting for charts fix)
  /*
  const { data: budgetData } = useQuery<
    Array<{ stage: string; _sum: { budget: number; spent: number } }>
  >({
    queryKey: ['budget-analysis'],
    queryFn: () =>
      api
        .get<
          Array<{ stage: string; _sum: { budget: number; spent: number } }>
        >('/api/analytics/budget')
        .then((response) => response.data),
  });
  */

  if (isLoading) {
    return <div className="p-8 text-gray-600 dark:text-gray-400">{ru.common.loading}</div>;
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      notation: 'compact',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="dashboard-page">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with PDF export */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {ru.dashboard.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Обзор всех R&D проектов</p>
          </div>

          <button
            onClick={downloadDashboardReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-red-600 hover:bg-red-700 text-white text-sm font-medium
              transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Скачать PDF отчёт
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <KPICard
            title={ru.dashboard.totalProjects}
            value={stats?.summary.totalProjects || 0}
            change={12}
            trend="up"
            icon={<span>📊</span>}
          />

          <KPICard
            title={ru.dashboard.activeProjects}
            value={stats?.summary.activeProjects || 0}
            change={5}
            trend="up"
            icon={<span>🚀</span>}
          />

          <KPICard
            title={ru.dashboard.totalBudget}
            value={formatCurrency(stats?.summary.totalBudget || 0)}
            icon={<span>💰</span>}
          />

          <KPICard
            title={ru.dashboard.budgetUsed}
            value={`${(stats?.summary.budgetUtilization || 0).toFixed(1)}%`}
            change={3}
            trend={(stats?.summary.budgetUtilization || 0) > 80 ? 'down' : 'neutral'}
            icon={<span>📈</span>}
          />
        </div>

        {/* Charts - временно отключены */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProjectsStageChart data={stats?.charts.projectsByStage || []} />
          <BudgetChart data={budgetData || []} />
        </div> */}

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ru.dashboard.recentProjects}
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats?.recentProjects.map((project) => (
              <div key={project.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.code} •{' '}
                      {(ru.stages as Record<string, string>)[project.stage] || project.stage}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(project.budget)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {project.owner.fullName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
