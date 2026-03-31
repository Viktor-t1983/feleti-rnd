/**
 * Knowledge Base Page
 * База знаний: Каталог оборудования, Рынки, Конкуренты, Библиотека расчётов
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react';

import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { EquipmentModal } from '@/components/knowledge-base/EquipmentModal';
import { CompetitorModal } from '@/components/knowledge-base/CompetitorModal';
import { CompetitorDetailModal } from '@/components/knowledge-base/CompetitorDetailModal';

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
  flagEmoji?: string;
  region: string;
  population: number | null;
  gdpPerCapita: number | null;
  meatConsumptionKgPerCapita: number | null;
  industry?: string;
  companiesCount?: number | null;
  productionVolumeTons?: number | null;
  exportVolumeTons?: number | null;
  importVolumeTons?: number | null;
  dataYear?: number | null;
  isActive: boolean;
  priority: number;
  _count?: { competitors: number; equipment: number };
}

interface CompetitorItem {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  countryCode: string | null;
  annualRevenue: number | null;
  marketShare: number | null;
  priceSegment: string;
  isActive: boolean;
  threatLevel: string;
  strengths: string[];
  weaknesses: string[];
  productRange: string[];
  foundedYear: number | null;
  employeesCount: number | null;
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

interface MediaAttachment {
  id: string;
  sourceType: 'upload' | 'external_url' | 'file_link' | 'folder_link';
  mediaType: 'photo' | 'video' | 'document' | 'archive' | 'cad';
  category: string;
  title: string;
  description?: string;
  externalUrl?: string;
  linkProvider?: string;
  path?: string;
  fileSize?: number;
  originalName?: string;
  tags?: string[];
  validUntil?: string;
  dataYear?: number;
  uploadedBy?: { fullName: string };
  createdAt: string;
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
  page?: number;
  limit?: number;
}): Promise<{ items: EquipmentItem[]; total: number; page: number; limit: number }> => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit ?? 20));
  const { data } = await api.get(`/api/knowledge/equipment?${query.toString()}`);
  return data;
};

const fetchMarkets = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  region?: string;
}): Promise<{ items: MarketItem[]; total: number; page: number; limit: number }> => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit ?? 20));
  if (params?.region) query.set('region', params.region);
  const { data } = await api.get(`/api/knowledge/markets?${query.toString()}`);
  return data;
};

const fetchCompetitors = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  threatLevel?: string;
}): Promise<{ items: CompetitorItem[]; total: number; page: number; limit: number }> => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit ?? 20));
  if (params?.threatLevel) query.set('threatLevel', params.threatLevel);
  const { data } = await api.get(`/api/knowledge/competitors?${query.toString()}`);
  return data;
};

const fetchCalculations = async (): Promise<{ items: CalculationItem[]; total: number }> => {
  const { data } = await api.get('/api/knowledge/calculations');
  return data;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

// ═══ МЕТОДЫ ДЛЯ МЕДИА ═══

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url?.includes('youtube.com') || url?.includes('youtu.be');
};

const getProviderIcon = (provider?: string): string => {
  const icons: Record<string, string> = {
    youtube: '▶️',
    vimeo: '🎬',
    google_drive: '📁',
    yandex_disk: '☁️',
    sharepoint: '📋',
    onedrive: '💾',
    network_path: '🖥️',
    other: '🔗',
  };
  return icons[provider || 'other'] || '🔗';
};

const getMediaTypeIcon = (mediaType: string): string => {
  const icons: Record<string, string> = {
    photo: '🖼️',
    video: '🎥',
    document: '📄',
    archive: '📦',
    cad: '📐',
  };
  return icons[mediaType] || '📎';
};

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    passport: 'Паспорт изделия',
    manual: 'Инструкция',
    drawing: 'Чертёж',
    specification: 'Спецификация',
    certificate: 'Сертификат',
    commercial_offer: 'КП клиенту',
    video_demo: 'Демонстрация',
    photo: 'Фото',
    competitor_offer: 'КП конкурента',
    catalog: 'Каталог',
    price_list: 'Прайс-лист',
    report: 'Отчёт',
    statistics: 'Статистика',
    meeting_notes: 'Протокол',
    other: 'Другое',
  };
  return names[category] || category;
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

const isExpired = (validUntil?: string): boolean => {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
};

const isExpiringSoon = (validUntil?: string): boolean => {
  if (!validUntil) return false;
  const diff = new Date(validUntil).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
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

// ═══ MEDIA PANEL COMPONENT ═══

interface CategoryOption {
  value: string;
  label: string;
}

interface MediaPanelProps {
  entityType: string;
  entityId: string;
  onClose: () => void;
  categories?: CategoryOption[];
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: 'passport', label: 'Паспорт изделия' },
  { value: 'manual', label: 'Инструкция' },
  { value: 'drawing', label: 'Чертёж' },
  { value: 'specification', label: 'Спецификация' },
  { value: 'certificate', label: 'Сертификат' },
  { value: 'commercial_offer', label: 'КП клиенту' },
  { value: 'video_demo', label: 'Демонстрация' },
  { value: 'other', label: 'Другое' },
];

const MediaPanel: React.FC<MediaPanelProps> = ({ entityType, entityId, onClose, categories }) => {
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryView, setGalleryView] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [addType, setAddType] = useState<'upload' | 'link'>('link');
  const [linkForm, setLinkForm] = useState({
    externalUrl: '',
    sourceType: 'external_url' as 'external_url' | 'file_link' | 'folder_link',
    mediaType: 'document',
    title: '',
    category: 'other',
    dataYear: '',
    tags: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/knowledge/${entityType}/${entityId}/attachments`);
      setAttachments(data?.data || []);
    } catch (e) {
      console.error('Error loading attachments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  const handleAddLink = async () => {
    if (!linkForm.externalUrl || !linkForm.title) return;
    try {
      await api.post(`/api/knowledge/${entityType}/${entityId}/links`, {
        ...linkForm,
        dataYear: linkForm.dataYear ? parseInt(linkForm.dataYear) : undefined,
        tags: linkForm.tags ? linkForm.tags.split(',').map((t) => t.trim()) : [],
      });
      setShowAddModal(false);
      setLinkForm({
        externalUrl: '',
        sourceType: 'external_url',
        mediaType: 'document',
        title: '',
        category: 'other',
        dataYear: '',
        tags: '',
      });
      loadAttachments();
    } catch (e) {
      console.error(e);
      toast.error('Ошибка добавления ссылки');
    }
  };

  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('category', 'other');
    try {
      await api.post(`/api/knowledge/${entityType}/${entityId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowAddModal(false);
      loadAttachments();
      toast.success('Файл загружен');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка загрузки файла');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить этот файл/ссылку?')) return;
    try {
      await api.delete(`/api/knowledge/attachments/${id}`);
      loadAttachments();
      toast.success('Удалено');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка удаления');
    }
  };

  const openMedia = (att: MediaAttachment) => {
    if (att.sourceType === 'upload') {
      window.open(`/api/attachments/${att.id}/download`, '_blank');
    } else if (att.externalUrl) {
      if (att.linkProvider === 'network_path') {
        navigator.clipboard.writeText(att.externalUrl);
        toast.success('Путь скопирован в буфер обмена');
      } else if (att.linkProvider === 'youtube' && isYouTubeUrl(att.externalUrl)) {
        const embedUrl = getYouTubeEmbedUrl(att.externalUrl);
        if (embedUrl) {
          setVideoUrl(embedUrl);
          setShowVideoModal(true);
        } else {
          window.open(att.externalUrl, '_blank');
        }
      } else {
        window.open(att.externalUrl, '_blank');
      }
    }
  };

  const photos = attachments.filter((a) => a.mediaType === 'photo');
  const videos = attachments.filter((a) => a.mediaType === 'video');
  const documents = attachments.filter(
    (a) => a.mediaType === 'document' || a.mediaType === 'archive' || a.mediaType === 'cad'
  );

  return (
    <div className="bg-slate-900 border border-slate-700 border-t-0 p-4 rounded-b-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          {[
            { label: `Фото (${photos.length})`, count: photos.length },
            { label: `Видео (${videos.length})`, count: videos.length },
            { label: `Документы (${documents.length})`, count: documents.length },
          ].map((tab) => (
            <span
              key={tab.label}
              className={`text-xs font-semibold ${tab.count > 0 ? 'text-blue-400' : 'text-slate-500'}`}
            >
              {tab.label}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {photos.length > 0 && (
            <button
              onClick={() => setGalleryView(!galleryView)}
              className={`px-3 py-1.5 text-xs rounded ${galleryView ? 'bg-purple-700 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {galleryView ? '📋 Список' : '🖼️ Галерея'}
            </button>
          )}
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddType('link');
            }}
            className="px-3 py-1.5 text-xs bg-blue-700 text-white rounded hover:bg-blue-600"
          >
            + Ссылка
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddType('upload');
            }}
            className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-600"
          >
            + Файл
          </button>
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Gallery View for Photos */}
      {galleryView && photos.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {photos.map((att) => (
            <div
              key={att.id}
              onClick={() => {
                if (att.sourceType === 'upload') {
                  setSelectedPhoto(`/api/attachments/${att.id}/download`);
                } else if (att.externalUrl && att.linkProvider !== 'youtube') {
                  setSelectedPhoto(att.externalUrl);
                }
              }}
              className="aspect-square bg-slate-800 rounded-lg border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 relative group"
            >
              {att.sourceType === 'upload' ? (
                <img
                  src={`/api/attachments/${att.id}/download`}
                  alt={att.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50%" x="50%" text-anchor="middle" dy=".3em" fill="%236b7280">🖼️</text></svg>';
                  }}
                />
              ) : att.externalUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  {att.linkProvider === 'youtube' ? (
                    <span className="text-4xl">▶️</span>
                  ) : (
                    <span className="text-4xl">{getProviderIcon(att.linkProvider)}</span>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <span className="text-4xl">🖼️</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium px-2 text-center line-clamp-2">{att.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-red-400">✕</button>
          <img src={selectedPhoto} alt="Full size" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-slate-500 text-sm py-4">Загрузка...</div>
      ) : attachments.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-6">
          Медиафайлов нет. Нажмите &quot;+ Ссылка&quot; или &quot;+ Файл&quot; чтобы добавить.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map((att) => {
            const expired = isExpired(att.validUntil);
            const expiringSoon = isExpiringSoon(att.validUntil);
            return (
              <div
                key={att.id}
                className={`flex items-center gap-3 p-2 rounded ${expired ? 'bg-red-950/30 border border-red-900' : expiringSoon ? 'bg-amber-950/30 border border-amber-900' : 'bg-slate-800 border border-slate-700'}`}
              >
                <span className="text-lg">
                  {att.sourceType === 'upload'
                    ? getMediaTypeIcon(att.mediaType)
                    : getProviderIcon(att.linkProvider)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{att.title}</div>
                  <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                    <span>{getCategoryName(att.category)}</span>
                    {att.dataYear && <span>{att.dataYear} г.</span>}
                    {att.fileSize && <span>{formatFileSize(att.fileSize)}</span>}
                    {att.tags && att.tags.length > 0 && (
                      <span>{att.tags.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                </div>
                {expired && (
                  <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
                    Истёк
                  </span>
                )}
                {expiringSoon && !expired && (
                  <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">
                    Скоро истечёт
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {att.sourceType === 'upload'
                    ? 'Локально'
                    : att.sourceType === 'folder_link'
                      ? 'Папка'
                      : att.sourceType === 'file_link'
                        ? 'Файл'
                        : 'URL'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openMedia(att)}
                    className="px-2 py-1 text-xs border border-blue-700 text-blue-400 rounded hover:bg-blue-900/30"
                  >
                    {att.linkProvider === 'network_path' ? 'Копировать' : 'Открыть'}
                  </button>
                  <button
                    onClick={() => handleDelete(att.id)}
                    className="px-2 py-1 text-xs border border-red-800 text-red-400 rounded hover:bg-red-900/30"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-5 w-[520px] border border-slate-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {addType === 'link' ? 'Добавить ссылку' : 'Загрузить файл'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {addType === 'link' ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase block mb-1">
                    Тип источника
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'external_url', label: 'URL / YouTube' },
                      { value: 'file_link', label: 'Ссылка на файл' },
                      { value: 'folder_link', label: 'Ссылка на папку' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setLinkForm({
                            ...linkForm,
                            sourceType: opt.value as 'external_url' | 'file_link' | 'folder_link',
                          })
                        }
                        className={`py-2 text-xs rounded border ${linkForm.sourceType === opt.value ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 text-slate-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase block mb-1">
                    {linkForm.sourceType === 'folder_link' ? 'Путь к папке *' : 'URL / Путь *'}
                  </label>
                  <input
                    type="text"
                    value={linkForm.externalUrl}
                    onChange={(e) => setLinkForm({ ...linkForm, externalUrl: e.target.value })}
                    placeholder={
                      linkForm.sourceType === 'folder_link'
                        ? '\\\\server\\docs\\FM-3000\\'
                        : linkForm.sourceType === 'file_link'
                          ? 'http://nas.local/video.mp4'
                          : 'https://youtube.com/watch?v=...'
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase block mb-1">Название *</label>
                  <input
                    type="text"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    placeholder="Демонстрация работы FM-3000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">Тип</label>
                    <select
                      value={linkForm.mediaType}
                      onChange={(e) => setLinkForm({ ...linkForm, mediaType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="document">Документ</option>
                      <option value="video">Видео</option>
                      <option value="photo">Фото</option>
                      <option value="archive">Архив</option>
                      <option value="cad">Чертёж (CAD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">Категория</label>
                    <select
                      value={linkForm.category}
                      onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                    >
                      {(categories || DEFAULT_CATEGORIES).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">
                      Год данных
                    </label>
                    <input
                      type="number"
                      value={linkForm.dataYear}
                      onChange={(e) => setLinkForm({ ...linkForm, dataYear: e.target.value })}
                      placeholder="2024"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">
                      Теги (через запятую)
                    </label>
                    <input
                      type="text"
                      value={linkForm.tags}
                      onChange={(e) => setLinkForm({ ...linkForm, tags: e.target.value })}
                      placeholder="демо, FM-3000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddLink}
                    disabled={!linkForm.externalUrl || !linkForm.title}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    Прикрепить
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleUploadFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-10 text-center cursor-pointer hover:border-slate-400"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                  />
                  <div className="text-4xl mb-3">📎</div>
                  <div className="text-sm text-white mb-2">
                    Перетащите файл или нажмите для выбора
                  </div>
                  <div className="text-xs text-slate-500">
                    PDF, Word, Excel, фото, архивы, чертежи (до 50МБ)
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => {
                setShowVideoModal(false);
                setVideoUrl('');
              }}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-red-400"
            >
              ✕
            </button>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {videoUrl && (
                <iframe
                  src={videoUrl}
                  title="Video player"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// EQUIPMENT TAB
// ==========================================

const EquipmentTab = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'equipment', page, search, category],
    queryFn: () => fetchEquipment({ page, search, category, limit: LIMIT }),
    refetchOnMount: 'always',
    staleTime: 0,
    retry: 3,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Calculate pagination
  const totalPages = Math.ceil((data?.total || 0) / LIMIT);
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, data?.total || 0);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Всего: {data?.total || 0}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить оборудование
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px] max-w-[320px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
              placeholder="Поиск по названию или коду..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Все категории</option>
            <option value="MECHANICAL">Механическое</option>
            <option value="ELECTRICAL">Электрическое</option>
            <option value="THERMAL">Тепловое</option>
            <option value="HYDRAULIC">Гидравлическое</option>
            <option value="AUTOMATION">Автоматизация</option>
            <option value="OTHER">Прочее</option>
          </select>

          {/* Search Button */}
          <button
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Найти
          </button>

          {/* Clear filters */}
          {(search || category) && (
            <button
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setCategory('');
                setPage(1);
              }}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm"
            >
              Сбросить
            </button>
          )}
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
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.name}
                    </td>
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
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-sm ${
                            expandedId === item.id
                              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          }`}
                          title={expandedId === item.id ? 'Скрыть медиа' : 'Показать медиа'}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>Медиа</span>
                        </button>
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
                          title={
                            deleteConfirmId === item.id
                              ? 'Нажмите еще раз для подтверждения'
                              : 'Удалить'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <MediaPanel
                          entityType="equipment"
                          entityId={item.id}
                          onClose={() => setExpandedId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > LIMIT && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            {/* Info */}
            <div className="text-sm text-slate-400">
              Показано {startItem}-{endItem} из {data.total}
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
                title="Первая страница"
              >
                |«
              </button>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Назад
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded border text-sm min-w-[32px] ${
                    page === pageNum
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Вперёд
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
                title="Последняя страница"
              >
                »|
              </button>
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>На странице:</span>
              <span className="px-2 py-1 rounded border border-slate-700 text-slate-300">
                {LIMIT}
              </span>
            </div>
          </div>
        )}
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

// ==========================================
// MARKETS TAB
// ==========================================

import { MarketModal } from '@/components/knowledge-base/MarketModal';

interface MarketItem {
  id: string;
  code: string;
  name: string;
  flagEmoji?: string;
  region: string;
  industry?: string;
  companiesCount?: number | null;
  productionVolumeTons?: number | null;
  dataYear?: number | null;
}

// Функция для отображения флага через CDN (Windows не поддерживает эмодзи флагов)
const getFlagImg = (code: string) => (
  <img
    src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
    width="24"
    height="18"
    alt={code}
    style={{
      display: 'inline-block',
      marginRight: '8px',
      verticalAlign: 'middle',
      borderRadius: '2px',
    }}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

const getPriorityBadge = (priority: number) => {
  if (priority >= 70) {
    return {
      label: 'Работаем',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
  } else if (priority >= 40) {
    return {
      label: 'Планируем',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
  } else {
    return {
      label: 'Мониторинг',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
  }
};

const MarketsTab = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [region, setRegion] = useState('');
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'markets', page, search, region],
    queryFn: () => fetchMarkets({ page, search, region, limit: LIMIT }),
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'planned' | 'monitoring'>(
    'all'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setModalMode('create');
    setSelectedMarket(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MarketItem) => {
    setModalMode('edit');
    setSelectedMarket(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarket(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/knowledge/markets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'markets'] });
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

  // Client-side filtering by status (since backend doesn't support it directly)
  const filteredItems =
    data?.items
      ?.filter((item: MarketItem) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return item.priority >= 70;
        if (filterStatus === 'planned') return item.priority >= 40 && item.priority < 70;
        if (filterStatus === 'monitoring') return item.priority < 40;
        return true;
      })
      .sort((a: MarketItem, b: MarketItem) => b.priority - a.priority) || [];

  // Calculate pagination
  const totalPages = Math.ceil((data?.total || 0) / LIMIT);
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, data?.total || 0);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const hasData = filteredItems.length > 0;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Целевые рынки</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Всего: {data?.total || 0}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Фильтр по статусу */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="all">Все статусы</option>
                <option value="active">Работаем</option>
                <option value="planned">Планируем</option>
                <option value="monitoring">Мониторинг</option>
              </select>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить рынок
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput);
                    setPage(1);
                  }
                }}
                placeholder="Поиск по стране..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                🔍
              </span>
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg"
                >
                  ×
                </button>
              )}
            </div>

            {/* Region Filter */}
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Все регионы</option>
              <option value="EUROPE">Европа</option>
              <option value="ASIA">Азия</option>
              <option value="NORTH_AMERICA">Северная Америка</option>
              <option value="SOUTH_AMERICA">Южная Америка</option>
              <option value="AFRICA">Африка</option>
              <option value="MIDDLE_EAST">Ближний Восток</option>
            </select>

            {/* Search Button */}
            <button
              onClick={() => {
                setSearch(searchInput);
                setPage(1);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Найти
            </button>

            {/* Clear filters */}
            {(search || region) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setRegion('');
                  setPage(1);
                }}
                className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>

        {hasData ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Страна
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Отрасль
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Предприятий
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Объём произв., т
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Кг/чел/год
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Год
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item: MarketItem) => {
                  const badge = getPriorityBadge(item.priority);
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getFlagImg(item.code)}
                            {item.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.industry || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.companiesCount?.toLocaleString() || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.productionVolumeTons
                            ? `${(item.productionVolumeTons / 1000).toFixed(0)}K`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.meatConsumptionKgPerCapita || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.dataYear || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-sm ${
                                expandedId === item.id
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                              }`}
                              title={expandedId === item.id ? 'Скрыть медиа' : 'Показать медиа'}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Медиа</span>
                            </button>
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
                              title={deleteConfirmId === item.id ? 'Нажмите ещё раз' : 'Удалить'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <MediaPanel
                              entityType="market"
                              entityId={item.id}
                              onClose={() => setExpandedId(null)}
                              categories={[
                                { value: 'report', label: 'Отчёт по рынку' },
                                { value: 'statistics', label: 'Статистика' },
                                { value: 'distributor_contacts', label: 'Контакты дистрибьюторов' },
                                { value: 'meeting_notes', label: 'Протокол переговоров' },
                                { value: 'commercial_offer', label: 'КП конкурента на рынке' },
                                { value: 'other', label: 'Другое' },
                              ]}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-3xl">🌍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Рынков пока нет
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Добавьте первые целевые рынки для анализа
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить рынок
            </button>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > LIMIT && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            {/* Info */}
            <div className="text-sm text-slate-400">
              Показано {startItem}-{endItem} из {data.total}
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
                title="Первая страница"
              >
                |«
              </button>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Назад
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded border text-sm min-w-[32px] ${
                    page === pageNum
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Вперёд
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
                title="Последняя страница"
              >
                »|
              </button>
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>На странице:</span>
              <span className="px-2 py-1 rounded border border-slate-700 text-slate-300">
                {LIMIT}
              </span>
            </div>
          </div>
        )}
      </div>

      <MarketModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        market={selectedMarket}
        mode={modalMode}
      />
    </>
  );
};

// ==========================================
// COMPETITORS TAB
// ==========================================

const CompetitorsTab = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [threatLevel, setThreatLevel] = useState('');
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'competitors', page, search, threatLevel],
    queryFn: () => fetchCompetitors({ page, search, threatLevel, limit: LIMIT }),
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const [filterThreat, setFilterThreat] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCompetitorId, setDetailCompetitorId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/knowledge/competitors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'competitors'] });
      toast.success('Конкурент удалён');
    },
  });

  const handleAdd = () => {
    setModalMode('create');
    setSelectedCompetitor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CompetitorItem) => {
    setModalMode('edit');
    setSelectedCompetitor(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompetitor(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить конкурента?')) {
      deleteMutation.mutate(id);
    }
  };

  // Client-side filtering by threat level (if server filtering is not used)
  const filteredItems = data?.items
    ?.filter((item: CompetitorItem) => {
      if (filterThreat === 'all') return true;
      return item.threatLevel === filterThreat;
    })
    .sort((a: CompetitorItem, b: CompetitorItem) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        order[a.threatLevel as keyof typeof order] - order[b.threatLevel as keyof typeof order]
      );
    });

  // Calculate pagination
  const totalPages = Math.ceil((data?.total || 0) / LIMIT);
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, data?.total || 0);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  // Функция для отображения флага через CDN
  const getFlagImg = (code: string | null) => {
    if (!code) return null;
    return (
      <img
        src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
        width="24"
        height="18"
        alt={code}
        className="inline-block rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  const getPriceSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'low':
        return 'Эконом';
      case 'premium':
        return 'Премиум';
      default:
        return 'Средний';
    }
  };

  // Пустой список
  if (!filteredItems || filteredItems.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select
              value={filterThreat}
              onChange={(e) => setFilterThreat(e.target.value as typeof filterThreat)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Все уровни угрозы</option>
              <option value="high">Высокая</option>
              <option value="medium">Средняя</option>
              <option value="low">Низкая</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить конкурента
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Конкурентов пока нет
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Добавьте известных игроков рынка</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить конкурента
          </button>
        </div>

        <CompetitorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          competitor={selectedCompetitor}
          mode={modalMode}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-[220px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
              placeholder="Поиск конкурента..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filterThreat}
            onChange={(e) => setFilterThreat(e.target.value as typeof filterThreat)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">Все уровни угрозы</option>
            <option value="high">Высокая</option>
            <option value="medium">Средняя</option>
            <option value="low">Низкая</option>
          </select>

          <button
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Найти
          </button>

          {(search || threatLevel) && (
            <button
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setThreatLevel('');
                setPage(1);
              }}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm"
            >
              Сбросить
            </button>
          )}

          <span className="text-sm text-slate-400">Всего: {data?.total || 0}</span>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить конкурента
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item: CompetitorItem) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
          >
            {/* Заголовок карточки */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getFlagImg(item.countryCode)}
                <div>
                  <h3 
                    onClick={() => setDetailCompetitorId(item.id)}
                    className="font-semibold text-gray-900 dark:text-white text-lg cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </h3>
                  {item.country && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.country}</p>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getThreatLevelColor(item.threatLevel)}`}
              >
                {getThreatLevelLabel(item.threatLevel)}
              </span>
            </div>

            {/* Инфо строка */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {item.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {item.foundedYear && <span>С {item.foundedYear} г.</span>}
              {item.employeesCount && <span>{item.employeesCount} сотр.</span>}
            </div>

            {/* Сегмент */}
            <div className="mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Сегмент: </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {getPriceSegmentLabel(item.priceSegment)}
              </span>
            </div>

            {/* Сильные стороны */}
            {item.strengths && item.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Сильные стороны:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                  {item.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                  {item.strengths.length > 3 && (
                    <li className="text-gray-400">и ещё {item.strengths.length - 3}...</li>
                  )}
                </ul>
              </div>
            )}

            {/* Слабые стороны */}
            {item.weaknesses && item.weaknesses.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Слабые стороны:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                  {item.weaknesses.slice(0, 2).map((w, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500">−</span>
                      <span>{w}</span>
                    </li>
                  ))}
                  {item.weaknesses.length > 2 && (
                    <li className="text-gray-400">и ещё {item.weaknesses.length - 2}...</li>
                  )}
                </ul>
              </div>
            )}

            {/* Продукция */}
            {item.productRange && item.productRange.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Продукция:</span>{' '}
                  {item.productRange.slice(0, 4).join(', ')}
                  {item.productRange.length > 4 && ` и ещё ${item.productRange.length - 4}`}
                </p>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setDetailCompetitorId(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
              >
                Подробнее →
              </button>
              <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-sm ${
                  expandedId === item.id
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
                title={expandedId === item.id ? 'Скрыть медиа' : 'Показать медиа'}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Медиа</span>
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                title="Редактировать"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              </div>
            </div>
            {expandedId === item.id && (
              <MediaPanel
                entityType="competitor"
                entityId={item.id}
                onClose={() => setExpandedId(null)}
                categories={[
                  { value: 'competitor_offer', label: 'КП конкурента (с ценами)' },
                  { value: 'catalog', label: 'Каталог продукции' },
                  { value: 'price_list', label: 'Прайс-лист' },
                  { value: 'patent', label: 'Патент' },
                  { value: 'photo', label: 'Фото продукции' },
                  { value: 'video_demo', label: 'Видео демонстрация' },
                  { value: 'other', label: 'Другое' },
                ]}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.total > LIMIT && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Info */}
          <div className="text-sm text-slate-400">
            Показано {startItem}-{endItem} из {data.total}
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              title="Первая страница"
            >
              |«
            </button>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              Назад
            </button>

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded border text-sm min-w-[32px] ${
                  page === pageNum
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              Вперёд
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border border-slate-700 text-slate-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              title="Последняя страница"
            >
              »|
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>На странице:</span>
            <span className="px-2 py-1 rounded border border-slate-700 text-slate-300">
              {LIMIT}
            </span>
          </div>
        </div>
      )}

      <CompetitorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        competitor={selectedCompetitor}
        mode={modalMode}
      />

      {detailCompetitorId && (
        <CompetitorDetailModal
          competitorId={detailCompetitorId}
          onClose={() => setDetailCompetitorId(null)}
          onEdit={() => {
            const competitor = data?.items?.find((c: CompetitorItem) => c.id === detailCompetitorId);
            if (competitor) {
              setModalMode('edit');
              setSelectedCompetitor(competitor);
              setIsModalOpen(true);
            }
          }}
        />
      )}
    </>
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
