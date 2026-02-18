import React from 'react';

import { NumberInput } from './NumberInput';

interface CashFlowInputProps {
  cashFlows: number[];
  onChange: (cashFlows: number[]) => void;
  maxYears?: number;
  dataTestId?: string;
}

export const CashFlowInput: React.FC<CashFlowInputProps> = ({
  cashFlows,
  onChange,
  maxYears = 10,
  dataTestId,
}) => {
  const handleAddYear = (): void => {
    if (cashFlows.length < maxYears) {
      onChange([...cashFlows, 0]);
    }
  };

  const handleRemoveYear = (index: number): void => {
    if (cashFlows.length > 1) {
      const newCashFlows = [...cashFlows];
      newCashFlows.splice(index, 1);
      onChange(newCashFlows);
    }
  };

  const handleCashFlowChange = (index: number, value: number): void => {
    const newCashFlows = [...cashFlows];
    newCashFlows[index] = value;
    onChange(newCashFlows);
  };

  return (
    <div className="mb-6" data-testid={dataTestId}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
        Денежные потоки по годам
      </h3>

      <div className="space-y-3">
        {cashFlows.map((cashFlow, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`cashflow-year-${index}`} className="flex items-center space-x-3">
            <div className="w-24">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Год {index + 1}
              </span>
            </div>
            <div className="flex-1">
              <NumberInput
                label=""
                value={cashFlow}
                onChange={(value) => handleCashFlowChange(index, value)}
                placeholder={`Введите денежный поток для года ${index + 1}`}
                dataTestId={`cash-flow-year-${index + 1}`}
              />
            </div>
            {cashFlows.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveYear(index)}
                className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                data-testid={`remove-year-${index + 1}`}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>

      {cashFlows.length < maxYears && (
        <button
          type="button"
          onClick={handleAddYear}
          className="mt-3 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium"
          data-testid="add-year-button"
        >
          + Добавить год
        </button>
      )}

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Всего лет: {cashFlows.length} (максимум {maxYears})
      </p>
    </div>
  );
};
