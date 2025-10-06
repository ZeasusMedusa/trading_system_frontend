-- ============================================================================
-- SMIIO BACKTEST PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Updated to match backend API structure
-- Includes: strategies, backtests, trades, and user data

-- ============================================================================
-- STRATEGIES TABLE
-- ============================================================================
-- Stores trading strategies (JSON config)
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Full strategy configuration

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false
);

-- ============================================================================
-- BACKTESTS TABLE
-- ============================================================================
-- Stores backtest results and analytics
CREATE TABLE IF NOT EXISTS backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- References
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job tracking
  job_id TEXT UNIQUE, -- Backend job ID
  status TEXT DEFAULT 'pending', -- pending, running, finished, failed

  -- Strategy snapshot (JSONB copy of strategy at backtest time)
  strategy_code JSONB, -- Stores the full strategy config used for this backtest

  -- Basic metrics
  n_trades INTEGER,
  n_wins INTEGER,
  n_losses INTEGER,
  winrate DECIMAL(10, 6),

  -- PnL metrics
  total_pnl DECIMAL(20, 8),
  avg_pnl DECIMAL(20, 8),
  med_pnl DECIMAL(20, 8),
  std_pnl DECIMAL(20, 8),
  max_profit DECIMAL(20, 8),
  max_loss DECIMAL(20, 8),
  gross_profit DECIMAL(20, 8),
  gross_loss DECIMAL(20, 8),
  profit_factor DECIMAL(20, 8),
  avg_win DECIMAL(20, 8),
  avg_loss DECIMAL(20, 8),

  -- Risk metrics
  max_drawdown DECIMAL(20, 8),
  sharpe_ratio DECIMAL(20, 8),
  max_win_streak INTEGER,
  max_loss_streak INTEGER,

  -- Time metrics
  avg_duration DECIMAL(20, 4), -- in minutes
  max_duration DECIMAL(20, 4),
  min_duration DECIMAL(20, 4),
  total_duration_days DECIMAL(20, 4),
  total_duration_hours DECIMAL(20, 4),
  pnl_per_day DECIMAL(20, 8),
  pnl_per_month DECIMAL(20, 8),
  pnl_per_year DECIMAL(20, 8),
  trades_per_day DECIMAL(20, 4),

  -- Additional analytics
  trade_type_analysis JSONB, -- Breakdown by trade type

  -- Metadata
  type_side TEXT, -- 'long', 'short', 'both'
  min_tf TEXT, -- Minimum timeframe used

  -- Additional data
  bars JSONB, -- OHLCV bars data (optional, can be large)
  total_bars INTEGER,
  returned_bars INTEGER,
  start_index INTEGER,
  end_index INTEGER
);

-- ============================================================================
-- TRADES TABLE
-- ============================================================================
-- Stores individual trades from backtests
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Reference to backtest
  backtest_id UUID REFERENCES backtests(id) ON DELETE CASCADE NOT NULL,

  -- Trade identification
  trade_number INTEGER, -- Order in the backtest

  -- Entry/Exit times
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Prices
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8) NOT NULL,

  -- Position
  quantity DECIMAL(20, 8) DEFAULT 1.0,
  side TEXT NOT NULL, -- 'buy' or 'sell'
  trade_type TEXT NOT NULL, -- 'market', 'limit', 'ladder', 'tp_sl'

  -- Costs
  fees DECIMAL(20, 8) DEFAULT 0.0,
  slippage DECIMAL(20, 8) DEFAULT 0.0,

  -- Results (computed)
  pnl DECIMAL(20, 8), -- Relative PnL (percentage)
  pnl_absolute DECIMAL(20, 8), -- Absolute PnL in quote currency
  duration_minutes DECIMAL(20, 4), -- Trade duration

  -- Additional data
  metadata JSONB -- Any extra trade-specific data
);

-- ============================================================================
-- FOLDERS TABLE (for organizing backtests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1'
);

-- ============================================================================
-- DASHBOARD LAYOUTS TABLE
-- ============================================================================
-- Stores custom dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL, -- react-grid-layout config
  widgets JSONB NOT NULL -- Widget settings
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance indexes for common queries

-- Strategies
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);

-- Backtests
CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy_id ON backtests(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at ON backtests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtests_job_id ON backtests(job_id);
CREATE INDEX IF NOT EXISTS idx_backtests_status ON backtests(status);

-- Trades
CREATE INDEX IF NOT EXISTS idx_trades_backtest_id ON trades(backtest_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_trade_number ON trades(backtest_id, trade_number);

-- Folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Dashboard Layouts
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - STRATEGIES
-- ============================================================================
CREATE POLICY "Users can view their own strategies or public ones"
  ON strategies FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - BACKTESTS
-- ============================================================================
CREATE POLICY "Users can view their own backtests"
  ON backtests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backtests"
  ON backtests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtests"
  ON backtests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtests"
  ON backtests FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - TRADES
-- ============================================================================
-- Trades are accessed through backtests, so check backtest ownership
CREATE POLICY "Users can view trades from their backtests"
  ON trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM backtests
      WHERE backtests.id = trades.backtest_id
      AND backtests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trades for their backtests"
  ON trades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM backtests
      WHERE backtests.id = trades.backtest_id
      AND backtests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update trades from their backtests"
  ON trades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM backtests
      WHERE backtests.id = trades.backtest_id
      AND backtests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete trades from their backtests"
  ON trades FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM backtests
      WHERE backtests.id = trades.backtest_id
      AND backtests.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - FOLDERS
-- ============================================================================
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - DASHBOARD LAYOUTS
-- ============================================================================
CREATE POLICY "Users can view their own layouts"
  ON dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layouts"
  ON dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layouts"
  ON dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layouts"
  ON dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backtests_updated_at
  BEFORE UPDATE ON backtests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================
-- This schema is designed to work with the backend API while maintaining
-- Supabase RLS for user data isolation.
--
-- Key changes from previous schema:
-- 1. Added 'trades' table for individual trade storage
-- 2. Added 'strategy_code' JSONB field to backtests
-- 3. Added all analytics fields from backend API
-- 4. Added 'job_id' for backend job tracking
-- 5. Added 'bars' field for OHLCV data storage (optional)
--
-- To apply this schema:
-- 1. Connect to your Supabase project
-- 2. Run this SQL in the SQL Editor
-- 3. Existing data will be preserved (IF NOT EXISTS clauses)
