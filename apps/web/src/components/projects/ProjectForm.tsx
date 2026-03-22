/**
 * ProjectForm Component
 * Form component for creating and editing projects
 */

import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  CreateProjectInput,
  ProjectStage,
  ProjectStatus,
  UpdateProjectInput,
} from '../../types/project.types';

// Переводы для стадий проекта
const stageTranslations: Record<ProjectStage, string> = {
  [ProjectStage.IDEA]: 'Идея',
  [ProjectStage.CONCEPT]: 'Концепт',
  [ProjectStage.DESIGN]: 'Проектирование',
  [ProjectStage.PROTOTYPE]: 'Прототип',
  [ProjectStage.TESTING]: 'Тестирование',
  [ProjectStage.PRODUCTION]: 'Производство',
  [ProjectStage.COMPLETED]: 'Завершён',
};

// Переводы для статусов проекта
const statusTranslations: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'Активен',
  [ProjectStatus.ON_HOLD]: 'Приостановлен',
  [ProjectStatus.CANCELLED]: 'Отменён',
  [ProjectStatus.COMPLETED]: 'Завершён',
};

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialData?: CreateProjectInput | UpdateProjectInput;
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProjectForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps): JSX.Element {
  const [formData, setFormData] = useState<CreateProjectInput | UpdateProjectInput>(() => {
    if (mode === 'create') {
      return {
        code: (initialData as CreateProjectInput)?.code || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        stage: initialData?.stage || ProjectStage.IDEA,
        status: initialData?.status || ProjectStatus.ACTIVE,
        priority: initialData?.priority || 'medium',
        ownerId: (initialData as CreateProjectInput)?.ownerId || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        targetDate: initialData?.targetDate || '',
        budget: initialData?.budget,
      } as CreateProjectInput;
    } else {
      return {
        name: initialData?.name || '',
        description: initialData?.description || '',
        stage: initialData?.stage || ProjectStage.IDEA,
        status: initialData?.status || ProjectStatus.ACTIVE,
        priority: initialData?.priority || 'medium',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        targetDate: initialData?.targetDate || '',
        budget: initialData?.budget,
      } as UpdateProjectInput;
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create') {
      const createData = formData as CreateProjectInput;
      if (!createData.code) {
        newErrors['code'] = 'Код обязателен';
      } else if (!/^[A-Za-z0-9][A-Za-z0-9-]{1,19}$/.test(createData.code)) {
        newErrors['code'] =
          'Код: 2-20 символов, буквы, цифры и дефис (например: F374476, K-200, FM-VAC-3T)';
      }

      if (!createData.ownerId) {
        newErrors['ownerId'] = 'Владелец обязателен';
      }
    }

    if (!formData.name) {
      newErrors['name'] = 'Название обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      toast.success(mode === 'create' ? 'Проект успешно создан!' : 'Проект успешно обновлён!');
    } catch (err: unknown) {
      let errorMessage = 'Произошла ошибка';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
      ) {
        errorMessage = err.response.data.message;
        setErrors({ form: errorMessage });
      }
      toast.error(errorMessage);
    }
  };

  const handleChange = (field: string, value: string | number | undefined): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {mode === 'create' ? 'Создание проекта' : 'Редактирование проекта'}
      </h2>

      {errors['form'] ? (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{errors['form']}</p>
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Code (only for create mode) */}
        {mode === 'create' && (
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Код проекта *
            </label>
            <input
              id="code"
              type="text"
              value={(formData as CreateProjectInput).code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="Например: K-200"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-code-input"
            />
            {errors['code'] ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors['code']}
              </p>
            ) : null}
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Название проекта *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Введите название проекта"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="project-name-input"
          />
          {errors['name'] ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors['name']}
            </p>
          ) : null}
        </div>

        {/* Описание */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Описание
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Опишите ваш проект (необязательно)..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="project-description-input"
          />
        </div>

        {/* Стадия и статус */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="stage"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Стадия
            </label>
            <select
              id="stage"
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-stage-select"
            >
              {Object.values(ProjectStage).map((stage) => (
                <option key={stage} value={stage}>
                  {stageTranslations[stage]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Статус
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-status-select"
            >
              {Object.values(ProjectStatus).map((status) => (
                <option key={status} value={status}>
                  {statusTranslations[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Приоритет */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Приоритет
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="project-priority-select"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Дата начала
            </label>
            <input
              id="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-start-date-input"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Дата окончания
            </label>
            <input
              id="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-end-date-input"
            />
          </div>

          <div>
            <label
              htmlFor="targetDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Целевая дата
            </label>
            <input
              id="targetDate"
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => handleChange('targetDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-target-date-input"
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Бюджет (руб.)
          </label>
          <input
            id="budget"
            type="number"
            value={formData.budget || ''}
            onChange={(e) =>
              handleChange('budget', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="5000000"
            min="0"
            step="1000"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="project-budget-input"
          />
        </div>

        {/* Owner ID (only for create mode) */}
        {mode === 'create' && (
          <div>
            <label
              htmlFor="ownerId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              ID владельца *
            </label>
            <input
              id="ownerId"
              type="text"
              value={(formData as CreateProjectInput).ownerId}
              onChange={(e) => handleChange('ownerId', e.target.value)}
              placeholder="uuid владельца"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="project-owner-id-input"
            />
            {errors['ownerId'] ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors['ownerId']}
              </p>
            ) : null}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="project-submit-button"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
                <span className="ml-2">Сохранение...</span>
              </span>
            ) : mode === 'create' ? (
              'Создать проект'
            ) : (
              'Сохранить изменения'
            )}
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="project-cancel-button"
            >
              Отмена
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
