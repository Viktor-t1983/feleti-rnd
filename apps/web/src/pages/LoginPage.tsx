import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { ru } from '../i18n/ru';

export function LoginPage(): JSX.Element {
  const { user } = useAuth();

  // Если пользователь уже авторизован, перенаправляем на dashboard
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      data-testid="login-page"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {ru.auth.signInToYourAccount}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {ru.auth.or}{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            {ru.auth.createAccount}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>

        {/* Links */}
        <div className="flex items-center justify-between mt-4 px-4">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Забыли пароль?
          </Link>
          <Link to="/register" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
