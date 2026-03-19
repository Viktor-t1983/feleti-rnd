/**
 * PageHeader Component
 * Универсальный заголовок страницы с кнопкой "Назад"
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  /** Заголовок страницы */
  title: string;
  /** Подзаголовок/описание (опционально) */
  subtitle?: string;
  /**
   * Куда вернуться:
   * - не указан → история назад (navigate(-1))
   * - строка → конкретный путь (navigate(path))
   */
  backTo?: string;
  /** Дополнительные кнопки/действия справа */
  actions?: React.ReactNode;
  /** Скрыть кнопку назад */
  hideBack?: boolean;
  /** Вариант отображения */
  variant?: 'default' | 'compact';
}

export function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
  hideBack = false,
  variant = 'default',
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!hideBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 
                         dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800
                         transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {!hideBack && (
            <button
              onClick={handleBack}
              className="mt-1 p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 
                         dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800
                         transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Breadcrumbs Component
 * Хлебные крошки для навигации по иерархии
 */
interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.to && index < items.length - 1 ? (
            <button
              onClick={() => navigate(item.to!)}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400
                         transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
