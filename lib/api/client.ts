/**
 * API Client
 *
 * Axios instance with interceptors for authentication and error handling.
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';

/**
 * Create axios instance with default config
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors globally
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before retrying.');
    }

    // Log error for debugging
    try {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data ? JSON.stringify(error.response.data) : undefined,
        message: error.message,
      });
    } catch (logError) {
      console.error('API Error (serialization failed):', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to set auth token
 */
export const setAuthToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

/**
 * Helper function to get auth token
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

/**
 * Generic API request wrapper with retry logic
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig,
  retries = 3
): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    // Retry on network errors and timeouts (not on 4xx/5xx)
    if (retries > 0 && axios.isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED')) {
      console.log(`Retrying request... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      return apiRequest(config, retries - 1);
    }
    throw error;
  }
}

export default apiClient;
