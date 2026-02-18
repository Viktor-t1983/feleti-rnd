import React from 'react';

import { ru } from '../../i18n/ru';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function KPICard({ title, value, change, icon, trend }: KPICardProps): JSX.Element {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
        {icon ? <div className="text-blue-600 dark:text-blue-400">{icon}</div> : null}
      </div>

      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>

      {change !== undefined && (
        <div className="flex items-center text-sm">
          {trend === 'up' && (
            <span className="text-green-600 dark:text-green-400">↑ {change}%</span>
          )}
          {trend === 'down' && <span className="text-red-600 dark:text-red-400">↓ {change}%</span>}
          {trend === 'neutral' && (
            <span className="text-gray-600 dark:text-gray-400">→ {change}%</span>
          )}
          <span className="text-gray-500 dark:text-gray-400 ml-1">{ru.common.vsLastMonth}</span>
        </div>
      )}
    </div>
  );
}
