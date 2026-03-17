/**
 * Admin Settings Page
 * Страница управления системными настройками (API ключи и т.д.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

// Types
interface SystemSetting {
  id: string;
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENCRYPTED';
  category: string;
  label: string;
  description: string | null;
  isEncrypted: boolean;
  updatedAt: string;
}

// API functions
const fetchSettings = async (): Promise<SystemSetting[]> => {
  const { data } = await api.get('/settings');
  return data.data;
};

const updateSetting = async (key: string, value: string): Promise<SystemSetting> => {
  const { data } = await api.put(`/settings/${key}`, { value });
  return data.data;
};

// Category labels
const categoryLabels: Record<string, string> = {
  ai: '🤖 AI и API ключи',
  general: '⚙️ Общие настройки',
  email: '📧 Email',
  security: '🔒 Безопасность',
};

// Value type labels
const valueTypeLabels: Record<string, string> = {
  STRING: 'Текст',
  NUMBER: 'Число',
  BOOLEAN: 'Да/Нет',
  JSON: 'JSON',
  ENCRYPTED: '🔐 Зашифровано',
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: fetchSettings,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
    onSuccess: () => {
      toast.success('Настройка сохранена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditingKey(null);
      setEditValue('');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  // Group settings by category
  const groupedSettings = settings?.reduce(
    (acc, setting) => {
      const cat = setting.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(setting);
      return acc;
    },
    {} as Record<string, SystemSetting[]>
  );

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value || '');
  };

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">⚙️ Настройки системы</h1>
        <p className="text-slate-400">
          Управление API ключами, параметрами AI и другими системными настройками
        </p>
      </div>

      {/* Settings by category */}
      <div className="space-y-8">
        {groupedSettings &&
          Object.entries(groupedSettings).map(([category, catSettings]) => (
            <div
              key={category}
              className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
            >
              {/* Category header */}
              <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">
                  {categoryLabels[category] || category}
                </h2>
                <span className="text-sm text-slate-400">
                  {catSettings.length} настройк
                  {catSettings.length === 1 ? 'а' : catSettings.length < 5 ? 'и' : ''}
                </span>
              </div>

              {/* Settings list */}
              <div className="divide-y divide-slate-700">
                {catSettings.map((setting) => (
                  <div
                    key={setting.key}
                    className="px-6 py-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Label and type */}
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-medium text-white">{setting.label}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              setting.isEncrypted
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-600 text-slate-300'
                            }`}
                          >
                            {valueTypeLabels[setting.valueType] || setting.valueType}
                          </span>
                        </div>

                        {/* Key */}
                        <code className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                          {setting.key}
                        </code>

                        {/* Description */}
                        {setting.description && (
                          <p className="text-sm text-slate-400 mt-2">{setting.description}</p>
                        )}

                        {/* Value display/edit */}
                        <div className="mt-3">
                          {editingKey === setting.key ? (
                            <div className="space-y-3">
                              {setting.valueType === 'BOOLEAN' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="true">Да (true)</option>
                                  <option value="false">Нет (false)</option>
                                </select>
                              ) : setting.valueType === 'JSON' ? (
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  rows={5}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                                  placeholder="{}"
                                />
                              ) : (
                                <input
                                  type={setting.isEncrypted ? 'password' : 'text'}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
                                  placeholder={
                                    setting.isEncrypted ? '••••••••' : 'Введите значение...'
                                  }
                                />
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSave(setting.key)}
                                  disabled={updateMutation.isPending}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
                                >
                                  {updateMutation.isPending ? 'Сохранение...' : '💾 Сохранить'}
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
                                >
                                  ❌ Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                {setting.isEncrypted ? (
                                  <span className="text-slate-500 italic">
                                    {setting.value ? '••••••••••••••••' : '(не задано)'}
                                  </span>
                                ) : setting.valueType === 'JSON' ? (
                                  <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                                    {setting.value || '{}'}
                                  </pre>
                                ) : (
                                  <span className="text-slate-300">
                                    {setting.value || (
                                      <span className="text-slate-500 italic">(не задано)</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleEdit(setting)}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                              >
                                ✏️ Изменить
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Updated at */}
                        <p className="text-xs text-slate-500 mt-2">
                          Обновлено: {new Date(setting.updatedAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Info block */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-blue-400 font-medium mb-2">ℹ️ Информация о безопасности</h3>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>API ключи хранятся в зашифрованном виде (AES-256)</li>
          <li>Доступ к настройкам имеют только пользователи с ролью ADMIN</li>
          <li>Изменения настроек применяются немедленно</li>
          <li>Рекомендуется регулярно обновлять API ключи</li>
        </ul>
      </div>
    </div>
  );
}
