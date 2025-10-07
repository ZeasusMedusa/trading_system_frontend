/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings.
 * Toggle between mock and real API using environment variables.
 */

// API Base URL - defaults to 127.0.0.1:8000
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Use mock API for development/testing
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Request timeout in milliseconds
export const API_TIMEOUT = 120000; // 2 minutes for large data requests

// Polling interval for backtest status (in ms)
export const BACKTEST_POLLING_INTERVAL = 2000; // 2 seconds

// Max polling attempts before giving up
export const MAX_POLLING_ATTEMPTS = 150; // 5 minutes with 2s interval

/**
 * API Endpoints
 */
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Backtest
  BACKTEST: {
    TEST: '/backtest/test',
    RESULT: (jobId: string) => `/backtest/${jobId}`,
    DEFAULT_STRATEGY: '/backtest/default-strategy',
    // New strategy endpoints
    STRATEGY_BUY: '/backtest/strategy/buy',
    STRATEGY_SELL: '/backtest/strategy/sell',
    STRATEGY_BOTH: '/backtest/strategy/both',
    STRATEGY_DUAL: '/backtest/strategy/dual',
    TEST_DUAL: '/backtest/test/dual',
    DOWNLOAD: (jobId: string) => `/backtest/${jobId}/download`,
  },

  // Strategies
  STRATEGY: {
    LIST: '/strategy/',
    CREATE: '/strategy/',
    ITEM: (strategyId: number | string) => `/strategy/${strategyId}`,
    UPDATE: (strategyId: number | string) => `/strategy/${strategyId}`,
    DELETE: (strategyId: number | string) => `/strategy/${strategyId}`,
    SAVE_RESULTS: (strategyId: number | string) => `/strategy/${strategyId}/results`,
    SAVE_BACKTEST_TO_STRATEGY: (jobId: string | number) => `/backtest/${jobId}/save-to-strategy`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER: (userId: number) => `/admin/users/${userId}`,
    SYMBOLS: '/admin/parsed-symbols',
    SYMBOL: (symbolId: number) => `/admin/parsed-symbols/${symbolId}`,
  },

  // Parsing
  PARSE: {
    SYNC_START: '/parse/sync/start',
    SYNC_STATUS: '/parse/sync/status',
  },

  // Settings
  SETTINGS: {
    API_KEYS: '/auth/api-keys',
    API_KEY: (exchange: string) => `/auth/api-keys/${exchange}`,
    TELEGRAM: '/auth/telegram-settings',
  },
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const;
