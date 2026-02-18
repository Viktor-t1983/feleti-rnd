import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api.config';

export const api = axios.create({
  baseURL: API_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Error:', error.response?.status, error.config?.url, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
