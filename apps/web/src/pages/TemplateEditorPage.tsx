/**
 * Template Editor Page
 * Редактор шаблонов уставов для администраторов
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { api } from '@/lib/api';

// Types
interface EquipmentType {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface TemplateBlock {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  blockType: string;
  isRequired: boolean;
  sortOrder: number;
  aiEnabled: boolean;
  aiPrompt: string | null;
  aiModel: string;
}

const BLOCK_TYPE_OPTIONS = [
  { value: 'TEXT', label: 'Текстовый блок' },
  { value: 'PARAMS_TABLE', label: 'Таблица параметров' },
  { value: 'RISK_LIST', label: 'Список рисков' },
  { value: 'COMPETITORS', label: 'Анализ конкурентов' },
  { value: 'DECOMPOSITION', label: 'Декомпозиция подсистем' },
  { value: 'GATE_REVIEW', label: 'Ворота решений GO/NO-GO' },
];

// API functions
const fetchEquipmentTypes = async (): Promise<EquipmentType[]> => {
  const { data } = await api.get('/knowledge/equipment?limit=100');
  return data.items;
};

const fetchTemplateBlocks = async (equipmentTypeId: string): Promise<TemplateBlock[]> => {
  const { data } = await api.get(`/charter/templates/${equipmentTypeId}/blocks`);
  return data.data;
};

const createTemplateBlock = async (equipmentTypeId: string, block: Partial<TemplateBlock>) => {
  const { data } = await api.post(`/charter/templates/${equipmentTypeId}/blocks`, block);
  return data.data;
};

const updateTemplateBlock = async (id: string, block: Partial<TemplateBlock>) => {
  const { data } = await api.put(`/charter/template-blocks/${id}`, block);
  return data.data;
};

const deleteTemplateBlock = async (id: string) => {
  await api.delete(`/charter/template-blocks/${id}`);
};

export function TemplateEditorPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [editingBlock, setEditingBlock] = useState<TemplateBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<TemplateBlock>>({
    name: '',
    icon: '',
    description: '',
    blockType: 'TEXT',
    isRequired: true,
    aiEnabled: true,
    aiPrompt: '',
    aiModel: 'deepseek',
  });

  // Queries
  const { data: equipmentTypes, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: fetchEquipmentTypes,
  });

  const { data: blocks, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['template-blocks', selectedEquipmentId],
    queryFn: () => fetchTemplateBlocks(selectedEquipmentId),
    enabled: !!selectedEquipmentId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (block: Partial<TemplateBlock>) => createTemplateBlock(selectedEquipmentId, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-blocks', selectedEquipmentId] });
      toast.success('Блок создан');
      resetForm();
    },
    onError: () => toast.error('Ошибка создания блока'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, block }: { id: string; block: Partial<TemplateBlock> }) =>
      updateTemplateBlock(id, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-blocks', selectedEquipmentId] });
      toast.success('Блок обновлён');
      resetForm();
    },
    onError: () => toast.error('Ошибка обновления блока'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplateBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-blocks', selectedEquipmentId] });
      toast.success('Блок удалён');
    },
    onError: () => toast.error('Ошибка удаления блока'),
  });

  const resetForm = () => {
    setEditingBlock(null);
    setIsCreating(false);
    setFormData({
      name: '',
      icon: '',
      description: '',
      blockType: 'TEXT',
      isRequired: true,
      aiEnabled: true,
      aiPrompt: '',
      aiModel: 'deepseek',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, block: formData });
    } else {
      createMutation.mutate({ ...formData, sortOrder: blocks?.length || 0 });
    }
  };

  const handleEdit = (block: TemplateBlock) => {
    setEditingBlock(block);
    setIsCreating(true);
    setFormData({
      name: block.name,
      icon: block.icon,
      description: block.description || '',
      blockType: block.blockType,
      isRequired: block.isRequired,
      aiEnabled: block.aiEnabled,
      aiPrompt: block.aiPrompt || '',
      aiModel: block.aiModel,
    });
  };

  const getBlockTypeLabel = (type: string) => {
    return BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📝 Редактор шаблонов уставов
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Создавайте и редактируйте шаблоны блоков для различных типов оборудования
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Equipment types */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Типы оборудования
                </h2>
              </div>
              <div className="p-2 max-h-[600px] overflow-y-auto">
                {isLoadingEquipment ? (
                  <div className="p-4 text-center text-gray-500">Загрузка...</div>
                ) : (
                  equipmentTypes?.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        resetForm();
                      }}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedEquipmentId === eq.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{eq.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{eq.code}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right side - Blocks list or Form */}
          <div className="lg:col-span-2">
            {!selectedEquipmentId ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Выберите тип оборудования слева для редактирования шаблона
                </p>
              </div>
            ) : isCreating ? (
              /* Form */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingBlock ? 'Редактировать блок' : 'Новый блок'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Название блока *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Иконка (emoji)
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="⚙️"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Тип блока *
                      </label>
                      <select
                        value={formData.blockType}
                        onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {BLOCK_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Описание (подсказка для инженера)
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Обязательный</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.aiEnabled}
                        onChange={(e) => setFormData({ ...formData, aiEnabled: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">AI-ассистент</span>
                    </label>
                  </div>

                  {formData.aiEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          AI Модель
                        </label>
                        <select
                          value={formData.aiModel}
                          onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="deepseek">DeepSeek</option>
                          <option value="claude">Claude</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          AI Промпт (инструкция для ассистента)
                        </label>
                        <textarea
                          value={formData.aiPrompt || ''}
                          onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="Ты эксперт по... Спроси про... Флагуй если..."
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingBlock ? 'Сохранить' : 'Создать'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Blocks list */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Блоки шаблона ({blocks?.length || 0})
                  </h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Добавить блок
                  </button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoadingBlocks ? (
                    <div className="p-8 text-center text-gray-500">Загрузка...</div>
                  ) : blocks?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Нет блоков. Нажмите "Добавить блок" чтобы создать.
                    </div>
                  ) : (
                    blocks?.map((block, index) => (
                      <div
                        key={block.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-4"
                      >
                        <div className="text-2xl">{block.icon || '📄'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {index + 1}. {block.name}
                            </span>
                            {block.isRequired && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                                Обязательный
                              </span>
                            )}
                            {block.aiEnabled && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {getBlockTypeLabel(block.blockType)}
                          </div>
                          {block.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {block.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(block)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Удалить этот блок?')) {
                                deleteMutation.mutate(block.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
