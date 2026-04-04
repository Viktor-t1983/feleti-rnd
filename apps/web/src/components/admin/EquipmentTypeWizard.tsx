/**
 * EquipmentTypeWizard Component
 * AI-powered wizard for creating new equipment types with template blocks
 */

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api } from '@/lib/api';

interface WizardBlock {
  id: string;
  name: string;
  description: string;
  aiPrompt: string;
  blockType: string;
  sortOrder: number;
  isBase?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface EquipmentTypeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (equipmentTypeId: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'MECHANICAL', label: 'Механическое' },
  { value: 'THERMAL', label: 'Термическое' },
  { value: 'HYDRAULIC', label: 'Гидравлическое' },
  { value: 'ELECTRICAL', label: 'Электрическое' },
  { value: 'AUTOMATION', label: 'Автоматизация' },
  { value: 'PACKAGING', label: 'Упаковочное' },
  { value: 'TRANSPORT', label: 'Транспортное' },
  { value: 'OTHER', label: 'Прочее' },
];

const BASE_BLOCKS: WizardBlock[] = [
  {
    id: 'base-1',
    name: 'Продукт и ниша',
    description: 'Описание продукта и его позиционирование на рынке',
    aiPrompt: 'Ты эксперт по анализу продуктов и рыночной ниши. Опиши продукт, его основные характеристики, целевую аудиторию и конкурентные преимущества.',
    blockType: 'TEXT',
    sortOrder: 0,
    isBase: true,
  },
  {
    id: 'base-2',
    name: 'Рынок и конкуренты',
    description: 'Анализ рынка и конкурентной среды',
    aiPrompt: 'Ты эксперт по маркетингу и анализу рынка. Проведи анализ размера рынка, основных игроков, тенденций и барьеров входа.',
    blockType: 'COMPETITORS',
    sortOrder: 1,
    isBase: true,
  },
  {
    id: 'base-3',
    name: 'Ворота решений GO/NO-GO',
    description: 'Критерии принятия решения о продолжении проекта',
    aiPrompt: 'Ты эксперт по управлению проектами. Определи ключевые метрики и критерии для принятия решения GO/NO-GO на каждом этапе проекта.',
    blockType: 'GATE_REVIEW',
    sortOrder: 3,
    isBase: true,
  },
  {
    id: 'base-4',
    name: 'Финансовая модель',
    description: 'Экономика проекта и финансовые показатели',
    aiPrompt: 'Ты финансовый аналитик. Рассчитай инвестиции, операционные расходы, себестоимость, маржинальность и срок окупаемости проекта.',
    blockType: 'TEXT',
    sortOrder: 2,
    isBase: true,
  },
];

