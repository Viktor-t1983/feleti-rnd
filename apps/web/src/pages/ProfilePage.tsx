import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  createdAt: string;
  role: { name: string };
  _count: {
    ownedProjects: number;
    projectMembers: number;
  };
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Форма профиля
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');

  // Форма пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Загрузка профиля
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/api/users/profile');
      return response.data;
    },
  });

  // Заполнить форму при загрузке профиля
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!fullName && profile.fullName) setFullName(profile.fullName);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!username && profile.username) setUsername(profile.username);
    }
  }, [profile, fullName, username]);

  // Обновление профиля
  const updateMutation = useMutation({
    mutationFn: async (data: { fullName: string; username: string }) => {
      const response = await api.patch('/api/users/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Профиль обновлён!');
      if (updateUser) updateUser(data);
    },
    onError: () => {
      toast.error('Ошибка при обновлении профиля');
    },
  });

  // Смена пароля
  const passwordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const response = await api.post('/api/users/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Пароль успешно изменён!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка при смене пароля');
    },
  });

  const handleProfileSave = () => {
    if (!fullName.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }
    updateMutation.mutate({ fullName, username });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }
    passwordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  // Аватар - первая буква имени
  const profileFullName = profile?.fullName || user?.fullName || '';
  const profileEmail = profile?.email || user?.email || '';
  const avatarLetter = profileFullName[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main
        className="max-w-4xl mx-auto px-4 py-8
        sm:px-6 lg:px-8"
      >
        {/* Заголовок */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold text-gray-900
            dark:text-white"
          >
            Профиль
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Управление личными данными</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - аватар и статистика */}
          <div className="lg:col-span-1">
            {/* Аватар */}
            <div
              className="bg-white dark:bg-gray-800
              rounded-2xl border border-gray-200
              dark:border-gray-700 p-6 text-center mb-6"
            >
              <div
                className="w-24 h-24 rounded-full
                bg-blue-600 flex items-center justify-center
                text-white text-3xl font-bold mx-auto mb-4"
              >
                {avatarLetter}
              </div>

              <h2
                className="text-lg font-semibold
                text-gray-900 dark:text-white"
              >
                {profileFullName}
              </h2>

              <p
                className="text-sm text-gray-500
                dark:text-gray-400 mt-1"
              >
                {profileEmail}
              </p>

              <span
                className="inline-block mt-3 px-3 py-1
                rounded-full text-xs font-medium
                bg-blue-100 text-blue-800
                dark:bg-blue-900/30 dark:text-blue-400"
              >
                {profile?.role?.name === 'Admin'
                  ? 'Администратор'
                  : profile?.role?.name === 'Manager'
                    ? 'Менеджер'
                    : 'Инженер'}
              </span>
            </div>

            {/* Статистика */}
            <div
              className="bg-white dark:bg-gray-800
              rounded-2xl border border-gray-200
              dark:border-gray-700 p-6"
            >
              <h3
                className="text-sm font-semibold
                text-gray-900 dark:text-white mb-4"
              >
                Статистика
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span
                    className="text-sm text-gray-500
                    dark:text-gray-400"
                  >
                    Создано проектов
                  </span>
                  <span
                    className="text-sm font-semibold
                    text-gray-900 dark:text-white"
                  >
                    {profile?._count?.ownedProjects || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span
                    className="text-sm text-gray-500
                    dark:text-gray-400"
                  >
                    Участие в проектах
                  </span>
                  <span
                    className="text-sm font-semibold
                    text-gray-900 dark:text-white"
                  >
                    {profile?._count?.projectMembers || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span
                    className="text-sm text-gray-500
                    dark:text-gray-400"
                  >
                    Дата регистрации
                  </span>
                  <span
                    className="text-sm font-semibold
                    text-gray-900 dark:text-white"
                  >
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('ru-RU')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - формы */}
          <div className="lg:col-span-2 space-y-6">
            {/* Форма редактирования */}
            <div
              className="bg-white dark:bg-gray-800
              rounded-2xl border border-gray-200
              dark:border-gray-700 p-6"
            >
              <h3
                className="text-lg font-semibold
                text-gray-900 dark:text-white mb-6"
              >
                Личные данные
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2
                      focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2
                      focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-200 dark:border-gray-700
                      bg-gray-50 dark:bg-gray-800
                      text-gray-500 dark:text-gray-500
                      cursor-not-allowed"
                  />
                  <p
                    className="text-xs text-gray-500
                    dark:text-gray-400 mt-1"
                  >
                    Email изменить нельзя
                  </p>
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={updateMutation.isPending}
                  className="w-full py-2.5 px-4 rounded-xl
                    bg-blue-600 hover:bg-blue-700
                    disabled:bg-blue-400
                    text-white font-medium
                    transition-colors duration-200"
                >
                  {updateMutation.isPending ? 'Сохраняем...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>

            {/* Форма смены пароля */}
            <div
              className="bg-white dark:bg-gray-800
              rounded-2xl border border-gray-200
              dark:border-gray-700 p-6"
            >
              <h3
                className="text-lg font-semibold
                text-gray-900 dark:text-white mb-6"
              >
                Сменить пароль
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2
                      focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2
                      focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium
                    text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Повторите новый пароль
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2
                      focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordMutation.isPending}
                  className="w-full py-2.5 px-4 rounded-xl
                    bg-gray-800 hover:bg-gray-700
                    dark:bg-gray-700 dark:hover:bg-gray-600
                    disabled:opacity-50
                    text-white font-medium
                    transition-colors duration-200"
                >
                  {passwordMutation.isPending ? 'Меняем пароль...' : 'Изменить пароль'}
                </button>
              </div>
            </div>

            {/* Email уведомления */}
            <div
              className="bg-white dark:bg-gray-800
              rounded-2xl border border-gray-200
              dark:border-gray-700 p-6"
            >
              <h3
                className="text-lg font-semibold
                text-gray-900 dark:text-white mb-6"
              >
                Email уведомления
              </h3>

              <div className="space-y-4">
                {[
                  {
                    key: 'welcome',
                    label: 'Приветствие',
                    desc: 'При регистрации в системе',
                    enabled: true,
                  },
                  {
                    key: 'projectCreated',
                    label: 'Создание проекта',
                    desc: 'При создании нового проекта',
                    enabled: true,
                  },
                  {
                    key: 'teamInvite',
                    label: 'Приглашение в команду',
                    desc: 'При добавлении в проект',
                    enabled: true,
                  },
                  {
                    key: 'deadlineWarning',
                    label: 'Дедлайн через 7 дней',
                    desc: 'Напоминание о приближающемся дедлайне',
                    enabled: true,
                  },
                  {
                    key: 'budgetWarning',
                    label: 'Бюджет > 80%',
                    desc: 'Предупреждение о расходе бюджета',
                    enabled: true,
                  },
                ].map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between
                      py-3 border-b border-gray-100
                      dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p
                        className="text-sm font-medium text-gray-900
                        dark:text-white"
                      >
                        {setting.label}
                      </p>
                      <p
                        className="text-xs text-gray-500
                        dark:text-gray-400 mt-0.5"
                      >
                        {setting.desc}
                      </p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      className={`relative w-11 h-6 rounded-full
                        transition-colors duration-200
                        focus:outline-none focus:ring-2
                        focus:ring-blue-500 focus:ring-offset-2
                        ${setting.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                      role="switch"
                      aria-checked={setting.enabled}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5
                          bg-white rounded-full shadow
                          transition-transform duration-200
                          ${setting.enabled ? 'translate-x-5 left-6' : 'translate-x-0.5 left-0.5'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
