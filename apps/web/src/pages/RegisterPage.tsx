import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { ru } from '../i18n/ru';

export function RegisterPage(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Если пользователь уже авторизован, перенаправляем на dashboard
  useEffect(() => {
    if (user) {
      void navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      data-testid="register-page"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {ru.auth.createAccount}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {ru.auth.or}{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            {ru.auth.signInToExistingAccount}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm onSuccess={() => void navigate('/login')} className="space-y-6" />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  {ru.auth.passwordRequirements}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <ul className="list-disc pl-5 space-y-1">
                <li>{ru.auth.atLeast8Characters}</li>
                <li>{ru.auth.includeUppercaseLowercase}</li>
                <li>{ru.auth.includeAtLeastOneNumber}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
