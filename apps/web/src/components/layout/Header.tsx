import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPWA } from '@/hooks/useInstallPWA';
import { useSearch } from '@/hooks/useSearch';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { SearchModal } from '../ui/SearchModal';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, open, close } = useSearch();
  const { install, isInstallable, isInstalled } = useInstallPWA();

  const handleLogout = () => {
    logout();
    toast.success('Вы успешно вышли из системы');
    navigate('/login');
  };

  const handleInstall = async () => {
    const installed = await install();
    if (installed) {
      toast.success('Приложение установлено!');
    }
  };

  return (
    <header
      className="
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-700
      shadow-sm
      transition-colors duration-200
    "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">FELETI R&D</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Дашборд
            </Link>
            <Link
              to="/projects"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Проекты
            </Link>
            <Link
              to="/financial-calculators"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Калькуляторы
            </Link>
            <Link
              to="/calendar"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              📅 Календарь
            </Link>
            <Link
              to="/analytics"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              📊 Аналитика
            </Link>
            <Link
              to="/templates"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              🎨 Шаблоны проектов
            </Link>
            <Link
              to="/activity"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              📋 История
            </Link>
            <Link
              to="/engineering"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              ⚙️ Engineering
            </Link>
            <Link
              to="/engineering/calculators"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              🧮 Инж. расчёты
            </Link>
            <Link
              to="/knowledge-base"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              📚 База знаний
            </Link>
            {user?.role === 'Admin' && (
              <>
                <Link
                  to="/admin/templates"
                  className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  📝 Шаблоны
                </Link>
                <Link
                  to="/admin"
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  🛡️ Админ
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* PWA Install Button */}
            {isInstallable && !isInstalled && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 animate-pulse"
                title="Установить приложение"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:block">Установить</span>
              </button>
            )}

            {isInstalled && (
              <span className="text-xs text-green-500 dark:text-green-400 hidden sm:flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Установлено
              </span>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            {/* Search Button */}
            <button
              onClick={open}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
              title="Поиск (Ctrl+K)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden sm:block">Поиск</span>
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                Ctrl K
              </kbd>
            </button>

            {/* User info */}
            {user && (
              <>
                {user.role === 'Admin' && (
                  <Link
                    to="/admin/settings"
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hidden sm:block transition-colors"
                    title="Настройки системы"
                  >
                    ⚙️ Настройки
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hidden sm:block transition-colors"
                >
                  {user.fullName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                >
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal - outside header! */}
      <SearchModal isOpen={isOpen} onClose={close} />
    </header>
  );
}
