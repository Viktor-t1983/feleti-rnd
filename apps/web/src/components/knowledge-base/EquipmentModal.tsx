import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Equipment {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  category: string;
  description?: string;
  basePrice: number | null;
  currency: string;
  manufacturer?: string;
  leadTimeDays: number | null;
  isActive: boolean;
  isCustom: boolean;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  mode: 'create' | 'edit';
}

const categories = [
  { value: 'MECHANICAL', label: 'Механическое' },
  { value: 'ELECTRICAL', label: 'Электрическое' },
  { value: 'THERMAL', label: 'Тепловое' },
  { value: 'HYDRAULIC', label: 'Гидравлическое' },
  { value: 'AUTOMATION', label: 'Автоматизация' },
  { value: 'PACKAGING', label: 'Упаковочное' },
  { value: 'TRANSPORT', label: 'Транспортное' },
  { value: 'OTHER', label: 'Прочее' },
];

const currencies = [
  { value: 'RUB', label: 'RUB - Российский рубль' },
  { value: 'USD', label: 'USD - Доллар США' },
  { value: 'EUR', label: 'EUR - Евро' },
  { value: 'CNY', label: 'CNY - Китайский юань' },
];

interface FormData {
  code: string;
  name: string;
  shortName: string;
  category: string;
  manufacturer: string;
  basePrice: string;
  currency: string;
  leadTimeDays: string;
  isActive: boolean;
}

export const EquipmentModal = ({ isOpen, onClose, equipment, mode }: EquipmentModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    shortName: '',
    category: 'MECHANICAL',
    manufacturer: '',
    basePrice: '',
    currency: 'EUR',
    leadTimeDays: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment && mode === 'edit') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        code: equipment.code,
        name: equipment.name,
        shortName: equipment.shortName || '',
        category: equipment.category,
        manufacturer: equipment.manufacturer || '',
        basePrice: equipment.basePrice?.toString() || '',
        currency: equipment.currency || 'EUR',
        leadTimeDays: equipment.leadTimeDays?.toString() || '',
        isActive: equipment.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        shortName: '',
        category: 'MECHANICAL',
        manufacturer: '',
        basePrice: '',
        currency: 'EUR',
        leadTimeDays: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [equipment, mode, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/knowledge/equipment', {
        code: data.code,
        name: data.name,
        shortName: data.shortName || undefined,
        category: data.category,
        manufacturer: data.manufacturer || undefined,
        basePrice: data.basePrice ? parseFloat(data.basePrice) : undefined,
        currency: data.currency,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'summary'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { id: string }) => {
      const response = await api.patch(`/knowledge/equipment/${data.id}`, {
        name: data.name,
        shortName: data.shortName || undefined,
        category: data.category,
        manufacturer: data.manufacturer || undefined,
        basePrice: data.basePrice ? parseFloat(data.basePrice) : undefined,
        currency: data.currency,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'summary'] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors['code'] = 'Код обязателен';
    if (!formData.name.trim()) newErrors['name'] = 'Название обязательно';
    if (!formData.category) newErrors['category'] = 'Категория обязательна';
    if (formData.basePrice && isNaN(parseFloat(formData.basePrice))) {
      newErrors['basePrice'] = 'Введите корректную цену';
    }
    if (formData.leadTimeDays && isNaN(parseInt(formData.leadTimeDays))) {
      newErrors['leadTimeDays'] = 'Введите корректное количество дней';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (equipment) {
      updateMutation.mutate({ ...formData, id: equipment.id });
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Добавить оборудование' : 'Редактировать оборудование'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Код <span className="text-red-500">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={mode === 'edit'}
                className={inputClass('code')}
                placeholder="EQ-001"
              />
              {errors['code'] && <p className="text-xs text-red-500">{errors['code']}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Категория <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={inputClass('category')}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors['category'] && <p className="text-xs text-red-500">{errors['category']}</p>}
            </div>

            {/* Name */}
            <div className="col-span-2 space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Название <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass('name')}
                placeholder="Введите название оборудования"
              />
              {errors['name'] && <p className="text-xs text-red-500">{errors['name']}</p>}
            </div>

            {/* Short Name */}
            <div className="col-span-2 space-y-2">
              <label
                htmlFor="shortName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Короткое название
              </label>
              <input
                id="shortName"
                type="text"
                value={formData.shortName}
                onChange={(e) => handleChange('shortName', e.target.value)}
                className={inputClass('shortName')}
                placeholder="Краткое наименование"
              />
            </div>

            {/* Manufacturer */}
            <div className="col-span-2 space-y-2">
              <label
                htmlFor="manufacturer"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Производитель
              </label>
              <input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className={inputClass('manufacturer')}
                placeholder="Название производителя"
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <label
                htmlFor="basePrice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Базовая цена
              </label>
              <input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => handleChange('basePrice', e.target.value)}
                className={inputClass('basePrice')}
                placeholder="0.00"
              />
              {errors['basePrice'] && <p className="text-xs text-red-500">{errors['basePrice']}</p>}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Валюта
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={inputClass('currency')}
              >
                {currencies.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Time */}
            <div className="space-y-2">
              <label
                htmlFor="leadTimeDays"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Срок поставки (дней)
              </label>
              <input
                id="leadTimeDays"
                type="number"
                value={formData.leadTimeDays}
                onChange={(e) => handleChange('leadTimeDays', e.target.value)}
                className={inputClass('leadTimeDays')}
                placeholder="30"
              />
              {errors['leadTimeDays'] && (
                <p className="text-xs text-red-500">{errors['leadTimeDays']}</p>
              )}
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Активно
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error instanceof Error ? error.message : 'Произошла ошибка'}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Сохранение...' : mode === 'create' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
