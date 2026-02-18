import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { financialApi } from '../../lib/financialApi';
import { PaybackInput } from '../../types/financial.types';

import { NumberInput } from './NumberInput';

export const PaybackCalculator: React.FC = () => {
  const [investment, setInvestment] = useState<number>(1000000);
  const [annual_cash_flow, setAnnualCashFlow] = useState<number>(250000);
  const [result, setResult] = useState<{
    payback_years: number;
    payback_months: number;
    breakeven_year: number;
    decision: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const input: PaybackInput = {
        investment,
        annual_cash_flow,
      };

      const response = await financialApi.calculatePayback(input);
      setResult(response);
      toast.success('Расчёт срока окупаемости выполнен успешно!');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Произошла ошибка при расчете срока окупаемости';
      setError(errorMessage);
      toast.error(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setInvestment(1000000);
    setAnnualCashFlow(250000);
    setResult(null);
    setError(null);
  };

  const formatPaybackPeriod = (years: number, months: number): string => {
    if (years === -1) return 'Не окупается';

    const wholeYears = Math.floor(years);
    const remainingMonths = Math.round((years - wholeYears) * 12);

    if (wholeYears === 0) {
      return `${months} месяцев`;
    } else if (remainingMonths === 0) {
      return `${wholeYears} ${wholeYears === 1 ? 'год' : wholeYears < 5 ? 'года' : 'лет'}`;
    } else {
      return `${wholeYears} ${wholeYears === 1 ? 'год' : wholeYears < 5 ? 'года' : 'лет'} и ${remainingMonths} месяцев`;
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      data-testid="payback-calculator"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Калькулятор срока окупаемости (Payback Period)
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
          label="Годовой денежный поток (руб)"
          value={annual_cash_flow}
          onChange={setAnnualCashFlow}
          min={0}
          step={1000}
          required
          dataTestId="annual-cash-flow-input"
        />

        <div className="flex space-x-4">
          <button
            onClick={() => void handleCalculate()}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="calculate-button"
          >
            {loading ? 'Расчет...' : 'Рассчитать срок окупаемости'}
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
              Результат расчета срока окупаемости
            </h3>

            <div className="mb-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {result.payback_years.toFixed(2)}
                </span>
                <span className="ml-2 text-green-700 dark:text-green-300">лет</span>
              </div>
              <p className="mt-2 text-green-600 dark:text-green-400">
                <span className="font-medium">Срок окупаемости:</span>{' '}
                {formatPaybackPeriod(result.payback_years, result.payback_months)}
              </p>
            </div>

            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                {result.decision === 'ACCEPT' ? (
                  <>Проект имеет короткий срок окупаемости, что является положительным фактором.</>
                ) : result.decision === 'CAUTION' ? (
                  <>Проект имеет средний срок окупаемости. Требуется дополнительный анализ.</>
                ) : (
                  <>
                    Проект имеет длительный срок окупаемости. Рассмотрите альтернативные варианты.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Что такое срок окупаемости?
          </h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Срок окупаемости (Payback Period) — это период времени, необходимый для того, чтобы
            инвестиции окупились за счет чистых денежных потоков, генерируемых проектом. Это простой
            метод оценки инвестиционных проектов, который показывает, как быстро инвестор вернет
            свои вложения.
          </p>
        </div>
      </div>
    </div>
  );
};
