import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { financialApi } from '../../lib/financialApi';
import { NPVInput } from '../../types/financial.types';

import { CashFlowInput } from './CashFlowInput';
import { NumberInput } from './NumberInput';

export const NPVCalculator: React.FC = () => {
  const [investment, setInvestment] = useState<number>(1000000);
  const [cashFlows, setCashFlows] = useState<number[]>([300000, 400000, 500000, 600000]);
  const [discountRate, setDiscountRate] = useState<number>(0.1);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const input: NPVInput = {
        investment,
        cash_flows: cashFlows,
        discount_rate: discountRate,
      };

      const response = await financialApi.calculateNPV(input);
      setResult(response.npv);
      toast.success('Расчёт NPV выполнен успешно!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при расчете NPV';
      setError(errorMessage);
      toast.error(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setInvestment(1000000);
    setCashFlows([300000, 400000, 500000, 600000]);
    setDiscountRate(0.1);
    setResult(null);
    setError(null);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      data-testid="npv-calculator"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Калькулятор NPV (Чистая приведенная стоимость)
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

        <CashFlowInput
          cashFlows={cashFlows}
          onChange={setCashFlows}
          maxYears={10}
          dataTestId="cash-flow-input"
        />

        <NumberInput
          label="Ставка дисконтирования (0-1)"
          value={discountRate}
          onChange={setDiscountRate}
          min={0}
          max={1}
          step={0.01}
          required
          dataTestId="discount-rate-input"
        />

        <div className="flex space-x-4">
          <button
            onClick={() => void handleCalculate()}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="calculate-button"
          >
            {loading ? 'Расчет...' : 'Рассчитать NPV'}
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
              Результат расчета NPV
            </h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                {result.toLocaleString('ru-RU')}
              </span>
              <span className="ml-2 text-green-700 dark:text-green-300">руб</span>
            </div>
            <p className="mt-2 text-green-600 dark:text-green-400">
              {result > 0 ? (
                <>Проект прибыльный (NPV больше 0). Рекомендуется к реализации.</>
              ) : result < 0 ? (
                <>Проект убыточный (NPV меньше 0). Не рекомендуется к реализации.</>
              ) : (
                <>Проект безубыточный (NPV = 0). Решение зависит от других факторов.</>
              )}
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Что такое NPV?</h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Чистая приведенная стоимость (NPV) — это разница между приведенной стоимостью денежных
            поступлений и приведенной стоимостью денежных выплат за определенный период времени.
            Положительное значение NPV указывает на то, что проект прибыльный.
          </p>
        </div>
      </div>
    </div>
  );
};
