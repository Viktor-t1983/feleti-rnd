import { useState, useEffect } from 'react';
import { X, ExternalLink, Pencil, MapPin, Calendar, Users, TrendingUp, DollarSign, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CompetitorMarket {
  id: string;
  marketShare: number | null;
  entryYear: number | null;
  market: {
    id: string;
    name: string;
    code: string;
    flagEmoji?: string;
  };
}

interface CompetitorEquipment {
  id: string;
  name: string;
  modelNumber: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  equipmentType: {
    id: string;
    name: string;
  } | null;
}

interface CompetitorProjectLink {
  id: string;
  projectId: string;
  notes: string | null;
  project: {
    id: string;
    name: string;
    code: string;
  };
}

interface CompetitorDetail {
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
  markets: CompetitorMarket[];
  equipment: CompetitorEquipment[];
  projectLinks: CompetitorProjectLink[];
}

interface CompetitorDetailModalProps {
  competitorId: string;
  onClose: () => void;
  onEdit: () => void;
}

const getFlagImg = (code: string | null) => {
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/32x24/${code.toLowerCase()}.png`}
      width="32"
      height="24"
      alt={code}
      style={{ display: 'inline-block', borderRadius: '2px' }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
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

const getPriceSegmentLabel = (segment: string): string => {
  switch (segment) {
    case 'low':
      return 'Эконом';
    case 'premium':
      return 'Премиум';
    default:
      return 'Средний';
  }
};

export const CompetitorDetailModal = ({ competitorId, onClose, onEdit }: CompetitorDetailModalProps) => {
  const [competitor, setCompetitor] = useState<CompetitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitor = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/knowledge/competitors/${competitorId}`);
        setCompetitor(data);
      } catch (err) {
        console.error('Error fetching competitor:', err);
        setError('Не удалось загрузить данные конкурента');
      } finally {
        setLoading(false);
      }
    };

    if (competitorId) {
      fetchCompetitor();
    }
  }, [competitorId]);

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleRemoveProject = async (projectId: string) => {
    try {
      await api.delete(`/api/knowledge/competitors/${competitorId}/projects/${projectId}`);
      const { data } = await api.get(`/api/knowledge/competitors/${competitorId}`);
      setCompetitor(data);
    } catch (err) {
      console.error('Error removing project link:', err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !competitor) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md">
          <p className="text-red-600 text-center">{error || 'Конкурент не найден'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
          <div className="flex items-center gap-4">
            {getFlagImg(competitor.countryCode)}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {competitor.name}
              </h2>
              {competitor.legalName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {competitor.legalName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Row */}
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(competitor.threatLevel)}`}
            >
              Уровень угрозы: {getThreatLevelLabel(competitor.threatLevel)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Сегмент: {getPriceSegmentLabel(competitor.priceSegment)}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                competitor.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {competitor.isActive ? 'Активен' : 'Неактивен'}
            </span>
          </div>

          {/* Contacts Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Контакты
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {competitor.website && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <a
                    href={competitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {competitor.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {competitor.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">✉️</span>
                  <a
                    href={`mailto:${competitor.email}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {competitor.email}
                  </a>
                </div>
              )}
              {competitor.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📞</span>
                  <a href={`tel:${competitor.phone}`} className="text-blue-600 hover:underline text-sm">
                    {competitor.phone}
                  </a>
                </div>
              )}
              {competitor.address && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{competitor.address}</span>
                </div>
              )}
              {competitor.country && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🌍</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{competitor.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Info Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              О компании
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {competitor.foundedYear && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Год основания</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {competitor.foundedYear}
                    </p>
                  </div>
                </div>
              )}
              {competitor.employeesCount && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Сотрудников</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {competitor.employeesCount}
                    </p>
                  </div>
                </div>
              )}
              {competitor.annualRevenue && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Выручка (млн EUR)</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {competitor.annualRevenue}
                    </p>
                  </div>
                </div>
              )}
              {competitor.marketShare && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Доля рынка</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {competitor.marketShare}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strengths */}
          {competitor.strengths && competitor.strengths.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Сильные стороны
              </h3>
              <ul className="space-y-2">
                {competitor.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 text-lg">+</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {competitor.weaknesses && competitor.weaknesses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Слабые стороны
              </h3>
              <ul className="space-y-2">
                {competitor.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 text-lg">−</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Product Range */}
          {competitor.productRange && competitor.productRange.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Ассортимент продукции
              </h3>
              <div className="flex flex-wrap gap-2">
                {competitor.productRange.map((product, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Markets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Связанные рынки
            </h3>
            {competitor.markets && competitor.markets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {competitor.markets.map((cm) => (
                  <span
                    key={cm.id}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm flex items-center gap-1"
                  >
                    {cm.market.flagEmoji} {cm.market.name}
                    {cm.marketShare && ` (${cm.marketShare}%)`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Рынки не указаны</p>
            )}
          </div>

          {/* Related Equipment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Связанное оборудование
            </h3>
            {competitor.equipment && competitor.equipment.length > 0 ? (
              <div className="space-y-2">
                {competitor.equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {eq.name}
                        {eq.modelNumber && <span className="text-gray-500"> ({eq.modelNumber})</span>}
                      </p>
                      {eq.equipmentType && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Аналог: {eq.equipmentType.name}
                        </p>
                      )}
                    </div>
                    {eq.priceRangeMin && eq.priceRangeMax && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {eq.priceRangeMin} - {eq.priceRangeMax} EUR
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Оборудование не указано</p>
            )}
          </div>

          {/* Related Projects */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Связанные проекты
            </h3>
            {(!competitor.projectLinks || competitor.projectLinks.length === 0) ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Нет связанных проектов</p>
            ) : (
              <div className="space-y-2 mb-3">
                {competitor.projectLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {link.project.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {link.project.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.notes && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                          {link.notes}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveProject(link.projectId)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Удалить связь"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AddProjectToCompetitor 
              competitorId={competitorId} 
              onLinkAdded={() => {
                const fetchCompetitor = async () => {
                  const { data } = await api.get(`/api/knowledge/competitors/${competitorId}`);
                  setCompetitor(data);
                };
                fetchCompetitor();
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Закрыть
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Редактировать
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddProjectToCompetitorProps {
  competitorId: string;
  onLinkAdded: () => void;
}

const AddProjectToCompetitor = ({ competitorId, onLinkAdded }: AddProjectToCompetitorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data } = await api.get('/api/projects?limit=100');
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    await loadProjects();
  };

  const handleAdd = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      await api.post(`/api/knowledge/competitors/${competitorId}/projects`, {
        projectId: selectedProjectId,
      });
      setIsOpen(false);
      setSelectedProjectId('');
      onLinkAdded();
    } catch (err) {
      console.error('Error adding project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="mt-3 flex items-center gap-1 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-300 dark:border-purple-600"
      >
        <Plus className="w-4 h-4" />
        Добавить проект
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
      {loadingProjects ? (
        <p className="text-sm text-gray-500">Загрузка проектов...</p>
      ) : (
        <>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg dark:bg-gray-700 text-sm"
          >
            <option value="">Выберите проект...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={!selectedProjectId || loading}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Добавить'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </>
      )}
    </div>
  );
};
