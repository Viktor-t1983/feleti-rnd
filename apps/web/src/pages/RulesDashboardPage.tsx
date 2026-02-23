import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface EngineeringRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recommendation: string | null;
  _count?: {
    violations: number;
  };
}

const riskColors = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function RulesDashboardPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data: rules, isLoading } = useQuery<EngineeringRule[]>({
    queryKey: ['engineering-rules', categoryFilter],
    queryFn: () => {
      const params = categoryFilter ? `?category=${categoryFilter}` : '';
      return api.get(`/api/rules${params}`).then((r) => r.data);
    },
  });

  const categories = [
    { value: '', label: 'Все категории', icon: '📋' },
    { value: 'THERMAL', label: 'Тепловые', icon: '🔥' },
    { value: 'AERODYNAMIC', label: 'Аэродинамика', icon: '🌪️' },
    { value: 'MECHANICAL', label: 'Механика', icon: '⚙️' },
    { value: 'HYGIENE', label: 'Гигиена', icon: '🧼' },
    { value: 'SAFETY', label: 'Безопасность', icon: '🛡️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📏 Engineering Rules
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Инженерные правила и нарушения</p>
          </div>

          <Link
            to="/engineering"
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ← Назад
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`
                px-4 py-2 rounded-lg whitespace-nowrap transition-all
                ${
                  categoryFilter === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }
              `}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Rules List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {rules?.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rule.name}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {rule.code}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${riskColors[rule.riskLevel]}`}
                      >
                        {rule.riskLevel}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {rule.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">💬 {rule.message}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Нарушений: {rule._count?.violations || 0}
                    </div>
                  </div>
                </div>

                {rule.recommendation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-900 dark:text-blue-300">
                    💡 {rule.recommendation}
                  </div>
                )}
              </div>
            ))}

            {(!rules || rules.length === 0) && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Правила не найдены
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
