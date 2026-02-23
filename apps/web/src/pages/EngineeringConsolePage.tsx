import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export function EngineeringConsolePage() {
  // Статистика
  const { data: stats, isLoading } = useQuery({
    queryKey: ['engineering-stats'],
    queryFn: async () => {
      const [classesRes, rulesRes] = await Promise.all([
        api.get('/api/product-classes').catch(() => ({ data: [] })),
        api.get('/api/rules').catch(() => ({ data: [] })),
      ]);
      return {
        classes: classesRes.data,
        rules: rulesRes.data,
      };
    },
  });

  const cards = [
    {
      title: 'Product Classes',
      count: stats?.classes?.length || 0,
      icon: '🏭',
      color: 'from-blue-500 to-cyan-500',
      link: '/engineering/product-classes',
      description: 'Классы продуктов',
    },
    {
      title: 'Engineering Rules',
      count: stats?.rules?.length || 0,
      icon: '📏',
      color: 'from-purple-500 to-pink-500',
      link: '/engineering/rules',
      description: 'Инженерные правила',
    },
    {
      title: 'Validation Gates',
      count: 5,
      icon: '🚪',
      color: 'from-green-500 to-emerald-500',
      link: '/engineering/gates',
      description: 'Контрольные точки',
    },
    {
      title: 'Calculation Blocks',
      count: 3,
      icon: '🧮',
      color: 'from-orange-500 to-red-500',
      link: '/engineering/calculations',
      description: 'Расчётные блоки',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚙️ Engineering Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление инженерной базой знаний и процессами R&D
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <Link key={card.title} to={card.link} className="group">
              <div
                className={`
                relative overflow-hidden rounded-2xl p-6
                bg-linear-to-br ${card.color}
                hover:scale-105 transition-all duration-200
                shadow-lg hover:shadow-2xl
              `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{card.icon}</div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {isLoading ? '...' : card.count}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{card.title}</h3>
                <p className="text-white/80 text-sm">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Быстрые действия</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/engineering/product-classes/new"
              className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="text-2xl mb-2">➕</div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Создать Product Class
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Новый класс продукта</p>
            </Link>

            <Link
              to="/engineering/rules/new"
              className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
            >
              <div className="text-2xl mb-2">📏</div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Добавить правило
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Новое инженерное правило</p>
            </Link>

            <Link
              to="/engineering/calculations/new"
              className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
            >
              <div className="text-2xl mb-2">🧮</div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Создать расчётный блок
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Новый блок расчётов</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
