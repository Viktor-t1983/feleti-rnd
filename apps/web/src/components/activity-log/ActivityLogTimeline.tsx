/**
 * ActivityLogTimeline Component
 * Timeline визуализация истории действий
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '@/lib/api';

/** Интерфейс записи лога активности */
interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  createdAt: string;
  user: {
    fullName: string;
    username: string;
  };
  project?: {
    code: string;
    name: string;
  };
}

/** Карточки действий с иконками и описанием */
const ACTION_LABELS: Record<string, string> = {
  PROJECT_CREATED: 'создал проект',
  PROJECT_UPDATED: 'обновил проект',
  PROJECT_DELETED: 'удалил проект',
  MEMBER_ADDED: 'добавил в команду',
  MEMBER_REMOVED: 'удалил из команды',
  COMMENT_CREATED: 'оставил комментарий',
  COMMENT_DELETED: 'удалил комментарий',
  FILE_UPLOADED: 'загрузил файл',
  FILE_DELETED: 'удалил файл',
  BUDGET_UPDATED: 'изменил бюджет',
};

/** Иконки для типов действий */
const ACTION_ICONS: Record<string, string> = {
  PROJECT_CREATED: '📁',
  PROJECT_UPDATED: '✏️',
  PROJECT_DELETED: '🗑️',
  MEMBER_ADDED: '👥',
  MEMBER_REMOVED: '👤',
  COMMENT_CREATED: '💬',
  COMMENT_DELETED: '🗨️',
  FILE_UPLOADED: '📎',
  FILE_DELETED: '📄',
  BUDGET_UPDATED: '💰',
};

/** Цветовые схемы для типов действий */
const ACTION_COLORS: Record<string, string> = {
  PROJECT_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PROJECT_UPDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROJECT_DELETED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEMBER_ADDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  MEMBER_REMOVED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  COMMENT_CREATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMMENT_DELETED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  FILE_UPLOADED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  FILE_DELETED: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  BUDGET_UPDATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

/** Форматирование времени "X минут назад" */
function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;

  return then.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Свойства компонента ActivityLogTimeline */
interface ActivityLogTimelineProps {
  projectId?: string;
  limit?: number;
}

/**
 * Компонент Timeline для отображения истории действий
 */
export function ActivityLogTimeline({ projectId, limit = 50 }: ActivityLogTimelineProps) {
  const [actionFilter, setActionFilter] = useState<string>('');

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', projectId, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (actionFilter) params.append('action', actionFilter);
      params.append('limit', limit.toString());

      const response = await api.get(`/api/activity-logs?${params}`);
      return response.data;
    },
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Нет активности</p>
      </div>
    );
  }

  return (
    <div>
      {/* Фильтр по типу действия */}
      {!projectId && uniqueActions.length > 0 && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActionFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              actionFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Все
          </button>
          {uniqueActions.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                actionFilter === action
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {ACTION_ICONS[action] || '📌'} {ACTION_LABELS[action] || action}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Вертикальная линия */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* События */}
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative flex gap-4">
              {/* Иконка */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 shrink-0 ${
                  ACTION_COLORS[log.action] ||
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {ACTION_ICONS[log.action] || '📌'}
              </div>

              {/* Контент */}
              <div className="flex-1 pb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-900 dark:text-white mb-1">
                    <span className="font-semibold">{log.user.fullName}</span>{' '}
                    {ACTION_LABELS[log.action] || log.action}
                    {log.entityName && (
                      <>
                        {' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {log.entityName}
                        </span>
                      </>
                    )}
                  </p>

                  {log.project && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      в проекте <span className="font-medium">{log.project.code}</span>
                    </p>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
