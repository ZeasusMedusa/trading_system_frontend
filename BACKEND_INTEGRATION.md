# 🔧 Backend Integration Guide - SMIIO Backtest Platform

## 📋 Оглавление

1. [Обзор](#обзор)
2. [Структура данных](#структура-данных)
3. [API Endpoints](#api-endpoints)
4. [Backtest Engine](#backtest-engine)
5. [Индикаторы и метрики](#индикаторы-и-метрики)
6. [Интеграционные точки](#интеграционные-точки)
7. [Примеры кода](#примеры-кода)

---

## 🎯 Обзор

Фронтенд полностью готов и ожидает интеграции с бэкенд-системой для выполнения реальных бэктестов. Текущая реализация использует **mock-функции**, которые нужно заменить на реальную логику.

### Что уже готово на фронтенде:

✅ UI/UX полностью реализован
✅ Структура базы данных спроектирована
✅ TypeScript интерфейсы как контракт API
✅ Mock-функции показывают ожидаемый формат данных
✅ Обработка и отображение результатов

### Что нужно реализовать на бэкенде:

🔧 Backtest Engine (основной движок)
🔧 Индикаторы (SMA, EMA, RSI, MACD, etc.)
🔧 Парсинг JSON стратегий
🔧 Загрузка исторических данных
🔧 Расчет метрик производительности
🔧 API endpoints (или Supabase Edge Functions)

---

## 📊 Структура данных

### 1. Strategy JSON Format (входные данные)

Фронтенд отправляет стратегию в формате:

```typescript
interface StrategyConfig {
  name: string;
  description?: string;
  indicators: Array<{
    type: string;        // "SMA" | "EMA" | "RSI" | "MACD" | "BB" | etc.
    period?: number;     // Период индикатора
    source?: string;     // "close" | "open" | "high" | "low"
    params?: Record<string, any>;  // Дополнительные параметры
  }>;
  entry: {
    long?: string;       // Условие для long позиции
    short?: string;      // Условие для short позиции
  };
  exit: {
    stop_loss?: number;  // В процентах (0.02 = 2%)
    take_profit?: number;
    trailing_stop?: number;
  };
  parameters?: Record<string, any>;  // Кастомные параметры
}
```

**Пример:**

```json
{
  "name": "MA Crossover Strategy",
  "description": "Simple moving average crossover",
  "indicators": [
    {
      "type": "SMA",
      "period": 10,
      "source": "close"
    },
    {
      "type": "SMA",
      "period": 20,
      "source": "close"
    }
  ],
  "entry": {
    "long": "fastMA crosses above slowMA",
    "short": "fastMA crosses below slowMA"
  },
  "exit": {
    "stop_loss": 0.02,
    "take_profit": 0.03
  },
  "parameters": {
    "fastPeriod": 10,
    "slowPeriod": 20,
    "timeframe": "1h"
  }
}
```

---

### 2. Backtest Results (выходные данные)

Бэкенд должен вернуть результаты в формате:

```typescript
interface BacktestResult {
  id: string;                    // UUID
  strategy_id: string;           // UUID стратегии
  job_id: string;               // Уникальный ID задачи
  status: 'pending' | 'running' | 'finished' | 'failed';

  // Основные метрики
  n_trades: number;             // Общее количество сделок
  n_wins: number;               // Прибыльных сделок
  n_losses: number;             // Убыточных сделок
  winrate: number;              // Win rate (0-1)
  total_pnl: number;            // Общий PnL в %
  avg_pnl: number;              // Средний PnL
  profit_factor: number;        // Отношение прибыли к убыткам
  sharpe_ratio: number;         // Коэффициент Шарпа
  max_drawdown: number;         // Максимальная просадка в %

  // Временные метрики
  avg_duration: number;         // Средняя длительность сделки (мин)
  pnl_per_day: number;         // PnL на день
  trades_per_day: number;      // Сделок на день

  // Дополнительно
  strategy_code: StrategyConfig;  // JSON стратегии
  created_at: string;           // ISO timestamp
}
```

---

### 3. Trade Details (детали сделок)

Каждая сделка должна быть сохранена в таблице `trades`:

```typescript
interface Trade {
  id: string;                   // UUID
  backtest_id: string;          // UUID бэктеста
  trade_number: number;         // Номер сделки
  entry_time: string;           // ISO timestamp
  entry_price: number;          // Цена входа
  exit_time: string;            // ISO timestamp
  exit_price: number;           // Цена выхода
  side: 'long' | 'short';       // Направление
  pnl: number;                  // Прибыль/убыток
  duration_minutes: number;     // Длительность в минутах
}
```

---

## 🚀 API Endpoints

### Вариант 1: REST API

Если вы создаете отдельный бэкенд-сервер:

#### POST `/api/backtest/create`

**Request:**
```json
{
  "strategy_name": "MA Crossover Strategy",
  "strategy_config": { /* StrategyConfig */ },
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "timeframe": "1h",
  "symbol": "BTCUSDT"
}
```

**Response:**
```json
{
  "job_id": "bt_1738234567890",
  "status": "pending",
  "message": "Backtest queued successfully"
}
```

---

#### GET `/api/backtest/status/:job_id`

**Response:**
```json
{
  "job_id": "bt_1738234567890",
  "status": "running",
  "progress": 45,
  "current_phase": "Running Strategy",
  "estimated_time_remaining": 120
}
```

---

#### GET `/api/backtest/result/:backtest_id`

**Response:**
```json
{
  "id": "uuid-123",
  "strategy_id": "uuid-456",
  "job_id": "bt_1738234567890",
  "status": "finished",
  "n_trades": 62,
  "n_wins": 30,
  "n_losses": 32,
  "winrate": 0.484,
  "total_pnl": 9.61,
  "sharpe_ratio": 1.32,
  "max_drawdown": 5.31,
  "profit_factor": 0.89,
  "strategy_code": { /* StrategyConfig */ }
}
```

---

#### GET `/api/backtest/:backtest_id/trades`

**Response:**
```json
{
  "trades": [
    {
      "id": "uuid-789",
      "trade_number": 1,
      "entry_time": "2024-01-05T14:30:00Z",
      "entry_price": 48500.00,
      "exit_time": "2024-01-05T15:15:00Z",
      "exit_price": 48750.50,
      "side": "long",
      "pnl": 250.50,
      "duration_minutes": 45
    }
  ],
  "total": 62
}
```

---

### Вариант 2: Supabase Edge Functions

Если используете Supabase, создайте Edge Functions:

```typescript
// supabase/functions/run-backtest/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { strategy_name, strategy_config, start_date, end_date } = await req.json()

  // 1. Создать стратегию в БД
  const { data: strategy } = await supabase
    .from('strategies')
    .insert({ name: strategy_name, config: strategy_config })
    .select()
    .single()

  // 2. Запустить бэктест (очередь задач)
  const jobId = await queueBacktest(strategy.id, start_date, end_date)

  return new Response(
    JSON.stringify({ job_id: jobId, status: 'pending' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

### Вариант 3: Database RPC (Рекомендуется)

Используйте PostgreSQL функции для обработки:

```sql
-- Создать функцию для запуска бэктеста
CREATE OR REPLACE FUNCTION run_backtest(
  p_strategy_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
) RETURNS UUID AS $$
DECLARE
  v_backtest_id UUID;
  v_job_id TEXT;
BEGIN
  -- Генерируем job_id
  v_job_id := 'bt_' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  -- Создаем запись бэктеста
  INSERT INTO backtests (strategy_id, job_id, status)
  VALUES (p_strategy_id, v_job_id, 'pending')
  RETURNING id INTO v_backtest_id;

  -- Здесь вызвать внешний процесс для выполнения бэктеста
  -- Например, отправить задачу в очередь (pg_notify)

  RETURN v_backtest_id;
END;
$$ LANGUAGE plpgsql;
```

**Вызов из фронтенда:**

```typescript
const { data, error } = await supabase.rpc('run_backtest', {
  p_strategy_id: strategyId,
  p_start_date: startDate,
  p_end_date: endDate
})
```

---

## ⚙️ Backtest Engine

### Архитектура движка

```
1. Parse Strategy JSON → 2. Load Historical Data → 3. Initialize Indicators
     ↓                          ↓                           ↓
4. Simulate Trades ← 5. Calculate Signals ← 6. Apply Entry/Exit Rules
     ↓
7. Calculate Metrics → 8. Save to Database → 9. Return Results
```

### Основные компоненты

#### 1. Strategy Parser

```python
class StrategyParser:
    def __init__(self, config: dict):
        self.config = config
        self.indicators = []

    def parse_indicators(self):
        """Парсит индикаторы из JSON"""
        for indicator_config in self.config['indicators']:
            indicator = self.create_indicator(
                indicator_config['type'],
                indicator_config.get('period'),
                indicator_config.get('params', {})
            )
            self.indicators.append(indicator)

    def parse_entry_rules(self):
        """Парсит правила входа"""
        long_rule = self.config['entry'].get('long')
        short_rule = self.config['entry'].get('short')
        return long_rule, short_rule

    def parse_exit_rules(self):
        """Парсит правила выхода"""
        return {
            'stop_loss': self.config['exit'].get('stop_loss'),
            'take_profit': self.config['exit'].get('take_profit'),
            'trailing_stop': self.config['exit'].get('trailing_stop')
        }
```

---

#### 2. Data Loader

```python
class DataLoader:
    def load_historical_data(self, symbol: str, start_date: str,
                             end_date: str, timeframe: str):
        """Загрузка исторических данных"""
        # Пример: загрузка из Binance API
        klines = binance_client.get_historical_klines(
            symbol=symbol,
            interval=timeframe,
            start_str=start_date,
            end_str=end_date
        )

        df = pd.DataFrame(klines, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume'
        ])

        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
```

---

#### 3. Indicator Engine

```python
class IndicatorEngine:
    @staticmethod
    def calculate_sma(data: pd.Series, period: int) -> pd.Series:
        """Simple Moving Average"""
        return data.rolling(window=period).mean()

    @staticmethod
    def calculate_ema(data: pd.Series, period: int) -> pd.Series:
        """Exponential Moving Average"""
        return data.ewm(span=period, adjust=False).mean()

    @staticmethod
    def calculate_rsi(data: pd.Series, period: int = 14) -> pd.Series:
        """Relative Strength Index"""
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    @staticmethod
    def calculate_macd(data: pd.Series, fast: int = 12,
                       slow: int = 26, signal: int = 9):
        """Moving Average Convergence Divergence"""
        ema_fast = data.ewm(span=fast, adjust=False).mean()
        ema_slow = data.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram
```

---

#### 4. Signal Generator

```python
class SignalGenerator:
    def __init__(self, df: pd.DataFrame, indicators: dict):
        self.df = df
        self.indicators = indicators

    def evaluate_condition(self, condition: str) -> pd.Series:
        """Оценивает условие из JSON"""
        # Пример: "fastMA crosses above slowMA"
        if "crosses above" in condition:
            parts = condition.split("crosses above")
            indicator1 = parts[0].strip()
            indicator2 = parts[1].strip()

            return (
                (self.indicators[indicator1] > self.indicators[indicator2]) &
                (self.indicators[indicator1].shift(1) <= self.indicators[indicator2].shift(1))
            )

        # Пример: "RSI < 30"
        if "<" in condition:
            parts = condition.split("<")
            indicator = parts[0].strip()
            value = float(parts[1].strip())
            return self.indicators[indicator] < value

        # Добавьте больше условий по необходимости

    def generate_signals(self, long_rule: str, short_rule: str):
        """Генерирует сигналы на основе правил"""
        self.df['long_signal'] = self.evaluate_condition(long_rule)
        self.df['short_signal'] = self.evaluate_condition(short_rule)
        return self.df
```

---

#### 5. Trade Simulator

```python
class TradeSimulator:
    def __init__(self, df: pd.DataFrame, exit_rules: dict):
        self.df = df
        self.exit_rules = exit_rules
        self.trades = []

    def simulate(self):
        """Симулирует сделки"""
        position = None  # None, 'long', 'short'
        entry_price = 0
        entry_time = None

        for i, row in self.df.iterrows():
            # Проверка выхода из позиции
            if position:
                exit_signal = self.check_exit(
                    position, entry_price, row['close']
                )

                if exit_signal or row['long_signal'] or row['short_signal']:
                    # Закрываем позицию
                    trade = self.close_position(
                        position, entry_price, entry_time,
                        row['close'], row['timestamp']
                    )
                    self.trades.append(trade)
                    position = None

            # Проверка входа в позицию
            if not position:
                if row['long_signal']:
                    position = 'long'
                    entry_price = row['close']
                    entry_time = row['timestamp']
                elif row['short_signal']:
                    position = 'short'
                    entry_price = row['close']
                    entry_time = row['timestamp']

        return self.trades

    def check_exit(self, position: str, entry_price: float,
                   current_price: float) -> bool:
        """Проверяет условия выхода"""
        if position == 'long':
            # Stop Loss
            if self.exit_rules['stop_loss']:
                if current_price <= entry_price * (1 - self.exit_rules['stop_loss']):
                    return True

            # Take Profit
            if self.exit_rules['take_profit']:
                if current_price >= entry_price * (1 + self.exit_rules['take_profit']):
                    return True

        elif position == 'short':
            # Stop Loss
            if self.exit_rules['stop_loss']:
                if current_price >= entry_price * (1 + self.exit_rules['stop_loss']):
                    return True

            # Take Profit
            if self.exit_rules['take_profit']:
                if current_price <= entry_price * (1 - self.exit_rules['take_profit']):
                    return True

        return False

    def close_position(self, position, entry_price, entry_time,
                      exit_price, exit_time):
        """Закрывает позицию и создает объект сделки"""
        if position == 'long':
            pnl = exit_price - entry_price
        else:  # short
            pnl = entry_price - exit_price

        duration = (exit_time - entry_time).total_seconds() / 60

        return {
            'entry_time': entry_time,
            'entry_price': entry_price,
            'exit_time': exit_time,
            'exit_price': exit_price,
            'side': position,
            'pnl': pnl,
            'duration_minutes': duration
        }
```

---

#### 6. Metrics Calculator

```python
class MetricsCalculator:
    def __init__(self, trades: list):
        self.trades = trades

    def calculate_all_metrics(self):
        """Рассчитывает все метрики"""
        wins = [t for t in self.trades if t['pnl'] > 0]
        losses = [t for t in self.trades if t['pnl'] <= 0]

        n_trades = len(self.trades)
        n_wins = len(wins)
        n_losses = len(losses)
        winrate = n_wins / n_trades if n_trades > 0 else 0

        total_pnl = sum(t['pnl'] for t in self.trades)
        avg_pnl = total_pnl / n_trades if n_trades > 0 else 0

        gross_profit = sum(t['pnl'] for t in wins)
        gross_loss = abs(sum(t['pnl'] for t in losses))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0

        avg_win = gross_profit / n_wins if n_wins > 0 else 0
        avg_loss = gross_loss / n_losses if n_losses > 0 else 0

        sharpe_ratio = self.calculate_sharpe(self.trades)
        max_drawdown = self.calculate_max_drawdown(self.trades)

        return {
            'n_trades': n_trades,
            'n_wins': n_wins,
            'n_losses': n_losses,
            'winrate': winrate,
            'total_pnl': total_pnl,
            'avg_pnl': avg_pnl,
            'profit_factor': profit_factor,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'avg_duration': np.mean([t['duration_minutes'] for t in self.trades])
        }

    def calculate_sharpe(self, trades: list) -> float:
        """Коэффициент Шарпа"""
        returns = [t['pnl'] for t in trades]
        if len(returns) == 0:
            return 0
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        return mean_return / std_return if std_return > 0 else 0

    def calculate_max_drawdown(self, trades: list) -> float:
        """Максимальная просадка"""
        cumulative = 0
        peak = 0
        max_dd = 0

        for trade in trades:
            cumulative += trade['pnl']
            if cumulative > peak:
                peak = cumulative
            drawdown = peak - cumulative
            if drawdown > max_dd:
                max_dd = drawdown

        return max_dd
```

---

## 🔌 Интеграционные точки

### 1. Замена createMockBacktest

**Текущий код (фронтенд):**

```typescript
// app/backtest/page.tsx
const createMockBacktest = async () => {
  // ... генерация mock данных
}
```

**Нужно заменить на:**

```typescript
const runRealBacktest = async () => {
  const parsedStrategy = JSON.parse(strategyCode);

  // Вызов API
  const response = await fetch('/api/backtest/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategy_name: finalStrategyName,
      strategy_config: parsedStrategy,
      start_date: finalStartDate,
      end_date: finalEndDate,
      timeframe: '1h',
      symbol: 'BTCUSDT'
    })
  });

  const { job_id } = await response.json();

  // Polling статуса
  pollBacktestStatus(job_id);
};

const pollBacktestStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/backtest/status/${jobId}`);
    const { status, progress } = await response.json();

    setProgress(progress);

    if (status === 'finished') {
      clearInterval(interval);
      loadBacktestResults(jobId);
    }
  }, 2000);
};
```

---

### 2. Загрузка результатов

**Текущий код:**

```typescript
// app/page.tsx
const loadBacktests = async () => {
  const { data } = await supabase
    .from('backtests')
    .select('*, strategies(name)')
    .order('created_at', { ascending: false });

  setBacktests(data || []);
};
```

**Это уже правильно!** Просто убедитесь, что бэкенд сохраняет в правильную таблицу.

---

### 3. Загрузка сделок для модалки

**Текущий код:**

```typescript
// app/components/BacktestDetailsModal.tsx
useEffect(() => {
  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('backtest_id', backtest.id)
      .order('trade_number', { ascending: true });

    setTrades(data || []);
  };

  fetchTrades();
}, [backtest.id]);
```

**Это уже правильно!** Бэкенд должен сохранять сделки в таблицу `trades`.

---

## 💡 Примеры кода для бэкенда

### Полный пример на Python (FastAPI)

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import pandas as pd
from datetime import datetime
from supabase import create_client

app = FastAPI()

# Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class BacktestRequest(BaseModel):
    strategy_name: str
    strategy_config: dict
    start_date: str
    end_date: str
    timeframe: str = "1h"
    symbol: str = "BTCUSDT"

@app.post("/api/backtest/create")
async def create_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    # 1. Создать стратегию
    strategy = supabase.table('strategies').insert({
        'name': request.strategy_name,
        'config': request.strategy_config
    }).execute()

    strategy_id = strategy.data[0]['id']
    job_id = f"bt_{int(datetime.now().timestamp())}"

    # 2. Создать запись бэктеста
    backtest = supabase.table('backtests').insert({
        'strategy_id': strategy_id,
        'job_id': job_id,
        'status': 'pending'
    }).execute()

    backtest_id = backtest.data[0]['id']

    # 3. Запустить бэктест в фоне
    background_tasks.add_task(
        run_backtest_task,
        backtest_id=backtest_id,
        strategy_id=strategy_id,
        config=request.strategy_config,
        start_date=request.start_date,
        end_date=request.end_date,
        symbol=request.symbol,
        timeframe=request.timeframe
    )

    return {"job_id": job_id, "status": "pending"}

async def run_backtest_task(backtest_id, strategy_id, config,
                            start_date, end_date, symbol, timeframe):
    try:
        # Обновить статус
        supabase.table('backtests').update({
            'status': 'running'
        }).eq('id', backtest_id).execute()

        # 1. Загрузить данные
        df = DataLoader().load_historical_data(symbol, start_date, end_date, timeframe)

        # 2. Парсить стратегию
        parser = StrategyParser(config)
        parser.parse_indicators()
        long_rule, short_rule = parser.parse_entry_rules()
        exit_rules = parser.parse_exit_rules()

        # 3. Рассчитать индикаторы
        indicators = {}
        for ind_config in config['indicators']:
            if ind_config['type'] == 'SMA':
                indicators[f"sma_{ind_config['period']}"] = IndicatorEngine.calculate_sma(
                    df['close'], ind_config['period']
                )
            # ... другие индикаторы

        # 4. Генерировать сигналы
        signal_gen = SignalGenerator(df, indicators)
        df = signal_gen.generate_signals(long_rule, short_rule)

        # 5. Симулировать сделки
        simulator = TradeSimulator(df, exit_rules)
        trades = simulator.simulate()

        # 6. Рассчитать метрики
        calculator = MetricsCalculator(trades)
        metrics = calculator.calculate_all_metrics()

        # 7. Сохранить результаты
        supabase.table('backtests').update({
            'status': 'finished',
            **metrics,
            'strategy_code': config
        }).eq('id', backtest_id).execute()

        # 8. Сохранить сделки
        for i, trade in enumerate(trades):
            supabase.table('trades').insert({
                'backtest_id': backtest_id,
                'trade_number': i + 1,
                **trade
            }).execute()

    except Exception as e:
        # Обработка ошибок
        supabase.table('backtests').update({
            'status': 'failed',
            'error_message': str(e)
        }).eq('id', backtest_id).execute()

@app.get("/api/backtest/status/{job_id}")
async def get_status(job_id: str):
    result = supabase.table('backtests').select('status').eq('job_id', job_id).execute()
    return {"job_id": job_id, "status": result.data[0]['status']}
```

---

## ✅ Чеклист для бэкенд-разработчика

### Phase 1: Базовая настройка
- [ ] Применить SQL схему из `supabase/schema.sql`
- [ ] Настроить подключение к Supabase
- [ ] Создать API endpoints (REST или Edge Functions)

### Phase 2: Core функционал
- [ ] Реализовать парсер JSON стратегий
- [ ] Создать загрузчик исторических данных (Binance/другой источник)
- [ ] Реализовать индикаторы (SMA, EMA, RSI, MACD, BB)
- [ ] Создать генератор сигналов
- [ ] Реализовать симулятор сделок

### Phase 3: Метрики
- [ ] Рассчет основных метрик (winrate, PnL, profit factor)
- [ ] Рассчет Sharpe Ratio
- [ ] Рассчет Max Drawdown
- [ ] Временные метрики (avg duration, PnL per day)

### Phase 4: Интеграция
- [ ] Заменить `createMockBacktest` на реальный API вызов
- [ ] Добавить polling для статуса бэктеста
- [ ] Протестировать с реальными данными
- [ ] Оптимизация производительности

### Phase 5: Production
- [ ] Error handling и logging
- [ ] Rate limiting
- [ ] Мониторинг
- [ ] Документация API

---

## 🚨 Важные замечания

1. **TypeScript типы** - используйте интерфейсы из фронтенда как контракт
2. **Формат дат** - всегда ISO 8601 (2024-01-01T00:00:00Z)
3. **Десятичные числа** - PnL в процентах (9.61 = 9.61%), winrate от 0 до 1
4. **Сохранение стратегии** - дублируйте в `strategy_code` JSONB для истории
5. **RLS политики** - учитывайте `user_id` при работе с БД

---

## 📞 Поддержка

При возникновении вопросов:
- Изучите mock-функцию `createMockBacktest` - она показывает ожидаемый формат
- Проверьте TypeScript интерфейсы в коде
- Посмотрите примеры API responses выше
- Используйте Supabase Dashboard для отладки SQL

**Фронтенд готов и ждет вашу интеграцию!** 🚀
