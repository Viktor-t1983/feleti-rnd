export interface NPVInput {
  investment: number;
  cash_flows: number[];
  discount_rate: number;
}

export interface NPVResult {
  npv: number;
}

export interface IRRInput {
  investment: number;
  cash_flows: number[];
}

export interface IRRResult {
  irr: number | null;
}

export interface ROIInput {
  investment: number;
  total_return: number;
}

export interface ROIResult {
  roi_percent: number;
}

export interface PaybackInput {
  investment: number;
  annual_cash_flow: number;
}

export interface PaybackResult {
  payback_years: number;
  payback_months: number;
  breakeven_year: number;
  decision: string;
}

export type CalculatorType = 'npv' | 'irr' | 'roi' | 'payback';
