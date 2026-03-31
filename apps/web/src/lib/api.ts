import axios, { AxiosError } from 'axios';

import { API_CONFIG } from '../config/api.config';

// console.log('[API] Initializing with baseURL:', API_CONFIG.apiUrl || '(relative)');

export const api = axios.create({
  baseURL: API_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300 seconds timeout for AI requests
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const REFRESH_BEFORE_EXPIRY = 30 * 60 * 1000; // 30 minutes before expiry
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute

function getTokenExpiry(): number | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    const tokenPart = parts[1];
    if (!tokenPart) return null;
    const payload = JSON.parse(atob(tokenPart));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

async function refreshToken(): Promise<void> {
  if (isRefreshing) {
    return refreshPromise!;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token');
      }
      
      const response = await axios.post(`${API_CONFIG.apiUrl}/api/auth/refresh`, {
        refreshToken: refreshTokenValue,
      });
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

async function checkAndRefreshToken(): Promise<void> {
  const expiry = getTokenExpiry();
  if (!expiry) return;
  
  const timeUntilExpiry = expiry - Date.now();
  
  // Refresh if expiring within 30 minutes
  if (timeUntilExpiry < REFRESH_BEFORE_EXPIRY && timeUntilExpiry > 0) {
    await refreshToken();
  }
}

// Check token periodically
setInterval(() => {
  if (localStorage.getItem('accessToken')) {
    checkAndRefreshToken();
  }
}, TOKEN_CHECK_INTERVAL);

// Track user activity
function updateActivity(): void {
  // Update activity timestamp - used for session tracking
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('lastActivity', Date.now().toString());
  }
}

// Add activity tracking to common events
if (typeof window !== 'undefined') {
  ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });
}

// Interceptor для добавления token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    // console.log('[API] Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'present' : 'none');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check and refresh before request
    checkAndRefreshToken();
    
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
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
