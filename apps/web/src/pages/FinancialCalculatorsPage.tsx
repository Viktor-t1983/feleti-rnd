import React, { useState } from 'react';

import { IRRCalculator } from '../components/financial/IRRCalculator';
import { NPVCalculator } from '../components/financial/NPVCalculator';
import { PaybackCalculator } from '../components/financial/PaybackCalculator';
import { ROICalculator } from '../components/financial/ROICalculator';
import { Header } from '../components/layout/Header';
import { ru } from '../i18n/ru';
import { CalculatorType } from '../types/financial.types';

const calculatorTabs: { id: CalculatorType; label: string; description: string }[] = [
  {
    id: 'npv',
    label: 'NPV',
    description: 'Чистая приведенная стоимость',
  },
  {
    id: 'irr',
    label: 'IRR',
    description: 'Внутренняя норма доходности',
  },
  {
    id: 'roi',
    label: 'ROI',
    description: 'Рентабельность инвестиций',
  },
  {
    id: 'payback',
    label: 'Payback',
    description: 'Срок окупаемости',
  },
];

export const FinancialCalculatorsPage: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('npv');

  const renderCalculator = (): JSX.Element => {
    switch (activeCalculator) {
      case 'npv':
        return <NPVCalculator />;
      case 'irr':
        return <IRRCalculator />;
      case 'roi':
        return <ROICalculator />;
      case 'payback':
        return <PaybackCalculator />;
      default:
        return <NPVCalculator />;
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="financial-calculators-page"
    >
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Финансовые калькуляторы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Инструменты для анализа инвестиционных проектов и финансовых решений
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Выберите калькулятор
              </h2>
              <nav className="space-y-2">
                {calculatorTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCalculator(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      activeCalculator === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tab.description}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-medium text-gray-800 mb-3">Как использовать</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Заполните все обязательные поля</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Нажмите &quot;Рассчитать&quot; для получения результата</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Используйте &quot;Сбросить&quot; для очистки формы</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Результаты сохраняются только в браузере</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">
                  {calculatorTabs.find((tab) => tab.id === activeCalculator)?.label}
                </h2>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {calculatorTabs.find((tab) => tab.id === activeCalculator)?.description}
                </span>
              </div>
              <p className="text-gray-600">
                {activeCalculator === 'npv' &&
                  'Рассчитайте чистую приведенную стоимость инвестиционного проекта.'}
                {activeCalculator === 'irr' && 'Определите внутреннюю норму доходности проекта.'}
                {activeCalculator === 'roi' && 'Оцените рентабельность инвестиций в процентах.'}
                {activeCalculator === 'payback' && 'Рассчитайте срок окупаемости инвестиций.'}
              </p>
            </div>

            {renderCalculator()}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-3">{ru.financial.apiEndpoints}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      POST /api/financial/npv
                    </code>
                    <span className="ml-2 text-gray-500">→ NPV расчет</span>
                  </div>
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      POST /api/financial/irr
                    </code>
                    <span className="ml-2 text-gray-500">→ IRR расчет</span>
                  </div>
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      POST /api/financial/roi
                    </code>
                    <span className="ml-2 text-gray-500">→ ROI расчет</span>
                  </div>
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      POST /api/financial/payback
                    </code>
                    <span className="ml-2 text-gray-500">→ Payback расчет</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-3">{ru.financial.technicalInfo}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Backend: Python FastAPI на порту 8000</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Frontend: React + TypeScript</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span>Тестирование: pytest + Playwright</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Все расчеты выполняются в реальном времени</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
