/**
 * AI Providers Configuration Page
 * Настройка мульти-провайдерной AI инфраструктуры
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';

// Types
interface AIProvider {
  id: string;
  providerCode: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiEndpoint: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  capabilities: {
    research?: boolean;
    vision?: boolean;
    longContext?: boolean;
    search?: boolean;
  };
  available?: boolean;
}

interface FallbackSettings {
  chain: string[];
  autoFallback: boolean;
  researchProvider: string;
}

// API functions
const fetchProviders = async (): Promise<AIProvider[]> => {
  const { data } = await api.get('/api/ai-providers');
  return data.data;
};

const fetchFallbackSettings = async (): Promise<FallbackSettings> => {
  const { data } = await api.get('/api/ai-providers/fallback-chain');
  return data.data;
};

const updateProvider = async (
  code: string,
  updates: Partial<AIProvider>
): Promise<AIProvider> => {
  const { data } = await api.put(`/api/ai-providers/${code}`, updates);
  return data.data;
};

// Provider icons
const providerIcons: Record<string, string> = {
  deepseek: '🧠',
  kimi: '🌙',
  qwen: '⚡',
  glm: '🔮',
  minimax: '💬',
  perplexity: '🔍',
};

// Capability labels
const capabilityLabels: Record<string, string> = {
  research: 'Исследования',
  vision: 'Vision',
  longContext: 'Длинный контекст',
  search: 'Веб-поиск',
};

export default function AIProvidersPage() {
  const queryClient = useQueryClient();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIProvider>>({});

  // Queries
  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: fetchProviders,
  });

  const { data: fallbackSettings, isLoading: loadingFallback } = useQuery({
    queryKey: ['ai-fallback'],
    queryFn: fetchFallbackSettings,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ code, updates }: { code: string; updates: Partial<AIProvider> }) =>
      updateProvider(code, updates),
    onSuccess: () => {
      toast.success('Провайдер обновлён');
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setEditingProvider(null);
    },
    onError: () => {
      toast.error('Ошибка обновления');
    },
  });

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider.providerCode);
    setEditForm({
      enabled: provider.enabled,
      priority: provider.priority,
      defaultModel: provider.defaultModel,
      maxTokens: provider.maxTokens,
    });
  };

  const handleSave = (code: string) => {
    updateMutation.mutate({ code, updates: editForm });
  };

  if (loadingProviders || loadingFallback) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      {/* Header */}
      <PageHeader
        title="🤖 AI Провайдеры"
        subtitle="Настройка мульти-провайдерной AI инфраструктуры и fallback цепочки"
        backTo="/admin"
      />

      {/* Fallback Chain Settings */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">⚙️ Цепочка Fallback</h2>
          <p className="text-sm text-slate-400">
            Порядок переключения между провайдерами при ошибках
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {fallbackSettings?.chain.map((provider, index) => (
              <div key={provider} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <span className="text-xl">{providerIcons[provider] || '🤖'}</span>
                  <span className="text-white font-medium capitalize">{provider}</span>
                  <span className="text-xs text-blue-400 ml-2">#{index + 1}</span>
                </div>
                {index < fallbackSettings.chain.length - 1 && (
                  <span className="text-slate-500 text-xl">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  fallbackSettings?.autoFallback ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-slate-300">
                Автоматический fallback: {fallbackSettings?.autoFallback ? 'Вкл' : 'Выкл'}
              </span>
            </div>
            <div className="text-slate-400">
              Research-провайдер:{' '}
              <span className="text-white capitalize">
                {fallbackSettings?.researchProvider}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">🔌 Провайдеры</h2>
          <span className="text-sm text-slate-400">
            {providers?.length} провайдеров
          </span>
        </div>

        <div className="divide-y divide-slate-700">
          {providers?.map((provider) => (
            <div
              key={provider.providerCode}
              className="px-6 py-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {providerIcons[provider.providerCode] || '🤖'}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        provider.enabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {provider.enabled ? 'Включен' : 'Отключен'}
                    </span>
                    {provider.available ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                        API ключ настроен
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                        Нет API ключа
                      </span>
                    )}
                  </div>

                  {/* Code and endpoint */}
                  <code className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                    {provider.providerCode}
                  </code>
                  <p className="text-sm text-slate-400 mt-1">{provider.apiEndpoint}</p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(provider.capabilities)
                      .filter(([, value]) => value)
                      .map(([key]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs"
                        >
                          {capabilityLabels[key] || key}
                        </span>
                      ))}
                  </div>

                  {/* Edit form */}
                  {editingProvider === provider.providerCode ? (
                    <div className="mt-4 p-4 bg-slate-900 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Статус
                          </label>
                          <select
                            value={editForm.enabled ? 'true' : 'false'}
                            onChange={(e) =>
                              setEditForm({ ...editForm, enabled: e.target.value === 'true' })
                            }
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          >
                            <option value="true">Включен</option>
                            <option value="false">Отключен</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Приоритет
                          </label>
                          <input
                            type="number"
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({ ...editForm, priority: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Модель по умолчанию
                          </label>
                          <input
                            type="text"
                            value={editForm.defaultModel}
                            onChange={(e) =>
                              setEditForm({ ...editForm, defaultModel: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            value={editForm.maxTokens}
                            onChange={(e) =>
                              setEditForm({ ...editForm, maxTokens: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(provider.providerCode)}
                          disabled={updateMutation.isPending}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          {updateMutation.isPending ? 'Сохранение...' : '💾 Сохранить'}
                        </button>
                        <button
                          onClick={() => setEditingProvider(null)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
                        >
                          ❌ Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-4 text-sm text-slate-400">
                      <span>Модель: {provider.defaultModel}</span>
                      <span>Max tokens: {provider.maxTokens}</span>
                      <span>Приоритет: {provider.priority}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingProvider !== provider.providerCode && (
                  <button
                    onClick={() => handleEdit(provider)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                  >
                    ✏️ Изменить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-blue-400 font-medium mb-2">ℹ️ Информация</h3>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Приоритет определяет порядок fallback (0 = высший приоритет)</li>
          <li>Для research-задач рекомендуется Kimi или Perplexity</li>
          <li>Для длинных контекстов используйте Kimi (2M токенов)</li>
          <li>API ключи настраиваются в разделе &quot;Настройки системы&quot;</li>
        </ul>
      </div>
    </div>
  );
}
