import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { api } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Reset Password Page
 * Allows user to set new password using token from email
 */
export function ResetPasswordPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    api
      .get(`/auth/validate-token/${token}`)
      .then((r) => setTokenValid(r.data.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 6) {
      toast.error('Минимум 6 символов');
      return;
    }
    if (password !== confirm) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password,
      });
      toast.success('Пароль изменён! Войдите заново.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">FELETI R&D</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {tokenValid === null && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-3 text-sm">Проверяем ссылку...</p>
            </div>
          )}

          {tokenValid === false && (
            <div className="text-center">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Ссылка недействительна
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Ссылка истекла или уже была использована. Запросите новую.
              </p>
              <a
                href="/forgot-password"
                className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-center transition-colors"
              >
                Запросить новую ссылку
              </a>
            </div>
          )}

          {tokenValid === true && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Новый пароль</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Придумайте надёжный пароль
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Повторите пароль
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Повторите пароль"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password match indicator */}
                {confirm && (
                  <p
                    className={`text-xs ${password === confirm ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}
                  >
                    {password === confirm ? '✅ Пароли совпадают' : '❌ Пароли не совпадают'}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
                >
                  {loading ? 'Сохраняем...' : 'Сохранить новый пароль'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
