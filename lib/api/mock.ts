/**
 * Mock API
 *
 * Mock implementations for all API endpoints.
 * Used for development and testing without backend.
 */

import type {
  BacktestEnqueueResponse,
  BacktestStatusResponse,
  LoginResponse,
  User,
  ParsedSymbol,
  SyncStartResponse,
  SyncStatusResponse,
  APIKeyResponse,
  TelegramSettingsResponse,
  Analytics,
  Trade,
} from './types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock job storage
const mockJobs = new Map<string, 'pending' | 'finished'>();

// ============================================================================
// BACKTEST MOCKS
// ============================================================================

export const mockBacktestTest = async (strategy: unknown): Promise<BacktestEnqueueResponse> => {
  await delay(500);
  const jobId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set job as pending initially
  mockJobs.set(jobId, 'pending');

  // Simulate job completion after 5 seconds
  setTimeout(() => {
    mockJobs.set(jobId, 'finished');
  }, 5000);

  return {
    status: 'enqueued',
    job_id: jobId,
  };
};

export const mockBacktestStatus = async (jobId: string): Promise<BacktestStatusResponse> => {
  await delay(300);

  const status = mockJobs.get(jobId);

  if (!status || status === 'pending') {
    return {
      status: 'pending',
    };
  }

  // Generate mock analytics
  const nTrades = Math.floor(Math.random() * 50) + 20;
  const nWins = Math.floor(nTrades * (0.4 + Math.random() * 0.3));
  const nLosses = nTrades - nWins;

  const mockTrades: Trade[] = Array.from({ length: nTrades }, (_, i) => {
    const isWin = i < nWins;
    const entryPrice = 45000 + Math.random() * 5000;
    const priceChange = isWin
      ? (0.005 + Math.random() * 0.015)
      : -(0.003 + Math.random() * 0.012);
    const exitPrice = entryPrice * (1 + priceChange);
    const duration = 30 + Math.floor(Math.random() * 300);

    return {
      entry_time: Date.now() - (nTrades - i) * 3600000,
      exit_time: Date.now() - (nTrades - i) * 3600000 + duration * 60000,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity: 1,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      trade_type: 'market',
      fees: 0.1,
      slippage: 0.01,
      pnl: (exitPrice - entryPrice) / entryPrice,
      pnl_absolute: exitPrice - entryPrice,
      duration_minutes: duration,
    };
  });

  const analytics: Analytics = {
    n_trades: nTrades,
    n_wins: nWins,
    n_losses: nLosses,
    winrate: nWins / nTrades,
    total_pnl: (Math.random() - 0.3) * 20,
    avg_pnl: 0.5,
    med_pnl: 0.4,
    std_pnl: 1.2,
    max_profit: 5.5,
    max_loss: -3.2,
    gross_profit: 25.5,
    gross_loss: -15.2,
    profit_factor: 1.68,
    avg_win: 1.5,
    avg_loss: -0.8,
    max_drawdown: Math.random() * 15 + 5,
    sharpe_ratio: (Math.random() * 2) + 0.5,
    max_win_streak: 5,
    max_loss_streak: 3,
    avg_duration: 120,
    max_duration: 480,
    min_duration: 30,
    trades: mockTrades,
  };

  return {
    status: 'finished',
    total: 1000,
    returned: nTrades,
    start: 0,
    end: nTrades,
    analytics,
    type_side: 'both',
    bars: [],
    min_tf: '1h',
  };
};

// ============================================================================
// AUTH MOCKS
// ============================================================================

export const mockLogin = async (username: string, password: string): Promise<LoginResponse> => {
  await delay(500);

  if (username === 'admin' && password === 'admin') {
    return {
      access_token: 'mock_token_' + Math.random().toString(36).substr(2),
      token_type: 'bearer',
    };
  }

  throw new Error('Invalid credentials');
};

export const mockGetMe = async (): Promise<User> => {
  await delay(300);
  return {
    id: 1,
    username: 'admin',
    is_admin: true,
    activated: true,
    created_at: new Date().toISOString(),
  };
};

// ============================================================================
// ADMIN - USERS MOCKS
// ============================================================================

const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    is_admin: true,
    activated: true,
    created_at: '2025-10-03T08:09:03.250980',
  },
  {
    id: 2,
    username: 'user1',
    is_admin: false,
    activated: true,
    created_at: '2025-10-04T10:15:22.123456',
  },
];

export const mockGetUsers = async (): Promise<User[]> => {
  await delay(400);
  return mockUsers;
};

export const mockCreateUser = async (data: Partial<User>): Promise<User> => {
  await delay(500);
  const newUser: User = {
    id: mockUsers.length + 1,
    username: data.username || 'new_user',
    is_admin: data.is_admin || false,
    activated: data.activated || false,
    created_at: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const mockDeleteUser = async (userId: number): Promise<{ detail: string }> => {
  await delay(400);
  return { detail: 'User deleted' };
};

// ============================================================================
// ADMIN - SYMBOLS MOCKS
// ============================================================================

const mockSymbols: ParsedSymbol[] = [
  {
    id: 1,
    exchange: 'binance',
    symbol: 'BTC/USDT',
    enabled: true,
    created_at: '2025-10-04T06:57:25.539429',
    last_run_at: '2025-10-06T08:49:22.776016',
    next_run_at: '2025-10-06T08:49:32.776016',
  },
  {
    id: 2,
    exchange: 'binance',
    symbol: 'ETH/USDT',
    enabled: true,
    created_at: '2025-10-05T12:30:15.123456',
    last_run_at: null,
    next_run_at: null,
  },
];

export const mockGetSymbols = async (): Promise<ParsedSymbol[]> => {
  await delay(400);
  return mockSymbols;
};

export const mockCreateSymbol = async (data: Partial<ParsedSymbol>): Promise<ParsedSymbol> => {
  await delay(500);
  const newSymbol: ParsedSymbol = {
    id: mockSymbols.length + 1,
    exchange: data.exchange || 'binance',
    symbol: data.symbol || 'BTC/USDT',
    enabled: data.enabled ?? true,
    created_at: new Date().toISOString(),
    last_run_at: null,
    next_run_at: null,
  };
  mockSymbols.push(newSymbol);
  return newSymbol;
};

export const mockDeleteSymbol = async (symbolId: number): Promise<{ detail: string }> => {
  await delay(400);
  return { detail: 'Symbol deleted' };
};

// ============================================================================
// PARSING MOCKS
// ============================================================================

export const mockSyncStart = async (): Promise<SyncStartResponse> => {
  await delay(600);
  return {
    jobs: ['job_1', 'job_2', 'job_3'],
  };
};

export const mockSyncStatus = async (): Promise<SyncStatusResponse> => {
  await delay(300);
  return {
    running: Math.random() > 0.5,
    details: [
      {
        exchange: 'binance',
        running: Math.random() > 0.5,
      },
    ],
  };
};

// ============================================================================
// SETTINGS MOCKS
// ============================================================================

export const mockSaveAPIKey = async (): Promise<APIKeyResponse> => {
  await delay(500);
  return {
    msg: 'API-ключи сохранены',
    api_key_id: 1,
  };
};

export const mockSaveTelegramSettings = async (): Promise<TelegramSettingsResponse> => {
  await delay(500);
  return {
    msg: 'Настройки Telegram сохранены',
    settings_id: 1,
  };
};
