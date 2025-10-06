/**
 * API Module - Main Entry Point
 *
 * Central export for all API functions.
 * Import everything from here: import { api } from '@/lib/api'
 */

// Config
export * from './config';
export * from './types';

// Client
export { apiClient, setAuthToken, getAuthToken } from './client';

// Endpoints
export * as backtest from './endpoints/backtest';
export * as auth from './endpoints/auth';
export * as admin from './endpoints/admin';
export * as settings from './endpoints/settings';

// Convenience default export with all endpoints
import * as backtest from './endpoints/backtest';
import * as auth from './endpoints/auth';
import * as admin from './endpoints/admin';
import * as settings from './endpoints/settings';

export const api = {
  backtest,
  auth,
  admin,
  settings,
};

export default api;