export function EquipmentTypeWizard({
  isOpen,
  onClose,
  onSuccess,
}: EquipmentTypeWizardProps): JSX.Element {
  const [equipmentName, setEquipmentName] = useState('');
  const [category, setCategory] = useState('MECHANICAL');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [blocks, setBlocks] = useState<WizardBlock[]>([...BASE_BLOCKS]);
  const [showBlocks, setShowBlocks] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post('/api/admin/equipment-wizard/chat', {
        equipmentName,
        category,
        message,
        history: messages,
        currentBlocks: blocks.filter(b => !b.isBase),
      });
      return data.data;
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Извините, произошла ошибка. Попробуйте ещё раз.' 
      }]);
      setInputMessage('');
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async () => {
      const timestamp = Date.now().toString(36);
      const code = equipmentName.toUpperCase().replace(/[^А-ЯA-Z0-9]/g, '_') + '_' + timestamp;
      
      const { data: equipmentType } = await api.post('/api/admin/equipment-types', {
        code,
        name: equipmentName,
        category,
        description: `Автоматически созданный тип оборудования: ${equipmentName}`,
      });
      
      const equipmentTypeId = equipmentType.data.id;
      
      for (const block of blocks) {
        await api.post(`/api/charter/templates/${equipmentTypeId}/blocks`, {
          name: block.name,
          description: block.description,
          aiPrompt: block.aiPrompt,
          blockType: block.blockType,
          isRequired: true,
          aiEnabled: true,
          aiModel: 'deepseek',
          icon: '📄',
          sortOrder: block.sortOrder,
        });
      }
      
      return equipmentTypeId;
    },
    onSuccess: (id) => {
      toast.success('Тип оборудования создан!');
      onSuccess(id);
      handleClose();
    },
    onError: () => toast.error('Ошибка создания типа оборудования'),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && equipmentName && category) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Привет! Я помогу создать шаблон устава для нового типа оборудования "${equipmentName}" (${CATEGORY_OPTIONS.find(c => c.value === category)?.label}).\n\nРасскажите подробнее — что делает это оборудование, из каких основных систем состоит и какие у него особенности?`,
      };
      setMessages([welcomeMessage]);
      setShowBlocks(false);
    }
  }, [isOpen, equipmentName, category]);

  const handleClose = () => {
    setEquipmentName('');
    setCategory('MECHANICAL');
    setMessages([]);
    setBlocks([...BASE_BLOCKS]);
    setInputMessage('');
    setShowBlocks(false);
    onClose();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !equipmentName || !category) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    chatMutation.mutate(inputMessage, {
      onSuccess: (response) => {
        if (response.reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
        }
        if (response.blocks) {
          const newBlocks = response.blocks.map((b: WizardBlock, idx: number) => ({
            ...b,
            id: `custom-${Date.now()}-${idx}`,
            sortOrder: BASE_BLOCKS.length + idx,
          }));
          setBlocks([...BASE_BLOCKS, ...newBlocks]);
          setShowBlocks(true);
        }
      },
    });
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleAddBlock = () => {
    if (!newBlockName.trim()) return;
    const newBlock: WizardBlock = {
      id: `custom-${Date.now()}`,
      name: newBlockName,
      description: 'Описание блока',
      aiPrompt: 'Ты эксперт по промышленному оборудованию. Опиши этот аспект подробно.',
      blockType: 'TEXT',
      sortOrder: blocks.length,
    };
    setBlocks(prev => [...prev, newBlock]);
    setNewBlockName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return <></>;

  const canStartChat = equipmentName.trim() && category;
  const canCreate = canStartChat && blocks.filter(b => !b.isBase).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🤖 AI-мастер создания типа оборудования
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left column - Chat */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Form fields */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название типа оборудования *
                </label>
                <input
                  type="text"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="Например: Ветрогенератор"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Категория *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-gray-500">
                    Печатает...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={canStartChat ? "Введите сообщение..." : "Сначала заполните название и категорию"}
                  disabled={!canStartChat || chatMutation.isPending}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canStartChat || !inputMessage.trim() || chatMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>

          {/* Right column - Blocks */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Предлагаемые блоки ({blocks.length})
              </h3>
              {showBlocks && (
                <p className="text-sm text-gray-500 mt-1">
                  AI предложил блоки на основе вашего описания
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Base blocks */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Базовые блоки (обязательные)
                </h4>
                <div className="space-y-2">
                  {blocks.filter(b => b.isBase).map((block) => (
                    <div
                      key={block.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {block.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                          Базовый
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {block.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom blocks */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Специфичные блоки
                </h4>
                {blocks.filter(b => !b.isBase).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Пока нет специфичных блоков. Расскажите AI о оборудовании, и он предложит блоки.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blocks.filter(b => !b.isBase).map((block) => (
                      <div
                        key={block.id}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {block.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {block.description}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add block */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <button
                onClick={handleAddBlock}
                disabled={!newBlockName.trim()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
              >
                ➕ Добавить свой блок
              </button>
              {newBlockName && (
                <input
                  type="text"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBlock()}
                  placeholder="Название нового блока..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}

              <button
                onClick={() => createEquipmentMutation.mutate()}
                disabled={!canCreate || createEquipmentMutation.isPending}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {createEquipmentMutation.isPending ? 'Создание...' : '✅ Создать тип оборудования'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
