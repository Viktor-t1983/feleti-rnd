import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  projects: Array<{
    id: string;
    code: string;
    name: string;
    stage: string;
    status: string;
    description: string | null;
  }>;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
  }>;
  total: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Статусы проектов
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
  IDEA: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  CONCEPT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  DESIGN: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROTOTYPE: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  TESTING: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  PRODUCTION: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Поиск с debounce
  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', query],
    queryFn: () => api.get(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.data),
    enabled: query.length >= 2,
    staleTime: 300,
  });

  // Фокус при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 50);
    }
  }, [isOpen]);

  // Закрытие по Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Все результаты в одном массиве
  const allResults = [
    ...(results?.projects.map((p) => ({
      type: 'project' as const,
      id: p.id,
      title: p.name,
      subtitle: p.code,
      meta: p.stage,
      status: p.status,
      href: `/projects/${p.id}`,
    })) || []),
    ...(results?.users.map((u) => ({
      type: 'user' as const,
      id: u.id,
      title: u.fullName,
      subtitle: u.email,
      meta: u.role,
      status: '',
      href: `/profile`,
    })) || []),
  ];

  // Быстрые ссылки (показываем если нет запроса)
  const quickLinks = [
    { icon: '📊', title: 'Дашборд', href: '/dashboard' },
    { icon: '📁', title: 'Все проекты', href: '/projects' },
    { icon: '➕', title: 'Новый проект', href: '/projects/new' },
    { icon: '🧮', title: 'Калькуляторы', href: '/financial-calculators' },
    { icon: '👤', title: 'Мой профиль', href: '/profile' },
  ];

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  // Навигация стрелками
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = query.length >= 2 ? allResults : quickLinks;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && items[selectedIndex]) {
      handleSelect(items[selectedIndex].href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen px-4 pt-20 pb-8 flex items-start justify-center">
        {/* Backdrop blur */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            {/* Иконка поиска */}
            <svg
              className="w-5 h-5 text-gray-400 shrink-0"
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
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Поиск проектов, пользователей..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-lg outline-none"
            />

            {/* Loading */}
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}

            {/* Escape hint */}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {/* Быстрые ссылки */}
            {query.length < 2 && (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Быстрый переход
                </p>
                {quickLinks.map((link, idx) => (
                  <button
                    key={link.href}
                    onClick={() => handleSelect(link.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      selectedIndex === idx
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {link.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Результаты поиска */}
            {query.length >= 2 && (
              <div className="p-2">
                {/* Проекты */}
                {results && results.projects.length > 0 && (
                  <>
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Проекты
                    </p>
                    {results.projects.map((project, idx) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelect(`/projects/${project.id}`)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {/* Иконка проекта */}
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <svg
                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {project.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {project.code}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${STAGE_COLORS[project.stage] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {STAGE_LABELS[project.stage] || project.stage}
                            </span>
                          </div>
                        </div>

                        <svg
                          className="w-4 h-4 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                  </>
                )}

                {/* Пользователи */}
                {results && results.users.length > 0 && (
                  <>
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2">
                      Пользователи
                    </p>
                    {results.users.map((user, idx) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelect('/profile')}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                          selectedIndex === results.projects.length + idx
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {/* Аватар */}
                        <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-white font-semibold text-sm">
                          {user.fullName && user.fullName[0] ? user.fullName[0].toUpperCase() : '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
                          {user.role === 'Admin'
                            ? 'Админ'
                            : user.role === 'Manager'
                              ? 'Менеджер'
                              : 'Инженер'}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* Ничего не найдено */}
                {results && results.total === 0 && !isLoading && (
                  <div className="px-3 py-8 text-center">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Ничего не найдено
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Попробуйте другой запрос
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">↑↓</kbd>
                навигация
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  Enter
                </kbd>
                выбрать
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  Esc
                </kbd>
                закрыть
              </span>
            </div>
            {results && results.total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {results.total} результатов
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
