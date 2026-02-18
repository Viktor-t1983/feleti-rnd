import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Forgot Password Page
 * Allows user to request password reset via email
 */
export function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Введите корректный email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        email,
      });
      setSent(true);
      toast.success('Письмо отправлено!');
    } catch {
      toast.error('Ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">FELETI R&D</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Система управления проектами</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {sent ? (
            // Success state
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Письмо отправлено!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Проверьте {email} и перейдите по ссылке для сброса пароля. Ссылка действительна 1
                час.
              </p>
              <Link
                to="/login"
                className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-center transition-colors"
              >
                Вернуться к входу
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Забыли пароль?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Введите email и мы пришлём ссылку для сброса пароля
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="admin@feleti.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors duration-200"
                >
                  {loading ? 'Отправляем...' : 'Отправить ссылку'}
                </button>

                <Link
                  to="/login"
                  className="block text-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  ← Вернуться к входу
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
