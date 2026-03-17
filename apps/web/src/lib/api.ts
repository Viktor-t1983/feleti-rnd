import axios, { AxiosError } from 'axios';

import { API_CONFIG } from '../config/api.config';

// console.log('[API] Initializing with baseURL:', API_CONFIG.apiUrl || '(relative)');

export const api = axios.create({
  baseURL: API_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Interceptor для добавления token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    // console.log('[API] Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'present' : 'none');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor для обработки 401
api.interceptors.response.use(
  (response) => {
    // console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });

    if (error.code === 'ERR_NETWORK') {
      console.error('[API] Network error - check if API is accessible');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
