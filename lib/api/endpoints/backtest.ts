/**
 * Backtest API Endpoints
 *
 * Functions for running backtests and polling results.
 */

import { apiRequest } from '../client';
import { ENDPOINTS, USE_MOCK_API, BACKTEST_POLLING_INTERVAL, MAX_POLLING_ATTEMPTS } from '../config';
import {
  mockBacktestTest,
  mockBacktestStatus,
} from '../mock';
import type {
  BacktestEnqueueResponse,
  BacktestStatusResponse,
  BacktestFinishedResponse,
  Strategy,
} from '../types';

/**
 * Submit a strategy for backtesting
 */
export async function submitBacktest(strategy: Strategy): Promise<BacktestEnqueueResponse> {
  if (USE_MOCK_API) {
    return mockBacktestTest(strategy);
  }

  return apiRequest<BacktestEnqueueResponse>({
    method: 'POST',
    url: ENDPOINTS.BACKTEST.TEST,
    data: strategy,
  });
}

/**
 * Get backtest status/results by job ID
 */
export async function getBacktestStatus(
  jobId: string, 
  options?: { start?: number; end?: number; full?: boolean }
): Promise<BacktestStatusResponse> {
  if (USE_MOCK_API) {
    return mockBacktestStatus(jobId);
  }

  const params = new URLSearchParams();
  if (options?.start !== undefined) {
    params.append('start', options.start.toString());
  }
  if (options?.end !== undefined) {
    params.append('end', options.end.toString());
  }
  if (options?.full !== undefined) {
    params.append('full', options.full.toString());
  }

  const url = ENDPOINTS.BACKTEST.RESULT(jobId) + (params.toString() ? `?${params.toString()}` : '');
  
  return apiRequest<BacktestStatusResponse>({
    method: 'GET',
    url,
  });
}

/**
 * Poll for backtest results until finished or timeout
 *
 * @param jobId - The job ID to poll
 * @param onProgress - Optional callback for progress updates
 * @returns The finished backtest results
 * @throws Error if polling times out or job fails
 */
export async function pollBacktestResults(
  jobId: string,
  onProgress?: (status: BacktestStatusResponse) => void
): Promise<BacktestFinishedResponse> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const status = await getBacktestStatus(jobId);

    // Call progress callback if provided
    if (onProgress) {
      onProgress(status);
    }

    // Check if finished
    if (status.status === 'finished') {
      return status as BacktestFinishedResponse;
    }

    // Check if failed (you can add more error statuses here)
    if (status.status === 'too_frequent') {
      // Wait a bit longer for too_frequent errors
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      attempts++;
      continue;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, BACKTEST_POLLING_INTERVAL));
    attempts++;
  }

  throw new Error(`Backtest polling timed out after ${MAX_POLLING_ATTEMPTS} attempts`);
}

/**
 * Run a complete backtest with automatic polling
 *
 * This is a convenience function that submits the backtest and waits for results.
 *
 * @param strategy - The strategy to test
 * @param onProgress - Optional callback for progress updates
 * @returns The finished backtest results
 */
export async function runBacktest(
  strategy: Strategy,
  onProgress?: (status: string, data?: unknown) => void
): Promise<BacktestFinishedResponse> {
  // Submit backtest
  if (onProgress) {
    onProgress('enqueuing');
  }
  const { job_id } = await submitBacktest(strategy);

  // Poll for results
  if (onProgress) {
    onProgress('polling', { job_id });
  }
  const results = await pollBacktestResults(job_id, (status) => {
    if (onProgress) {
      onProgress(status.status, status);
    }
  });

  if (onProgress) {
    onProgress('finished', results);
  }
  return results;
}

/**
 * Get default strategy from backend
 */
export async function getDefaultStrategy(): Promise<Strategy> {
  return apiRequest<Strategy>({
    method: 'GET',
    url: ENDPOINTS.BACKTEST.DEFAULT_STRATEGY,
  });
}

// New Strategy endpoints
export async function getBuyStrategy(): Promise<Strategy> {
  return apiRequest<Strategy>({ method: 'GET', url: ENDPOINTS.BACKTEST.STRATEGY_BUY });
}

export async function getSellStrategy(): Promise<Strategy> {
  return apiRequest<Strategy>({ method: 'GET', url: ENDPOINTS.BACKTEST.STRATEGY_SELL });
}

export async function getBothStrategies(): Promise<{ buy_strategy: Strategy; sell_strategy: Strategy } | unknown> {
  return apiRequest({ method: 'GET', url: ENDPOINTS.BACKTEST.STRATEGY_BOTH });
}

export async function getDualTemplate(): Promise<unknown> {
  return apiRequest({ method: 'GET', url: ENDPOINTS.BACKTEST.STRATEGY_DUAL });
}

export async function submitDualBacktest(body: { buy_strategy: Strategy; sell_strategy: Strategy } | { dual_strategy: { buy_strategy: Strategy; sell_strategy: Strategy } } | unknown): Promise<BacktestEnqueueResponse> {
  return apiRequest<BacktestEnqueueResponse>({ method: 'POST', url: ENDPOINTS.BACKTEST.TEST_DUAL, data: body });
}

export async function downloadResults(jobId: string): Promise<Blob> {
  // Use the raw axios instance to get blob
  return apiRequest<Blob>({ method: 'GET', url: ENDPOINTS.BACKTEST.DOWNLOAD(jobId), responseType: 'blob' as any });
}
