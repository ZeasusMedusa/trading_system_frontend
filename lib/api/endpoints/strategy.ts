/**
 * Strategy API Endpoints
 */

import { apiRequest } from '../client';
import { ENDPOINTS } from '../config';

export interface StrategyCreateRequest {
  name: string;
  description?: string;
  config: Record<string, unknown>; // Strategy object (not string)
}

export interface StrategyListItem {
  id: number;
  name: string;
  description?: string;
  config: Record<string, unknown>; // Strategy object
  metrics?: Record<string, unknown>;
  created_at: string;
}

export interface StrategyItem extends StrategyListItem {}

export async function listStrategies(): Promise<StrategyListItem[]> {
  return apiRequest({ method: 'GET', url: ENDPOINTS.STRATEGY.LIST });
}

export async function getStrategy(strategyId: number | string): Promise<StrategyItem> {
  return apiRequest({ method: 'GET', url: ENDPOINTS.STRATEGY.ITEM(strategyId) });
}

export async function createStrategy(payload: StrategyCreateRequest): Promise<{ id: number; status: string }> {
  return apiRequest({ method: 'POST', url: ENDPOINTS.STRATEGY.CREATE, data: payload });
}

export async function updateStrategy(strategyId: number | string, payload: StrategyCreateRequest): Promise<{ id: number; status: string }> {
  return apiRequest({ method: 'PUT', url: ENDPOINTS.STRATEGY.UPDATE(strategyId), data: payload });
}

export async function deleteStrategy(strategyId: number | string): Promise<{ status: string; id: number }> {
  return apiRequest({ method: 'DELETE', url: ENDPOINTS.STRATEGY.DELETE(strategyId) });
}

export async function saveResults(strategyId: number | string, analytics: Record<string, unknown>): Promise<{ status: string }> {
  return apiRequest({ method: 'POST', url: ENDPOINTS.STRATEGY.SAVE_RESULTS(strategyId), data: { analytics } });
}

export async function saveBacktestToStrategy(jobId: number | string, strategyId: number | string): Promise<{ status: string }> {
  return apiRequest({ method: 'POST', url: ENDPOINTS.STRATEGY.SAVE_BACKTEST_TO_STRATEGY(jobId), data: { strategy_id: strategyId } });
}


