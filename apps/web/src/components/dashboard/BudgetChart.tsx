import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ru } from '../../i18n/ru';

interface BudgetChartProps {
  data: Array<{
    stage: string;
    _sum: { budget: number; spent: number };
  }>;
}

export function BudgetChart({ data }: BudgetChartProps): JSX.Element {
  const chartData = data
    .map((item) => ({
      stage: item.stage,
      budget: item._sum.budget || 0,
      spent: item._sum.spent || 0,
    }))
    .filter((item) => item.budget > 0 || item.spent > 0); // Фильтруем нулевые значения

  // Don't render if there's no data
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {ru.dashboard.budgetVsSpentByStage}
        </h3>
        <div className="h-75 flex items-center justify-center text-gray-500">
          Нет данных о бюджете
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number | undefined): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      notation: 'compact',
    }).format(value || 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {ru.dashboard.budgetVsSpentByStage}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis
            dataKey="stage"
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
          />
          <Tooltip
            formatter={formatCurrency}
            contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
          />
          <Bar dataKey="budget" fill="#3b82f6" name={ru.common.budget} />
          <Bar dataKey="spent" fill="#f59e0b" name={ru.common.spent} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
