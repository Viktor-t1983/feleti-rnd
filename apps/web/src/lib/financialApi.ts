import { API_CONFIG } from '../config/api.config';
import {
  IRRInput,
  IRRResult,
  NPVInput,
  NPVResult,
  PaybackInput,
  PaybackResult,
  ROIInput,
  ROIResult,
} from '../types/financial.types';

const API_BASE_URL = API_CONFIG.calcEngineUrl;

export const financialApi = {
  async calculateNPV(input: NPVInput): Promise<NPVResult> {
    const response = await fetch(`${API_BASE_URL}/api/financial/npv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`NPV calculation failed: ${response.statusText}`);
    }

    return response.json() as Promise<NPVResult>;
  },

  async calculateIRR(input: IRRInput): Promise<IRRResult> {
    const response = await fetch(`${API_BASE_URL}/api/financial/irr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`IRR calculation failed: ${response.statusText}`);
    }

    return response.json() as Promise<IRRResult>;
  },

  async calculateROI(input: ROIInput): Promise<ROIResult> {
    const response = await fetch(`${API_BASE_URL}/api/financial/roi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`ROI calculation failed: ${response.statusText}`);
    }

    return response.json() as Promise<ROIResult>;
  },

  async calculatePayback(input: PaybackInput): Promise<PaybackResult> {
    const response = await fetch(`${API_BASE_URL}/api/financial/payback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Payback calculation failed: ${response.statusText}`);
    }

    return response.json() as Promise<PaybackResult>;
  },
};
