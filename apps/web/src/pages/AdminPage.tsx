import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isBlocked: boolean;
  createdAt: string;
  role: { id: string; name: string };
  _count: { ownedProjects: number };
}

interface Role {
  id: string;
  name: string;
}

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  blockedUsers: number;
  newUsersThisWeek: number;
  roles: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Engineer: 'Инженер',
};

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Engineer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

/** Check if user was registered within last 7 days */
const isNew = (createdAt: string): boolean => {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return days <= 7;
};

export function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'blocked'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Загрузка данных
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then((r) => r.data),
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats').then((r) => r.data),
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/api/admin/roles').then((r) => r.data),
  });

  // Блокировка
  const blockMutation = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) =>
      api.patch(`/api/admin/users/${id}/block`, { block }).then((r) => r.data),
    onSuccess: (_, { block }) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-users'],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-stats'],
      });
      toast.success(block ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    },
    onError: (e: unknown) => {
      const error = e as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Ошибка');
    },
  });

  // Смена роли
  const roleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      api.patch(`/api/admin/users/${id}/role`, { roleId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-users'],
      });
      toast.success('Роль изменена!');
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Ошибка при смене роли');
    },
  });

  // Удаление
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-users'],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-stats'],
      });
      toast.success('Пользователь удалён');
    },
    onError: (e: unknown) => {
      const error = e as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleDelete = (user: User) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Удалить {user.fullName}?</p>
          <p className="text-xs text-gray-500">Это действие необратимо!</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteMutation.mutate(user.id);
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs"
            >
              Удалить
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs"
            >
              Отмена
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  // Фильтрация
  const filteredUsers = users
    .filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => {
      if (filter === 'new') return isNew(u.createdAt);
      if (filter === 'blocked') return u.isBlocked;
      return true;
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🛡️ Панель администратора
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Управление пользователями и системой
            </p>
          </div>
          <a
            href="/admin/settings"
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ⚙️ Настройки системы
          </a>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              {
                label: 'Всего пользователей',
                value: stats.totalUsers,
                icon: '👥',
                color: 'bg-blue-50 dark:bg-blue-900/20',
                textColor: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Всего проектов',
                value: stats.totalProjects,
                icon: '📁',
                color: 'bg-green-50 dark:bg-green-900/20',
                textColor: 'text-green-600 dark:text-green-400',
              },
              {
                label: 'Заблокировано',
                value: stats.blockedUsers,
                icon: '🔒',
                color: 'bg-red-50 dark:bg-red-900/20',
                textColor: 'text-red-600 dark:text-red-400',
              },
              {
                label: 'Новые за неделю',
                value: stats.newUsersThisWeek,
                icon: '🆕',
                color: 'bg-green-50 dark:bg-green-900/20',
                textColor: 'text-green-600 dark:text-green-400',
              },
              {
                label: 'Ролей в системе',
                value: stats.roles.length,
                icon: '🎭',
                color: 'bg-purple-50 dark:bg-purple-900/20',
                textColor: 'text-purple-600 dark:text-purple-400',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.color} rounded-2xl p-5 border border-transparent`}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Распределение по ролям */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Распределение по ролям
            </h3>
            <div className="flex items-center gap-4">
              {stats.roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      ROLE_COLORS[role.name] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ROLE_LABELS[role.name] || role.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {role.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Таблица пользователей */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          {/* Шапка таблицы */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Пользователи</h3>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Кнопки фильтра */}
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'Все' },
                  { key: 'new', label: '🆕 Новые' },
                  { key: 'blocked', label: '🔒 Заблокир.' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as 'all' | 'new' | 'blocked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Поиск */}
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Список */}
          {usersLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Аватар + инфо */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.isBlocked ? 'bg-gray-400' : 'bg-blue-600'
                      }`}
                    >
                      {user.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                        </p>
                        {isNew(user.createdAt) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                            🆕 Новый
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Заблокирован
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  {/* Роль + действия */}
                  <div className="flex items-center gap-3">
                    {/* Проекты */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      {user._count.ownedProjects} пр.
                    </span>

                    {/* Роль (кликабельна для Admin) */}
                    {editingUser?.id === user.id ? (
                      <select
                        defaultValue={user.role.id}
                        onChange={(e) =>
                          roleMutation.mutate({
                            id: user.id,
                            roleId: e.target.value,
                          })
                        }
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onBlur={() => setEditingUser(null)}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {ROLE_LABELS[role.name] || role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ROLE_COLORS[user.role.name] || 'bg-gray-100 text-gray-700'
                        } hover:opacity-80 transition-opacity`}
                        title="Нажмите для изменения роли"
                      >
                        {ROLE_LABELS[user.role.name] || user.role.name}
                      </button>
                    )}

                    {/* Блокировка */}
                    {user.role.name !== 'Admin' && (
                      <button
                        onClick={() =>
                          blockMutation.mutate({
                            id: user.id,
                            block: !user.isBlocked,
                          })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          user.isBlocked
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                        title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      >
                        {user.isBlocked ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        )}
                      </button>
                    )}

                    {/* Удаление */}
                    {user.role.name !== 'Admin' && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Удалить пользователя"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
