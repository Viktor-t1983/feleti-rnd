/**
 * TemplateFormModal Component
 * Modal for creating and editing project templates
 */

import { useEffect, useState } from 'react';

interface ProjectTemplate {
  id: string;
  name: string;
  description?: string | null;
  defaultStage: string;
  estimatedBudget?: number | null;
  estimatedDays?: number | null;
  teamSize?: number | null;
  checklist?: string[] | null;
}

interface TemplateFormModalProps {
  template?: ProjectTemplate | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    defaultStage?: string;
    estimatedBudget?: number;
    estimatedDays?: number;
    teamSize?: number;
    checklist?: string[];
  }) => void;
  isSaving: boolean;
}

const STAGES = [
  { value: 'IDEA', label: 'Идея' },
  { value: 'CONCEPT', label: 'Концепт' },
  { value: 'DESIGN', label: 'Дизайн' },
  { value: 'PROTOTYPE', label: 'Прототип' },
  { value: 'TESTING', label: 'Тестирование' },
  { value: 'PRODUCTION', label: 'Производство' },
];

export function TemplateFormModal({
  template,
  onClose,
  onSave,
  isSaving,
}: TemplateFormModalProps): JSX.Element {
  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
    defaultStage: template?.defaultStage || 'IDEA',
    estimatedBudget: template?.estimatedBudget || '',
    estimatedDays: template?.estimatedDays || '',
    teamSize: template?.teamSize || '',
    checklist: template?.checklist || [],
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        defaultStage: template.defaultStage || 'IDEA',
        estimatedBudget: template.estimatedBudget || '',
        estimatedDays: template.estimatedDays || '',
        teamSize: template.teamSize || '',
        checklist: template.checklist || [],
      });
    }
  }, [template]);

  const updateForm = (field: string, value: string | number | string[]): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addChecklistItem = (): void => {
    if (!newChecklistItem.trim()) return;
    updateForm('checklist', [...form.checklist, newChecklistItem.trim()]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (index: number): void => {
    updateForm(
      'checklist',
      form.checklist.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = (): void => {
    if (!form.name.trim()) {
      return;
    }

    onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      defaultStage: form.defaultStage,
      estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
      estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : undefined,
      teamSize: form.teamSize ? Number(form.teamSize) : undefined,
      checklist: form.checklist.length > 0 ? form.checklist : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {template ? 'Редактировать шаблон' : 'Создать шаблон'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6 px-6 py-6">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Название шаблона *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="НИР, Модернизация оборудования..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Краткое описание шаблона..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Default Stage */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Стадия по умолчанию
            </label>
            <select
              value={form.defaultStage}
              onChange={(e) => updateForm('defaultStage', e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          {/* Parameters Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Budget */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Примерный бюджет, ₽
              </label>
              <input
                type="number"
                value={form.estimatedBudget}
                onChange={(e) => updateForm('estimatedBudget', e.target.value)}
                placeholder="1000000"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Длительность, дней
              </label>
              <input
                type="number"
                value={form.estimatedDays}
                onChange={(e) => updateForm('estimatedDays', e.target.value)}
                placeholder="180"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Team Size */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Размер команды
              </label>
              <input
                type="number"
                value={form.teamSize}
                onChange={(e) => updateForm('teamSize', e.target.value)}
                placeholder="5"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Список задач
            </label>

            {/* Add Item */}
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Новый пункт списка..."
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={addChecklistItem}
                className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Добавить
              </button>
            </div>

            {/* Items List */}
            {form.checklist.length > 0 && (
              <ul className="space-y-2">
                {form.checklist.map((item, index) => (
                  <li
                    key={index}
                    className="group flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50"
                  >
                    <span className="text-green-500">✓</span>
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{item}</span>
                    <button
                      onClick={() => removeChecklistItem(index)}
                      className="rounded-lg p-1 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-900/20"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !form.name.trim()}
            className="rounded-xl bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSaving ? 'Сохраняем...' : template ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}
