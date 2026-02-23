import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BudgetTrend {
  month: string;
  budget: number;
  spent: number;
  remaining: number;
  projects: number;
  utilization: number;
}

interface ROIData {
  id: string;
  code: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  utilization: number;
  roi: number;
  stage: string;
  status: string;
}

interface SpendingData {
  month: string;
  total: number;
}

interface StageStats {
  stage: string;
  count: number;
  totalBudget: number;
  totalSpent: number;
  avgBudget: number;
  avgSpent: number;
  utilization: number;
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: 'Идея',
  CONCEPT: 'Концепт',
  DESIGN: 'Дизайн',
  PROTOTYPE: 'Прототип',
  TESTING: 'Тестирование',
  PRODUCTION: 'Производство',
  COMPLETED: 'Завершён',
};

const STAGE_COLORS: Record<string, string> = {
  IDEA: '#8b5cf6',
  CONCEPT: '#6366f1',
  DESIGN: '#3b82f6',
  PROTOTYPE: '#f59e0b',
  TESTING: '#10b981',
  PRODUCTION: '#22c55e',
  COMPLETED: '#6b7280',
};

function formatMoney(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ₽`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K ₽`;
  }
  return `${Math.round(value)} ₽`;
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  const { data: budgetTrends = [], isLoading: trendsLoading } = useQuery<BudgetTrend[]>({
    queryKey: ['analytics-budget-trends'],
    queryFn: () => api.get('/api/analytics/budget-trends').then((r) => r.data),
  });

  const { data: roiData = [], isLoading: roiLoading } = useQuery<ROIData[]>({
    queryKey: ['analytics-roi'],
    queryFn: () => api.get('/api/analytics/roi').then((r) => r.data),
  });

  const { data: spendingData = [] } = useQuery<SpendingData[]>({
    queryKey: ['analytics-spending'],
    queryFn: () => api.get('/api/analytics/spending-over-time').then((r) => r.data),
  });

  const { data: stageStats = [] } = useQuery<StageStats[]>({
    queryKey: ['analytics-stage-stats'],
    queryFn: () => api.get('/api/analytics/stage-stats').then((r) => r.data),
  });

  const filteredTrends = budgetTrends.filter((t) => {
    if (period === 'all') return true;
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return new Date(t.month + '-01') >= cutoff;
  });

  const handleExportExcel = () => {
    const toastId = toast.loading('Генерируем Excel...');
    api
      .get('/api/analytics/export/excel', {
        responseType: 'blob',
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `feleti-report-${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success('Excel скачан!');
      })
      .catch(() => {
        toast.dismiss(toastId);
        toast.error('Ошибка экспорта');
      });
  };

  const handleExportCSV = () => {
    const toastId = toast.loading('Генерируем CSV...');
    api
      .get('/api/analytics/export/csv', {
        responseType: 'blob',
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `feleti-report-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success('CSV скачан!');
      })
      .catch(() => {
        toast.dismiss(toastId);
        toast.error('Ошибка экспорта');
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 Расширенная аналитика
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Детальный анализ финансовых показателей
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Excel
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: '3m', label: '3 месяца' },
            { key: '6m', label: '6 месяцев' },
            { key: '1y', label: '1 год' },
            { key: 'all', label: 'Всё время' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as typeof period)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart 1: Budget vs Actual */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Бюджет vs Фактические траты
          </h3>

          {trendsLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={filteredTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(v) => formatMoney(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => formatMoney(Number(value) || 0)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Бюджет"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Потрачено"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Cumulative Spending */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Кумулятивные траты по времени
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(v) => formatMoney(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value) => formatMoney(Number(value) || 0)}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Всего потрачено" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chart 3: ROI by Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              ROI по проектам (топ-5)
            </h3>

            {roiLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {roiData.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMoney(project.spent)} / {formatMoney(project.budget)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.min(project.utilization, 100)}%` }}
                        />
                      </div>

                      <span
                        className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                          project.roi >= 50
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : project.roi >= 20
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {project.roi > 0 ? '+' : ''}
                        {project.roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart 4: Stage Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Распределение по стадиям
            </h3>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stageStats.map((s) => ({
                    name: STAGE_LABELS[s.stage] || s.stage,
                    value: s.totalBudget,
                    count: s.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {stageStats.map((s) => (
                    <Cell key={s.stage} fill={STAGE_COLORS[s.stage] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table: Stage Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Детальная статистика по стадиям
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Стадия
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Проектов
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Общий бюджет
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Потрачено
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Средний бюджет
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Использование
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stageStats.map((stat) => (
                  <tr
                    key={stat.stage}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STAGE_COLORS[stat.stage] }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {STAGE_LABELS[stat.stage] || stat.stage}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                      {stat.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {formatMoney(stat.totalBudget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatMoney(stat.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatMoney(stat.avgBudget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${
                          stat.utilization > 90
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : stat.utilization > 70
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {stat.utilization.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
