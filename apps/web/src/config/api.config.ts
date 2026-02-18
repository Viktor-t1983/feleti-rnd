export const API_CONFIG = {
  apiUrl: import.meta.env['VITE_API_URL'] || '',
  calcEngineUrl: import.meta.env['VITE_CALC_ENGINE_URL'] || 'http://localhost:8000',
} as const;
