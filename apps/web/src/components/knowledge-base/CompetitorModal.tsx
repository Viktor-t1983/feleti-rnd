import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Competitor {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  countryCode: string | null;
  foundedYear: number | null;
  employeesCount: number | null;
  annualRevenue: number | null;
  marketShare: number | null;
  strengths: string[];
  weaknesses: string[];
  productRange: string[];
  priceSegment: string;
  threatLevel: string;
  isActive: boolean;
}

interface CompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitor?: Competitor | null;
  mode: 'create' | 'edit';
}

const PRICE_SEGMENTS = [
  { value: 'low', label: 'Эконом' },
  { value: 'mid', label: 'Средний' },
  { value: 'premium', label: 'Премиум' },
];

const THREAT_LEVELS = [
  { value: 'high', label: 'Высокая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'low', label: 'Низкая' },
];

// Функция для отображения флага через CDN
const getFlagImg = (code: string) => (
  <img
    src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
    width="24"
    height="18"
    alt={code}
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px' }}
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
  />
);

interface FormData {
  name: string;
  legalName: string;
  country: string;
  countryCode: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  foundedYear: string;
  employeesCount: string;
  annualRevenue: string;
  marketShare: string;
  priceSegment: string;
  threatLevel: string;
  strengths: string;
  weaknesses: string;
  productRange: string;
  isActive: boolean;
}

export const CompetitorModal = ({ isOpen, onClose, competitor, mode }: CompetitorModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    legalName: '',
    country: '',
    countryCode: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    foundedYear: '',
    employeesCount: '',
    annualRevenue: '',
    marketShare: '',
    priceSegment: 'mid',
    threatLevel: 'medium',
    strengths: '',
    weaknesses: '',
    productRange: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (competitor && mode === 'edit') {
      setFormData({
        name: competitor.name || '',
        legalName: competitor.legalName || '',
        country: competitor.country || '',
        countryCode: competitor.countryCode || '',
        website: competitor.website || '',
        email: competitor.email || '',
        phone: competitor.phone || '',
        address: competitor.address || '',
        foundedYear: competitor.foundedYear?.toString() || '',
        employeesCount: competitor.employeesCount?.toString() || '',
        annualRevenue: competitor.annualRevenue?.toString() || '',
        marketShare: competitor.marketShare?.toString() || '',
        priceSegment: competitor.priceSegment || 'mid',
        threatLevel: competitor.threatLevel || 'medium',
        strengths: (competitor.strengths || []).join('\n'),
        weaknesses: (competitor.weaknesses || []).join('\n'),
        productRange: (competitor.productRange || []).join('\n'),
        isActive: competitor.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        country: '',
        countryCode: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        foundedYear: '',
        employeesCount: '',
        annualRevenue: '',
        marketShare: '',
        priceSegment: 'mid',
        threatLevel: 'medium',
        strengths: '',
        weaknesses: '',
        productRange: '',
        isActive: true,
      });
    }
  }, [competitor, mode, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: unknown) => api.post('/api/knowledge/competitors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'competitors'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => api.patch(`/api/knowledge/competitors/${competitor?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'competitors'] });
      onClose();
    },
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors['name'] = 'Название обязательно';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: formData.name,
      legalName: formData.legalName || undefined,
      country: formData.country || undefined,
      countryCode: formData.countryCode || undefined,
      website: formData.website || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
      employeesCount: formData.employeesCount ? parseInt(formData.employeesCount) : undefined,
      annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined,
      marketShare: formData.marketShare ? parseFloat(formData.marketShare) : undefined,
      priceSegment: formData.priceSegment,
      threatLevel: formData.threatLevel,
      strengths: formData.strengths.split('\n').filter(s => s.trim()),
      weaknesses: formData.weaknesses.split('\n').filter(s => s.trim()),
      productRange: formData.productRange.split('\n').filter(s => s.trim()),
      isActive: formData.isActive,
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Добавить конкурента' : 'Редактировать конкурента'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Строка 1: Название и Юридическое название */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass('name')}
                placeholder="Nowicki"
              />
              {errors['name'] && <p className="text-xs text-red-500">{errors['name']}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Юридическое название
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                className={inputClass('legalName')}
                placeholder="Nowicki Sp. z o.o."
              />
            </div>

            {/* Строка 2: Страна, Код страны с флагом */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Страна
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={inputClass('country')}
                placeholder="Польша"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Код страны {formData.countryCode && getFlagImg(formData.countryCode)}
              </label>
              <input
                type="text"
                value={formData.countryCode}
                onChange={(e) => handleChange('countryCode', e.target.value.toUpperCase())}
                className={inputClass('countryCode')}
                placeholder="PL"
                maxLength={2}
              />
            </div>

            {/* Строка 3: Сайт и Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сайт
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className={inputClass('website')}
                placeholder="nowicki.com.pl"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass('email')}
                placeholder="info@nowicki.com.pl"
              />
            </div>

            {/* Строка 4: Телефон и Адрес */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Телефон
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass('phone')}
                placeholder="+48 ..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Адрес
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={inputClass('address')}
                placeholder="Warszawa, Poland"
              />
            </div>

            {/* Строка 5: Год основания, Сотрудники, Выручка */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Год основания
              </label>
              <input
                type="number"
                value={formData.foundedYear}
                onChange={(e) => handleChange('foundedYear', e.target.value)}
                className={inputClass('foundedYear')}
                placeholder="1952"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Сотрудников
                </label>
                <input
                  type="number"
                  value={formData.employeesCount}
                  onChange={(e) => handleChange('employeesCount', e.target.value)}
                  className={inputClass('employeesCount')}
                  placeholder="450"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выручка (млн EUR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.annualRevenue}
                  onChange={(e) => handleChange('annualRevenue', e.target.value)}
                  className={inputClass('annualRevenue')}
                  placeholder="50.5"
                />
              </div>
            </div>

            {/* Строка 6: Доля рынка, Ценовой сегмент, Уровень угрозы */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Доля рынка (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.marketShare}
                onChange={(e) => handleChange('marketShare', e.target.value)}
                className={inputClass('marketShare')}
                placeholder="15.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ценовой сегмент
                </label>
                <select
                  value={formData.priceSegment}
                  onChange={(e) => handleChange('priceSegment', e.target.value)}
                  className={inputClass('priceSegment')}
                >
                  {PRICE_SEGMENTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Уровень угрозы
                </label>
                <select
                  value={formData.threatLevel}
                  onChange={(e) => handleChange('threatLevel', e.target.value)}
                  className={inputClass('threatLevel')}
                >
                  {THREAT_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Строка 7: Сильные стороны */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сильные стороны (каждая с новой строки)
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) => handleChange('strengths', e.target.value)}
                className={inputClass('strengths')}
                rows={3}
                placeholder="Известный бренд в EU&#10;Линейка до 6000 кг&#10;Развитый сервис"
              />
            </div>

            {/* Строка 8: Слабые стороны */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Слабые стороны (каждая с новой строки)
              </label>
              <textarea
                value={formData.weaknesses}
                onChange={(e) => handleChange('weaknesses', e.target.value)}
                className={inputClass('weaknesses')}
                rows={3}
                placeholder="Высокая цена для СНГ&#10;Сроки поставки 12-16 недель"
              />
            </div>

            {/* Строка 9: Ассортимент продукции */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ассортимент продукции (каждая с новой строки)
              </label>
              <textarea
                value={formData.productRange}
                onChange={(e) => handleChange('productRange', e.target.value)}
                className={inputClass('productRange')}
                rows={3}
                placeholder="Вакуумные фаршмешалки&#10;Куттеры&#10;Инжекторы"
              />
            </div>

            {/* Чекбокс: Активный */}
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Активный конкурент
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : mode === 'create' ? 'Добавить' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
