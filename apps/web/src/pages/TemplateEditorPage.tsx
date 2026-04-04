/**
 * Template Editor Page
 * Редактор шаблонов уставов для администраторов
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { EquipmentTypeWizard } from '@/components/admin/EquipmentTypeWizard';
import { SortableBlock } from '@/components/admin/SortableBlock';

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

const deleteEquipmentType = async (id: string) => {
  await api.delete(`/api/admin/equipment-types/${id}`);
};

// API functions
const fetchEquipmentTypes = async (): Promise<EquipmentType[]> => {
  const { data } = await api.get('/api/admin/equipment-types');
  return data.data || [];
};

const fetchTemplateBlocks = async (equipmentTypeId: string): Promise<TemplateBlock[]> => {
  const { data } = await api.get(`/api/charter/templates/${equipmentTypeId}/blocks`);
  return data.data;
};

const createTemplateBlock = async (equipmentTypeId: string, block: Partial<TemplateBlock>) => {
  const { data } = await api.post(`/api/charter/templates/${equipmentTypeId}/blocks`, block);
  return data.data;
};

const updateTemplateBlock = async (id: string, block: Partial<TemplateBlock>) => {
  const { data } = await api.put(`/api/charter/template-blocks/${id}`, block);
  return data.data;
};

const deleteTemplateBlock = async (id: string) => {
  await api.delete(`/api/charter/template-blocks/${id}`);
};

export function TemplateEditorPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [editingBlock, setEditingBlock] = useState<TemplateBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<TemplateBlock>>({
    name: '',
    icon: '',
    description: '',
    blockType: 'TEXT',
    sortOrder: 0,
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

  // Reorder mutation - обновляет порядок всех блоков
  const reorderMutation = useMutation({
    mutationFn: async (reorderedBlocks: Array<{ id: string; sortOrder: number }>) => {
      // Обновляем каждый блок по порядку
      for (let i = 0; i < reorderedBlocks.length; i++) {
        const block = reorderedBlocks[i];
        if (block) {
          await updateTemplateBlock(block.id, { sortOrder: i });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-blocks', selectedEquipmentId] });
      toast.success('Порядок блоков обновлён');
    },
    onError: () => toast.error('Ошибка обновления порядка'),
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !blocks) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedBlocks = arrayMove(
        blocks.sort((a, b) => a.sortOrder - b.sortOrder),
        oldIndex,
        newIndex
      );

      // Обновляем порядок в БД
      reorderMutation.mutate(
        reorderedBlocks.map((b) => ({ id: b.id, sortOrder: 0 }))
      );
    }
  };

  const deleteEquipmentTypeMutation = useMutation({
    mutationFn: deleteEquipmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-types'] });
      setSelectedEquipmentId('');
      toast.success('Тип оборудования удалён');
    },
    onError: () => toast.error('Ошибка удаления типа оборудования'),
  });

  const resetForm = () => {
    setEditingBlock(null);
    setIsCreating(false);
    setFormData({
      name: '',
      icon: '',
      description: '',
      blockType: 'TEXT',
      sortOrder: 0,
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
      createMutation.mutate(formData);
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
      sortOrder: block.sortOrder,
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
        <PageHeader
          title="📝 Редактор шаблонов уставов"
          subtitle="Создавайте и редактируйте шаблоны блоков для различных типов оборудования"
          backTo="/admin"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Equipment types */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Типы оборудования
                </h2>
                <button
                  onClick={() => setIsCreatingType(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  + Новый тип
                </button>
              </div>
              <div className="p-2 max-h-[600px] overflow-y-auto">
                {isLoadingEquipment ? (
                  <div className="p-4 text-center text-gray-500">Загрузка...</div>
                ) : (
                  equipmentTypes?.map((eq) => (
                    <div
                      key={eq.id}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedEquipmentId === eq.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedEquipmentId(eq.id);
                          resetForm();
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{eq.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{eq.code}</div>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить тип оборудования "${eq.name}"? Это также удалит все связанные блоки.`)) {
                            deleteEquipmentTypeMutation.mutate(eq.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-lg ml-2 p-1"
                        title="Удалить тип оборудования"
                      >
                        🗑️
                      </button>
                    </div>
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Порядок
                      </label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                      />
                    </div>
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
                      Нет блоков. Нажмите &quot;Добавить блок&quot; чтобы создать.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={blocks?.map(b => b.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {blocks?.sort((a, b) => a.sortOrder - b.sortOrder).map((block, index) => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            index={index}
                            onEdit={handleEdit}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            getBlockTypeLabel={getBlockTypeLabel}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <EquipmentTypeWizard
          isOpen={isCreatingType}
          onClose={() => setIsCreatingType(false)}
          onSuccess={(id) => setSelectedEquipmentId(id)}
        />
      </div>
    </div>
  );
}
