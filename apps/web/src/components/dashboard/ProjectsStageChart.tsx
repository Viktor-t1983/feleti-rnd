import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ru } from '../../i18n/ru';

const COLORS: Record<string, string> = {
  IDEA: '#6366f1',
  CONCEPT: '#8b5cf6',
  DESIGN: '#ec4899',
  PROTOTYPE: '#f59e0b',
  TESTING: '#10b981',
  PRODUCTION: '#3b82f6',
  COMPLETED: '#6b7280',
};

interface ProjectsStageChartProps {
  data: Array<{ stage: string; _count: number }>;
}

export function ProjectsStageChart({ data }: ProjectsStageChartProps): JSX.Element {
  const chartData = data
    .map((item) => ({
      name: item.stage,
      value: item._count || 0,
    }))
    .filter((item) => item.value > 0);

  // Don't render if there's no data
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {ru.dashboard.projectsByStage}
        </h3>
        <div className="h-75 flex items-center justify-center text-gray-500">
          Нет данных о проектах
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {ru.dashboard.projectsByStage}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis
            type="number"
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
            width={80}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
          />
          <Bar dataKey="value" name="Проектов" fill="#3b82f6">
            {chartData.map((entry) => (
              <Bar
                key={`bar-${entry.name}`}
                fill={COLORS[entry.name] || '#3b82f6'}
                dataKey="value"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
