import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';

interface ProductClass {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  _count?: {
    projects: number;
    engineeringRules: number;
  };
}

export function ProductClassesPage() {
  const { data: classes, isLoading } = useQuery<ProductClass[]>({
    queryKey: ['product-classes'],
    queryFn: () => api.get('/api/product-classes').then(r => r.data)
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🏭 Product Classes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Классы продуктов для R&D проектов
            </p>
          </div>
          
          <Link
            to="/engineering"
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ← Назад
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes?.map((cls) => (
              <Link
                key={cls.id}
                to={`/engineering/product-classes/${cls.id}`}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:scale-105">
                  
                  {/* Icon & Category */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{cls.icon || '📦'}</div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {cls.category}
                    </span>
                  </div>

                  {/* Title & Code */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {cls.code}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {cls.description || 'Без описания'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span>📁</span>
                      <span>{cls._count?.projects || 0} проектов</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📏</span>
                      <span>{cls._count?.engineeringRules || 0} правил</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
