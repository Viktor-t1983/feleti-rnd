import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Market {
  id: string;
  code: string;
  name: string;
  region: string;
  industry?: string;
  population?: number | null;
  meatConsumptionKgPerCapita?: number | null;
  companiesCount?: number | null;
  productionVolumeTons?: number | null;
  exportVolumeTons?: number | null;
  importVolumeTons?: number | null;
  dataSource?: string;
  dataYear?: number | null;
  priority: number;
  isActive: boolean;
  flagEmoji?: string;
}

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market?: Market | null;
  mode: 'create' | 'edit';
}

// Функция для отображения флага через CDN (Windows не поддерживает эмодзи флагов)
const getFlagImg = (code: string) => (
  <img
    src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
    width="24"
    height="18"
    alt={code}
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px' }}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

const REGIONS = [
  { value: 'EUROPE', label: 'Европа' },
  { value: 'ASIA', label: 'Азия' },
  { value: 'NORTH_AMERICA', label: 'Северная Америка' },
  { value: 'SOUTH_AMERICA', label: 'Южная Америка' },
  { value: 'AFRICA', label: 'Африка' },
  { value: 'AUSTRALIA', label: 'Океания' },
  { value: 'MIDDLE_EAST', label: 'Ближний Восток' },
];

const INDUSTRIES = [
  'Мясопереработка',
  'Птицепереработка',
  'Рыбопереработка',
  'Молочная промышленность',
  'Консервная промышленность',
  'Пищевая промышленность (общая)',
];

const PRIORITY_OPTIONS = [
  { value: 80, label: 'Работаем сейчас' },
  { value: 50, label: 'Планируем' },
  { value: 20, label: 'Мониторинг' },
];

interface FormData {
  code: string;
  name: string;
  region: string;
  industry: string;
  priority: number;
  companiesCount: string;
  productionVolumeTons: string;
  meatConsumptionKgPerCapita: string;
  population: string;
  exportVolumeTons: string;
  importVolumeTons: string;
  dataSource: string;
  dataYear: string;
  description: string;
  isActive: boolean;
}

export const MarketModal = ({ isOpen, onClose, market, mode }: MarketModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    region: 'EUROPE',
    industry: 'Мясопереработка',
    priority: 50,
    companiesCount: '',
    productionVolumeTons: '',
    meatConsumptionKgPerCapita: '',
    population: '',
    exportVolumeTons: '',
    importVolumeTons: '',
    dataSource: '',
    dataYear: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Получаем код для флага
  const flagCode = mode === 'edit' ? market?.code : formData.code;

  useEffect(() => {
    if (market && mode === 'edit') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        code: market.code,
        name: market.name,
        region: market.region,
        industry: market.industry || 'Мясопереработка',
        priority: market.priority,
        companiesCount: market.companiesCount?.toString() || '',
        productionVolumeTons: market.productionVolumeTons?.toString() || '',
        meatConsumptionKgPerCapita: market.meatConsumptionKgPerCapita?.toString() || '',
        population: market.population?.toString() || '',
        exportVolumeTons: market.exportVolumeTons?.toString() || '',
        importVolumeTons: market.importVolumeTons?.toString() || '',
        dataSource: market.dataSource || '',
        dataYear: market.dataYear?.toString() || '',
        description: '',
        isActive: market.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        region: 'EUROPE',
        industry: 'Мясопереработка',
        priority: 50,
        companiesCount: '',
        productionVolumeTons: '',
        meatConsumptionKgPerCapita: '',
        population: '',
        exportVolumeTons: '',
        importVolumeTons: '',
        dataSource: '',
        dataYear: '',
        description: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [market, mode, isOpen]);

  // Обновление флага при изменении кода
  useEffect(() => {
    if (formData.code && mode === 'create') {
      // Флаг будет автоматически установлен на бэкенде
    }
  }, [formData.code, mode]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/api/knowledge/markets', {
        code: data.code.toUpperCase(),
        name: data.name,
        region: data.region,
        industry: data.industry,
        priority: data.priority,
        companiesCount: data.companiesCount ? parseInt(data.companiesCount) : undefined,
        productionVolumeTons: data.productionVolumeTons
          ? parseFloat(data.productionVolumeTons)
          : undefined,
        meatConsumptionKgPerCapita: data.meatConsumptionKgPerCapita
          ? parseFloat(data.meatConsumptionKgPerCapita)
          : undefined,
        population: data.population ? parseInt(data.population) : undefined,
        exportVolumeTons: data.exportVolumeTons ? parseFloat(data.exportVolumeTons) : undefined,
        importVolumeTons: data.importVolumeTons ? parseFloat(data.importVolumeTons) : undefined,
        dataSource: data.dataSource || undefined,
        dataYear: data.dataYear ? parseInt(data.dataYear) : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'summary'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { id: string }) => {
      const response = await api.patch(`/api/knowledge/markets/${data.id}`, {
        name: data.name,
        region: data.region,
        industry: data.industry,
        priority: data.priority,
        companiesCount: data.companiesCount ? parseInt(data.companiesCount) : undefined,
        productionVolumeTons: data.productionVolumeTons
          ? parseFloat(data.productionVolumeTons)
          : undefined,
        meatConsumptionKgPerCapita: data.meatConsumptionKgPerCapita
          ? parseFloat(data.meatConsumptionKgPerCapita)
          : undefined,
        population: data.population ? parseInt(data.population) : undefined,
        exportVolumeTons: data.exportVolumeTons ? parseFloat(data.exportVolumeTons) : undefined,
        importVolumeTons: data.importVolumeTons ? parseFloat(data.importVolumeTons) : undefined,
        dataSource: data.dataSource || undefined,
        dataYear: data.dataYear ? parseInt(data.dataYear) : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'summary'] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors['code'] = 'Код обязателен';
    if (!formData.name.trim()) newErrors['name'] = 'Название обязательно';
    if (!formData.region) newErrors['region'] = 'Регион обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (market) {
      updateMutation.mutate({ ...formData, id: market.id });
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Добавить рынок' : 'Редактировать рынок'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-4">
            {/* Строка 1: Страна, Код, Флаг */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Страна <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass('name')}
                placeholder="Беларусь"
              />
              {errors['name'] && <p className="text-xs text-red-500">{errors['name']}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Код <span className="text-red-500">*</span>{' '}
                {flagCode && <span className="ml-1">{getFlagImg(flagCode)}</span>}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={mode === 'edit'}
                className={inputClass('code')}
                placeholder="BY"
              />
              {errors['code'] && <p className="text-xs text-red-500">{errors['code']}</p>}
            </div>

            {/* Строка 2: Регион, Отрасль */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Регион
              </label>
              <select
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className={inputClass('region')}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Отрасль
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className={inputClass('industry')}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Статус
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                className={inputClass('priority')}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Строка 4: Предприятий, Объём производства */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Предприятий
              </label>
              <input
                type="number"
                value={formData.companiesCount}
                onChange={(e) => handleChange('companiesCount', e.target.value)}
                className={inputClass('companiesCount')}
                placeholder="420"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Объём произв., т/год
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.productionVolumeTons}
                onChange={(e) => handleChange('productionVolumeTons', e.target.value)}
                className={inputClass('productionVolumeTons')}
                placeholder="580000"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Потребление, кг/чел/год
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.meatConsumptionKgPerCapita}
                onChange={(e) => handleChange('meatConsumptionKgPerCapita', e.target.value)}
                className={inputClass('meatConsumptionKgPerCapita')}
                placeholder="87.5"
              />
            </div>

            {/* Строка 5: Население */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Население
              </label>
              <input
                type="number"
                value={formData.population}
                onChange={(e) => handleChange('population', e.target.value)}
                className={inputClass('population')}
                placeholder="9400000"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Экспорт, т/год
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.exportVolumeTons}
                onChange={(e) => handleChange('exportVolumeTons', e.target.value)}
                className={inputClass('exportVolumeTons')}
                placeholder="150000"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Импорт, т/год
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.importVolumeTons}
                onChange={(e) => handleChange('importVolumeTons', e.target.value)}
                className={inputClass('importVolumeTons')}
                placeholder="50000"
              />
            </div>

            {/* Строка 7: Источник данных, Год */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Источник данных
              </label>
              <input
                type="text"
                value={formData.dataSource}
                onChange={(e) => handleChange('dataSource', e.target.value)}
                className={inputClass('dataSource')}
                placeholder="belstat.gov.by"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Год данных
              </label>
              <input
                type="number"
                value={formData.dataYear}
                onChange={(e) => handleChange('dataYear', e.target.value)}
                className={inputClass('dataYear')}
                placeholder="2023"
              />
            </div>

            {/* Строка 8: Описание */}
            <div className="col-span-3 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className={inputClass('description')}
                placeholder="Дополнительная информация о рынке..."
              />
            </div>

            {/* Активно */}
            <div className="col-span-3 flex items-center space-x-2">
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
                Активен
              </label>
            </div>
          </div>

          {(createMutation.error || updateMutation.error) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Произошла ошибка'}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : mode === 'create' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
