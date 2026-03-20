/**
 * Knowledge Base Page
 * База знаний: Каталог оборудования, Рынки, Конкуренты, Библиотека расчётов
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { EquipmentModal } from '@/components/knowledge-base/EquipmentModal';

// ==========================================
// TYPES
// ==========================================

interface KnowledgeBaseSummary {
  equipment: {
    total: number;
    byCategory: Record<string, number>;
    active: number;
    custom: number;
  };
  markets: {
    total: number;
    byRegion: Record<string, number>;
    active: number;
  };
  competitors: {
    total: number;
    byThreatLevel: Record<string, number>;
    active: number;
  };
  calculationsLibrary: {
    total: number;
    byCategory: Record<string, number>;
    active: number;
  };
}

interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  category: string;
  basePrice: number | null;
  currency: string;
  isActive: boolean;
  isCustom: boolean;
  manufacturer: string;
  leadTimeDays: number | null;
}

interface MarketItem {
  id: string;
  code: string;
  name: string;
  region: string;
  population: number | null;
  gdpPerCapita: number | null;
  meatConsumptionKgPerCapita: number | null;
  isActive: boolean;
  priority: number;
  _count?: { competitors: number; equipment: number };
}

interface CompetitorItem {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  annualRevenue: number | null;
  marketShare: number | null;
  priceSegment: string;
  isActive: boolean;
  threatLevel: string;
  _count?: { markets: number; equipment: number };
}

interface CalculationItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
}

type TabType = 'overview' | 'equipment' | 'markets' | 'competitors' | 'calculations';

// ==========================================
// API FUNCTIONS
// ==========================================

const fetchSummary = async (): Promise<KnowledgeBaseSummary> => {
  const { data } = await api.get('/api/knowledge/summary');
  return data;
};

const fetchEquipment = async (params?: {
  category?: string;
  search?: string;
}): Promise<{ items: EquipmentItem[]; total: number }> => {
  const { data } = await api.get('/api/knowledge/equipment', { params });
  return data;
};

const fetchMarkets = async (): Promise<{ items: MarketItem[]; total: number }> => {
  const { data } = await api.get('/api/knowledge/markets');
  return data;
};

const fetchCompetitors = async (): Promise<{ items: CompetitorItem[]; total: number }> => {
  const { data } = await api.get('/api/knowledge/competitors');
  return data;
};

const fetchCalculations = async (): Promise<{ items: CalculationItem[]; total: number }> => {
  const { data } = await api.get('/api/knowledge/calculations');
  return data;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('ru-RU').format(num);
};

const formatCurrency = (num: number | null | undefined, currency: string): string => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(num);
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    THERMAL: 'Термическое',
    MECHANICAL: 'Механическое',
    HYDRAULIC: 'Гидравлическое',
    ELECTRICAL: 'Электрическое',
    AUTOMATION: 'Автоматизация',
    PACKAGING: 'Упаковочное',
    TRANSPORT: 'Транспортное',
    OTHER: 'Прочее',
  };
  return labels[category] || category;
};

const getRegionLabel = (region: string): string => {
  const labels: Record<string, string> = {
    EUROPE: 'Европа',
    NORTH_AMERICA: 'Северная Америка',
    SOUTH_AMERICA: 'Южная Америка',
    ASIA: 'Азия',
    AFRICA: 'Африка',
    AUSTRALIA: 'Австралия',
    MIDDLE_EAST: 'Ближний Восток',
  };
  return labels[region] || region;
};

const getThreatLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  };
  return labels[level] || level;
};

const getThreatLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
};

// ==========================================
// COMPONENTS
// ==========================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  color: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

// ==========================================
// OVERVIEW TAB
// ==========================================

const OverviewTab = ({ summary }: { summary: KnowledgeBaseSummary | undefined }) => {
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Оборудование"
          value={summary.equipment?.total ?? 0}
          subtitle={`${summary.equipment?.active ?? 0} активных`}
          icon="🔧"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Рынки"
          value={summary.markets?.total ?? 0}
          subtitle={`${summary.markets?.active ?? 0} активных`}
          icon="🌍"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Конкуренты"
          value={summary.competitors?.total ?? 0}
          subtitle={`${summary.competitors?.active ?? 0} активных`}
          icon="🏢"
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Расчёты"
          value={summary.calculationsLibrary?.total ?? 0}
          subtitle={`${summary.calculationsLibrary?.active ?? 0} активных`}
          icon="🧮"
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Оборудование по категориям
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.equipment?.byCategory ?? {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {getCategoryLabel(category)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${(count / (summary.equipment?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markets by Region */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Рынки по регионам
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.markets?.byRegion ?? {}).map(([region, count]) => (
              <div key={region} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{getRegionLabel(region)}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{
                        width: `${(count / (summary.markets?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitors by Threat Level */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Конкуренты по уровню угрозы
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.competitors?.byThreatLevel ?? {}).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {getThreatLevelLabel(level)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        level === 'high'
                          ? 'bg-red-600'
                          : level === 'medium'
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                      }`}
                      style={{
                        width: `${(count / (summary.competitors?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Расчёты по категориям
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.calculationsLibrary?.byCategory ?? {}).map(
              ([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {getCategoryLabel(category)}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{
                          width: `${(count / (summary.calculationsLibrary?.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {count}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EQUIPMENT TAB
// ==========================================



const EquipmentTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'equipment'],
    queryFn: () => fetchEquipment(),
    refetchOnMount: 'always',
    staleTime: 0,
    retry: 3,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    setModalMode('create');
    setSelectedEquipment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EquipmentItem) => {
    setModalMode('edit');
    setSelectedEquipment(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipment(null);
  };

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'summary'] });
      setDeleteConfirmId(null);
    },
  });

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Каталог оборудования
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {data?.total || 0}</span>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить оборудование
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Код
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Категория
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Цена
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Срок
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.items?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {item.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.basePrice, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {item.leadTimeDays ? `${item.leadTimeDays} дн.` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Активно
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Неактивно
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        className={`p-1.5 rounded-lg transition-colors ${
                          deleteConfirmId === item.id
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                            : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600'
                        }`}
                        title={deleteConfirmId === item.id ? 'Нажмите еще раз для подтверждения' : 'Удалить'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        equipment={selectedEquipment}
        mode={modalMode}
      />
    </>
  );
};

// ==========================================
// MARKETS TAB
// ==========================================

const MarketsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'markets'],
    queryFn: fetchMarkets,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Рынки сбыта</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {data?.total || 0}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Код
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Регион
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Население
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Конкуренты
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Оборудование
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data?.items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {getRegionLabel(item.region)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {formatNumber(item.population)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item._count?.competitors || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item._count?.equipment || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// COMPETITORS TAB
// ==========================================

const CompetitorsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'competitors'],
    queryFn: fetchCompetitors,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Конкуренты</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {data?.total || 0}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Сайт
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Сегмент
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Угроза
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Рынки
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Оборудование
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data?.items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item.website ? (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.priceSegment === 'low'
                      ? 'Эконом'
                      : item.priceSegment === 'premium'
                        ? 'Премиум'
                        : 'Средний'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getThreatLevelColor(item.threatLevel)}`}
                  >
                    {getThreatLevelLabel(item.threatLevel)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item._count?.markets || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item._count?.equipment || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// CALCULATIONS TAB
// ==========================================

const CalculationsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'calculations'],
    queryFn: fetchCalculations,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Библиотека расчётов</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Всего: {data?.total || 0}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Код
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Категория
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Описание
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Статус
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data?.items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {getCategoryLabel(item.category)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                  {item.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Активен
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Неактивен
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export function KnowledgeBasePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['knowledge', 'summary'],
    queryFn: fetchSummary,
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    toast.success('Данные обновлены');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="📚 База знаний"
          subtitle="Каталог оборудования, рынки сбыта, конкуренты и библиотека инженерных расчётов"
          actions={
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Обновить
            </button>
          }
        />

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 pb-2">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon="📊"
              label="Обзор"
            />
            <TabButton
              active={activeTab === 'equipment'}
              onClick={() => setActiveTab('equipment')}
              icon="🔧"
              label="Оборудование"
            />
            <TabButton
              active={activeTab === 'markets'}
              onClick={() => setActiveTab('markets')}
              icon="🌍"
              label="Рынки"
            />
            <TabButton
              active={activeTab === 'competitors'}
              onClick={() => setActiveTab('competitors')}
              icon="🏢"
              label="Конкуренты"
            />
            <TabButton
              active={activeTab === 'calculations'}
              onClick={() => setActiveTab('calculations')}
              icon="🧮"
              label="Расчёты"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab summary={summary} />}
          {activeTab === 'equipment' && <EquipmentTab />}
          {activeTab === 'markets' && <MarketsTab />}
          {activeTab === 'competitors' && <CompetitorsTab />}
          {activeTab === 'calculations' && <CalculationsTab />}
        </div>
      </main>
    </div>
  );
}
