// Backtest types and interfaces

export interface CompletedBacktest {
  id: string;
  total_pnl: number;
  winrate: number;
  n_trades: number;
  n_wins: number;
  n_losses: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  strategy_code?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  bars?: Array<Record<string, unknown>>;
  strategy_type?: 'single' | 'dual';
  bars_buy?: Array<Record<string, unknown>>;
  bars_sell?: Array<Record<string, unknown>>;
}

export interface DownloadOptions {
  results: boolean;
  code: boolean;
}

export interface Trade {
  id: string;
  backtest_id: string;
  trade_number: number;
  entry_time: string;
  entry_price: number;
  exit_time: string;
  exit_price: number;
  side: 'long' | 'short';
  pnl: number;
  duration_minutes: number;
}

export interface SavedStrategy {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  strategyCode: Record<string, unknown>;  // Strategy JSON only
  analytics?: Record<string, unknown>;     // Full analytics only
  config: {
    startDate: string;
    endDate: string;
    strategyName: string;
  };
  hasZipFile?: boolean; // Indicates if ZIP file is available
  zipFileName?: string; // Name of the ZIP file
  // Note: backtestData removed - only strategyCode and analytics stored
}
