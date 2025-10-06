/**
 * API Types
 *
 * TypeScript types for all API requests and responses.
 * Based on backend documentation.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'ladder' | 'tp_sl';
export type BacktestStatus = 'pending' | 'enqueued' | 'running' | 'finished' | 'failed' | 'too_frequent';

// ============================================================================
// TRADE MODEL
// ============================================================================

export interface Trade {
  entry_time: number | string; // Unix timestamp in ms or ISO string
  exit_time: number | string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  side: OrderSide;
  trade_type: OrderType;
  fees: number;
  slippage: number;
  metadata?: Record<string, unknown>;

  // Computed properties (from backend)
  pnl?: number;
  pnl_absolute?: number;
  duration_minutes?: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface Analytics {
  // Basic metrics
  n_trades: number;
  n_wins: number;
  n_losses: number;
  winrate: number;

  // PnL metrics
  total_pnl: number;
  avg_pnl: number;
  med_pnl: number;
  std_pnl: number;
  max_profit: number;
  max_loss: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;

  // Risk metrics
  max_drawdown: number;
  sharpe_ratio: number;
  max_win_streak: number;
  max_loss_streak: number;

  // Time metrics
  avg_duration: number;
  max_duration: number;
  min_duration: number;
  total_duration_days?: number;
  total_duration_hours?: number;
  pnl_per_day?: number;
  pnl_per_month?: number;
  pnl_per_year?: number;
  trades_per_day?: number;

  // Additional
  trade_type_analysis?: Record<string, unknown>;
  trades: Trade[];
}

// ============================================================================
// BACKTEST RESPONSES
// ============================================================================

export interface BacktestEnqueueResponse {
  status: 'enqueued';
  job_id: string;
}

export interface BacktestPendingResponse {
  status: 'pending';
}

export interface BacktestTooFrequentResponse {
  status: 'too_frequent';
  message: string;
}

export interface BacktestFinishedResponse {
  status: 'finished';
  total: number;
  returned: number;
  start: number;
  end: number;
  analytics: Analytics;
  type_side: string;
  bars: unknown[]; // OHLCV bars data
  min_tf: string;
}

export type BacktestStatusResponse =
  | BacktestPendingResponse
  | BacktestTooFrequentResponse
  | BacktestFinishedResponse;

// ============================================================================
// AUTH
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  activated: boolean;
  created_at: string;
}

// ============================================================================
// ADMIN - USERS
// ============================================================================

export interface CreateUserRequest {
  username: string;
  password: string;
  is_admin: boolean;
  activated: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  is_admin?: boolean;
  activated?: boolean;
}

// ============================================================================
// ADMIN - SYMBOLS
// ============================================================================

export interface ParsedSymbol {
  id: number;
  exchange: string;
  symbol: string;
  enabled: boolean;
  created_at: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface CreateSymbolRequest {
  exchange: string;
  symbol: string;
  enabled: boolean;
}

export interface UpdateSymbolRequest {
  exchange?: string;
  symbol?: string;
  enabled?: boolean;
}

// ============================================================================
// PARSING
// ============================================================================

export interface SyncStartResponse {
  jobs: string[]; // Array of job IDs
}

export interface ExchangeSyncStatus {
  exchange: string;
  running: boolean;
}

export interface SyncStatusResponse {
  running: boolean;
  details: ExchangeSyncStatus[];
}

// ============================================================================
// SETTINGS - API KEYS
// ============================================================================

export interface APIKeyRequest {
  exchange: string;
  api_key: string;
  api_secret: string;
}

export interface APIKeyResponse {
  msg: string;
  api_key_id: number;
}

export interface APIKeyInfo {
  exchange: string;
  api_key: string; // Masked in response
  created_at: string;
}

// ============================================================================
// SETTINGS - TELEGRAM
// ============================================================================

export interface TelegramSettingsRequest {
  token: string;
  chat_id: string;
}

export interface TelegramSettingsResponse {
  msg: string;
  settings_id: number;
}

export interface TelegramSettings {
  token: string; // Masked in response
  chat_id: string;
  created_at: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface APIError {
  detail: string | { msg: string; type: string }[];
}

// ============================================================================
// STRATEGY (from existing schema)
// ============================================================================

export interface Strategy {
  id?: string;
  name: string;
  description?: string;
  config: Record<string, unknown>; // JSON strategy config
  created_at?: string;
  updated_at?: string;
}
