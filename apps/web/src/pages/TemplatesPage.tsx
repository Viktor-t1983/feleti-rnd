/**
 * TemplatesPage Component
 * Page for viewing and managing project templates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

import { TemplateFormModal } from '@/components/templates/TemplateFormModal';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  defaultStage: string;
  estimatedBudget: number | null;
  estimatedDays: number | null;
  teamSize: number | null;
  checklist: string[] | null;
  createdBy: {
    fullName: string;
    username: string;
  };
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: 'Идея',
  CONCEPT: 'Концепт',
  DESIGN: 'Дизайн',
  PROTOTYPE: 'Прототип',
  TESTING: 'Тестирование',
  PRODUCTION: 'Производство',
  COMPLETED: 'Завершён',
};

export function TemplatesPage(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);

  const isAdmin = user?.role === 'Admin';

  // Load templates
  const { data: templates = [], isLoading } = useQuery<ProjectTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/api/templates');
      return response.data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      defaultStage?: string;
      estimatedBudget?: number;
      estimatedDays?: number;
      teamSize?: number;
      checklist?: string[];
    }) => {
      if (editingTemplate) {
        const response = await api.patch(`/api/templates/${editingTemplate.id}`, data);
        return response.data;
      }
      const response = await api.post('/api/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success(editingTemplate ? 'Шаблон обновлён!' : 'Шаблон создан!');
      setIsCreating(false);
      setEditingTemplate(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка сохранения');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Шаблон удалён');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleDelete = (template: ProjectTemplate): void => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Удалить шаблон "{template.name}"?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteMutation.mutate(template.id);
                toast.dismiss(t.id);
              }}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white"
            >
              Удалить
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-800"
            >
              Отмена
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleUseTemplate = (template: ProjectTemplate): void => {
    navigate(`/projects/new?template=${template.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎨 Шаблоны проектов
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Быстрое создание типовых проектов
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Создать шаблон
            </button>
          )}
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-6xl">🎨</p>
            <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Нет шаблонов</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin ? 'Создайте первый шаблон' : 'Администратор ещё не добавил шаблоны'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>

                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Редактировать"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Удалить"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {template.description && (
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                )}

                {/* Parameters */}
                <div className="mb-4 space-y-2">
                  {template.defaultStage && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Стадия:</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {STAGE_LABELS[template.defaultStage] || template.defaultStage}
                      </span>
                    </div>
                  )}

                  {template.estimatedBudget && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      💰 Примерный бюджет:{' '}
                      <span className="font-medium">
                        {Number(template.estimatedBudget).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}

                  {template.estimatedDays && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      ⏱️ Длительность:{' '}
                      <span className="font-medium">{template.estimatedDays} дней</span>
                    </div>
                  )}

                  {template.teamSize && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      👥 Размер команды:{' '}
                      <span className="font-medium">{template.teamSize} чел.</span>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                {template.checklist && template.checklist.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Список задач:
                    </p>
                    <ul className="space-y-1">
                      {template.checklist.slice(0, 3).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                        >
                          <span className="mt-0.5 text-green-500">✓</span>
                          {item}
                        </li>
                      ))}
                      {template.checklist.length > 3 && (
                        <li className="text-xs italic text-gray-500 dark:text-gray-500">
                          +{template.checklist.length - 3} ещё
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Use Template Button */}
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  Использовать шаблон →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(isCreating || editingTemplate) && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
          onSave={(data) => saveMutation.mutate(data)}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
