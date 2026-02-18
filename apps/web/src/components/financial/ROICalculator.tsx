import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { financialApi } from '../../lib/financialApi';
import { ROIInput } from '../../types/financial.types';

import { NumberInput } from './NumberInput';

export const ROICalculator: React.FC = () => {
  const [investment, setInvestment] = useState<number>(1000000);
  const [total_return, setTotalReturn] = useState<number>(1500000);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const input: ROIInput = {
        investment,
        total_return,
      };

      const response = await financialApi.calculateROI(input);
      setResult(response.roi_percent);
      toast.success('Расчёт ROI выполнен успешно!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при расчете ROI';
      setError(errorMessage);
      toast.error(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setInvestment(1000000);
    setTotalReturn(1500000);
    setResult(null);
    setError(null);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      data-testid="roi-calculator"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Калькулятор ROI (Рентабельность инвестиций)
      </h2>

      <div className="space-y-6">
        <NumberInput
          label="Начальные инвестиции (руб)"
          value={investment}
          onChange={setInvestment}
          min={0}
          step={1000}
          required
          dataTestId="investment-input"
        />

        <NumberInput
          label="Общая сумма возврата (руб)"
          value={total_return}
          onChange={setTotalReturn}
          min={0}
          step={1000}
          required
          dataTestId="returns-input"
        />

        <div className="flex space-x-4">
          <button
            onClick={() => void handleCalculate()}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="calculate-button"
          >
            {loading ? 'Расчет...' : 'Рассчитать ROI'}
          </button>

          <button
            onClick={handleReset}
            type="button"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            data-testid="reset-button"
          >
            Сбросить
          </button>
        </div>

        {error ? (
          <div
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            data-testid="error-message"
          >
            <p className="text-red-700 dark:text-red-300 font-medium">Ошибка:</p>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        {result !== null && (
          <div
            className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
            data-testid="result-container"
          >
            <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
              Результат расчета ROI
            </h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                {result.toFixed(2)}
              </span>
              <span className="ml-2 text-green-700 dark:text-green-300">%</span>
            </div>
            <p className="mt-2 text-green-600 dark:text-green-400">
              {result > 0 ? (
                <>Рентабельность инвестиций составляет {result.toFixed(2)}%. Проект прибыльный.</>
              ) : result < 0 ? (
                <>Рентабельность инвестиций составляет {result.toFixed(2)}%. Проект убыточный.</>
              ) : (
                <>Рентабельность инвестиций равна 0%. Проект безубыточный.</>
              )}
            </p>
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                <span className="font-medium">Чистая прибыль:</span>{' '}
                {(total_return - investment).toLocaleString('ru-RU')} руб
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Что такое ROI?</h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Рентабельность инвестиций (ROI) — это финансовый показатель, который измеряет
            эффективность инвестиций или сравнивает эффективность нескольких различных инвестиций.
            ROI рассчитывается как процентное отношение чистой прибыли к сумме инвестиций.
          </p>
          <p className="mt-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
            Формула: ROI = ((Возврат - Инвестиции) / Инвестиции) × 100%
          </p>
        </div>
      </div>
    </div>
  );
};
