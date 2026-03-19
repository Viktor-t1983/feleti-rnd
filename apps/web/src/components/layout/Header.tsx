import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPWA } from '@/hooks/useInstallPWA';
import { useSearch } from '@/hooks/useSearch';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { SearchModal } from '../ui/SearchModal';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, open, close } = useSearch();
  const { install, isInstallable, isInstalled } = useInstallPWA();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

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

  // Определяем роль пользователя (поддержка строки и объекта)
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole?.toLowerCase() === 'admin';

  const mainNavLinks = [
    { to: '/dashboard', label: 'Дашборд' },
    { to: '/projects', label: 'Проекты' },
    { to: '/financial-calculators', label: 'Калькуляторы' },
    { to: '/calendar', label: '📅 Календарь' },
    { to: '/analytics', label: '📊 Аналитика' },
    { to: '/engineering', label: '⚙️ Engineering' },
    { to: '/knowledge-base', label: '📚 База знаний' },
  ];

  const adminNavLinks = [
    {
      to: '/admin',
      label: '🛡️ Панель администратора',
      desc: 'Управление пользователями и системой',
    },
    { to: '/admin/settings', label: '⚙️ Настройки AI', desc: 'Провайдер, модель, API ключ' },
    { to: '/admin/templates', label: '📝 Редактор шаблонов', desc: 'Блоки уставов, AI промпты' },
    { to: '/knowledge-base', label: '📚 База знаний', desc: 'Оборудование, рынки, конкуренты' },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">FELETI R&D</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative ml-2">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  onBlur={() => setTimeout(() => setAdminMenuOpen(false), 200)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    adminMenuOpen || window.location.pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20'
                  }`}
                >
                  🛡️ Админ
                  <svg
                    className={`w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {adminMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Панель администратора
                    </div>
                    {adminNavLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {link.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {link.desc}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            {isInstallable && !isInstalled && (
              <button
                onClick={handleInstall}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 animate-pulse"
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
                <span className="hidden lg:block">Установить</span>
              </button>
            )}

            {isInstalled && (
              <span className="hidden lg:flex text-xs text-green-500 dark:text-green-400 items-center gap-1">
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
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
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
              <span className="hidden xl:block">Поиск</span>
            </button>

            {/* User Menu */}
            {user && (
              <>
                <Link
                  to="/profile"
                  className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 transition-colors"
                >
                  {user.fullName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 px-3 py-2 transition-colors"
                >
                  <span className="hidden sm:inline">Выйти</span>
                  <svg
                    className="w-5 h-5 sm:hidden"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col gap-1">
              {mainNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {isAdmin && (
                <>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      🛡️ Администратор
                    </div>
                    {adminNavLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex flex-col px-4 py-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {link.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {link.desc}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isOpen} onClose={close} />
    </header>
  );
}
