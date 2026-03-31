/**
 * Market Research Drawer
 * Панель анализа рынка под AI-чатом в блоке устава
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface MarketResearchResult {
  id: string;
  name: string;
  website?: string;
  country?: string;
  description?: string;
  priceRange?: string;
  source: string;
  sourceUrl: string;
  confidence: number;
}

interface MarketResearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentTypeName: string;
  defaultCountries?: string[];
}

interface SearchParams {
  productType: string;
  countries: string[];
  maxResults?: number;
}

const countryOptions = [
  { code: 'BY', label: 'Беларусь' },
  { code: 'RU', label: 'Россия' },
  { code: 'KZ', label: 'Казахстан' },
  { code: 'PL', label: 'Польша' },
  { code: 'DE', label: 'Германия' },
  { code: 'CN', label: 'Китай' },
  { code: 'TR', label: 'Турция' },
];

export function MarketResearchDrawer({
  isOpen,
  onClose: _onClose,
  equipmentTypeName,
  defaultCountries = ['BY', 'RU', 'KZ'],
}: MarketResearchDrawerProps) {
  void _onClose;
  const [productType, setProductType] = useState(equipmentTypeName);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(defaultCountries);
  const [results, setResults] = useState<MarketResearchResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      const { data } = await api.post('/api/market-research/search', params);
      return data.data as MarketResearchResult[];
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.length === 0) {
        toast('Производители не найдены. Попробуйте изменить запрос.', {
          icon: 'ℹ️',
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Ошибка поиска: ${error.message}`);
    },
  });

  const handleSearch = () => {
    if (!productType.trim()) {
      toast.error('Укажите тип продукта');
      return;
    }
    if (selectedCountries.length === 0) {
      toast.error('Выберите хотя бы одну страну');
      return;
    }

    searchMutation.mutate({
      productType: productType.trim(),
      countries: selectedCountries,
      maxResults: 10,
    });
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCompanyInfo = (result: MarketResearchResult) => {
    const parts = [result.name];
    if (result.country) parts.push(`(${result.country})`);
    if (result.website) parts.push(result.website);
    if (result.priceRange) parts.push(`Цена: ${result.priceRange}`);
    return parts.join(' | ');
  };

  if (!isOpen) return null;

  return (
    <div className="p-4 space-y-4">

      {/* Параметры поиска */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-4">
        {/* Тип продукта */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Тип продукта
          </label>
          <input
            type="text"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Например: Фаршмешалка 3т/час"
          />
        </div>

        {/* Страны */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Страны поиска
          </label>
          <div className="flex flex-wrap gap-2">
            {countryOptions.map((country) => (
              <button
                key={country.code}
                onClick={() => toggleCountry(country.code)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedCountries.includes(country.code)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка поиска */}
        <button
          onClick={handleSearch}
          disabled={searchMutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {searchMutation.isPending ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Поиск...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Начать поиск</span>
            </>
          )}
        </button>
      </div>

      {/* Результаты */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">
              Найдено производителей: {results.length}
            </h4>
            <span className="text-xs text-slate-500">
              Кликните 📋 чтобы скопировать
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🏭</span>
                      <span className="font-medium text-white truncate">
                        {result.name}
                      </span>
                      {result.country && (
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                          {result.country}
                        </span>
                      )}
                    </div>

                    {result.website && (
                      <a
                        href={result.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 truncate block mb-1"
                      >
                        {result.website}
                      </a>
                    )}

                    {result.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {result.description}
                      </p>
                    )}

                    {result.priceRange && (
                      <p className="text-sm text-green-400">
                        💰 {result.priceRange}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-1">
                      Источник: {result.source}
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(formatCompanyInfo(result), result.id)}
                    className={`p-2 rounded transition-colors ${
                      copiedId === result.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    title="Копировать информацию"
                  >
                    {copiedId === result.id ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Экспорт */}
          <button
            onClick={() => {
              const text = results.map(formatCompanyInfo).join('\n');
              copyToClipboard(text, 'all');
            }}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            📥 Копировать все результаты
          </button>
        </div>
      )}

      {/* Подсказка */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Совет: Скопируйте найденные компании и вставьте их в поле 
          &quot;Конкуренты&quot; или в AI-чат для анализа.
        </p>
      </div>
    </div>
  );
}
