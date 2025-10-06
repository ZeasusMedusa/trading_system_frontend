'use client';

import type { CompletedBacktest } from '@/types/backtest';

interface InfoPanelProps {
  completedBacktest: CompletedBacktest | null;
  isRunning: boolean;
  currentPhase: string;
  strategyName: string;
  setStrategyName: (name: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  infoMessages: string[];
  infoPanelRef: React.RefObject<HTMLDivElement | null>;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  simulateBacktest: () => void;
  runServerBacktest: () => void;
  handleDownload: () => void;
  setShowDetailsModal: (show: boolean) => void;
  progress: number;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
}

export function InfoPanel({
  completedBacktest,
  isRunning,
  currentPhase,
  strategyName,
  setStrategyName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  infoMessages,
  infoPanelRef,
  showScrollButton,
  scrollToBottom,
  simulateBacktest,
  runServerBacktest,
  handleDownload,
  setShowDetailsModal,
  progress,
  elapsedTime,
  formatTime,
}: InfoPanelProps) {
  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-6 py-3 border-b border-blue-500/30">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>
            {completedBacktest ? 'Results Summary' : isRunning ? 'Analysis In Progress' : 'Backtest Information'}
          </span>
        </h2>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative" ref={infoPanelRef}>
        {!isRunning && currentPhase !== 'Completed' ? (
          <ConfigurationView
            strategyName={strategyName}
            setStrategyName={setStrategyName}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            simulateBacktest={simulateBacktest}
            runServerBacktest={runServerBacktest}
            isRunning={isRunning}
          />
        ) : completedBacktest ? (
          <ResultsView
            completedBacktest={completedBacktest}
            handleDownload={handleDownload}
            setShowDetailsModal={setShowDetailsModal}
          />
        ) : (
          <RunningView
            infoMessages={infoMessages}
            currentPhase={currentPhase}
            elapsedTime={elapsedTime}
            formatTime={formatTime}
            progress={progress}
            isRunning={isRunning}
          />
        )}
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all z-10"
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </div>
  );
}

function ConfigurationView({
  strategyName,
  setStrategyName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  simulateBacktest,
  runServerBacktest,
  isRunning,
}: {
  strategyName: string;
  setStrategyName: (name: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  simulateBacktest: () => void;
  runServerBacktest: () => void;
  isRunning: boolean;
}) {
  return (
    <>
      {/* How It Works */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Как работает бэктестинг
        </h3>
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5">
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">1.</span>
              <div>
                <div className="font-semibold text-white">Загрузка данных</div>
                <div className="text-xs text-gray-400">Подгружаются исторические свечи за выбранный период</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">2.</span>
              <div>
                <div className="font-semibold text-white">Инициализация индикаторов</div>
                <div className="text-xs text-gray-400">SMA, EMA, RSI и другие из вашего JSON</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">3.</span>
              <div>
                <div className="font-semibold text-white">Симуляция сделок</div>
                <div className="text-xs text-gray-400">Проверка entry/exit условий на каждой свече</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">4.</span>
              <div>
                <div className="font-semibold text-white">Расчёт метрик</div>
                <div className="text-xs text-gray-400">Winrate, Sharpe, Max Drawdown, Profit Factor и др.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Analytics */}
      <MetricsInfo />

      {/* Configuration Form */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Настройки бэктеста
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Strategy Name</label>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="My Trading Strategy"
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>


          <div className="flex gap-3">
            <button
              onClick={simulateBacktest}
              disabled={isRunning}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Run Backtest (Demo)
            </button>
            <button
              onClick={runServerBacktest}
              disabled={isRunning}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🌐 Run Backtest (Server)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricsInfo() {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        Метрики аналитики
      </h3>
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-cyan-400 font-semibold mb-2">🧾 Базовые метрики</div>
            <div className="space-y-1 text-gray-300 pl-3">
              <div><span className="text-purple-400">n_trades</span> — общее кол-во сделок</div>
              <div><span className="text-purple-400">n_wins</span> / <span className="text-purple-400">n_losses</span> — прибыльные/убыточные</div>
              <div><span className="text-purple-400">winrate</span> — процент выигрышей (0–1)</div>
            </div>
          </div>

          <div>
            <div className="text-green-400 font-semibold mb-2">💰 Прибыль/Убыток</div>
            <div className="space-y-1 text-gray-300 pl-3">
              <div><span className="text-purple-400">total_pnl</span> — совокупная прибыль</div>
              <div><span className="text-purple-400">avg_pnl</span> / <span className="text-purple-400">med_pnl</span> — средний/медианный PnL</div>
              <div><span className="text-purple-400">profit_factor</span> — отношение прибыли к убыткам</div>
            </div>
          </div>

          <div>
            <div className="text-orange-400 font-semibold mb-2">⚠️ Риск и стабильность</div>
            <div className="space-y-1 text-gray-300 pl-3">
              <div><span className="text-purple-400">max_drawdown</span> — макс. просадка</div>
              <div><span className="text-purple-400">sharpe_ratio</span> — коэфф. Шарпа</div>
              <div><span className="text-purple-400">max_win_streak</span> — серия побед</div>
            </div>
          </div>

          <div>
            <div className="text-blue-400 font-semibold mb-2">⏱️ Временные метрики</div>
            <div className="space-y-1 text-gray-300 pl-3">
              <div><span className="text-purple-400">avg_duration</span> — средняя длительность сделки</div>
              <div><span className="text-purple-400">pnl_per_day</span> / <span className="text-purple-400">month</span> / <span className="text-purple-400">year</span></div>
              <div><span className="text-purple-400">trades_per_day</span> — частота торговли</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunningView({
  infoMessages,
  currentPhase,
  elapsedTime,
  formatTime,
  progress,
  isRunning,
}: {
  infoMessages: string[];
  currentPhase: string;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
  progress: number;
  isRunning: boolean;
}) {
  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-xs text-cyan-400 mb-1">Current Phase</div>
          <div className="text-lg font-bold text-white">{currentPhase}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-xs text-blue-400 mb-1">Elapsed Time</div>
          <div className="text-lg font-bold text-white font-mono">{formatTime(elapsedTime)}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs text-cyan-400 font-semibold">{progress}%</span>
        </div>
        <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-gray-700/50">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Loader Animation */}
      {isRunning && (
        <div className="mb-6 flex items-center justify-center py-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl">🧪</div>
            </div>
          </div>
        </div>
      )}

      {/* System Messages */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">System Messages</h3>
        {infoMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-sm">Waiting for updates...</p>
          </div>
        ) : (
          infoMessages.map((msg, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-4 animate-slideIn"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{msg.includes('✅') ? '✅' : msg.includes('⚠️') ? '⚠️' : 'ℹ️'}</span>
                <p className="text-gray-300 text-sm flex-1">{msg}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function ResultsView({
  completedBacktest,
  handleDownload,
  setShowDetailsModal,
}: {
  completedBacktest: CompletedBacktest;
  handleDownload: () => void;
  setShowDetailsModal: (show: boolean) => void;
}) {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400">Performance Overview</h3>
          <div className="text-xs text-gray-500">
            Backtest ID: {completedBacktest.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-xs text-green-400 mb-1">Total PnL</div>
          <div className={`text-2xl font-bold ${completedBacktest.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {completedBacktest.total_pnl >= 0 ? '+' : ''}{completedBacktest.total_pnl.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-xs text-blue-400 mb-1">Winrate</div>
          <div className="text-2xl font-bold text-white">
            {(completedBacktest.winrate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="text-xs text-purple-400 mb-1">Total Trades</div>
          <div className="text-xl font-bold text-white">
            {Math.round(completedBacktest.n_trades)}
            <span className="text-sm text-gray-400 ml-2">
              ({Math.round(completedBacktest.n_wins)}W/{Math.round(completedBacktest.n_losses)}L)
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="text-xs text-orange-400 mb-1">Sharpe Ratio</div>
          <div className="text-xl font-bold text-white">
            {completedBacktest.sharpe_ratio.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <span className="text-sm text-gray-400">Max Drawdown</span>
          <span className="text-sm font-semibold text-red-400">
            {completedBacktest.max_drawdown.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <span className="text-sm text-gray-400">Profit Factor</span>
          <span className="text-sm font-semibold text-cyan-400">
            {completedBacktest.profit_factor.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]"
        >
          📥 Download Results
        </button>
        <button
          onClick={() => setShowDetailsModal(true)}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]"
        >
          🔍 View Details
        </button>
      </div>

      {/* Analytics - list all metrics */}
      {completedBacktest.analytics && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Analytics (all metrics)</h3>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(completedBacktest.analytics)
                .filter(([key]) => key !== 'trade_type_analysis' && key !== 'trades')
                .map(([key, value]) => {
                  const LABELS: Record<string, string> = {
                    // Basic
                    n_trades: 'Total Trades',
                    n_wins: 'Winning Trades',
                    n_losses: 'Losing Trades',
                    winrate: 'Win Rate',
                    // PnL
                    total_pnl: 'Total PnL (%)',
                    avg_pnl: 'Average PnL (%)',
                    med_pnl: 'Median PnL (%)',
                    std_pnl: 'PnL Std Dev',
                    max_profit: 'Max Profit (%)',
                    max_loss: 'Max Loss (%)',
                    gross_profit: 'Gross Profit (%)',
                    gross_loss: 'Gross Loss (%)',
                    profit_factor: 'Profit Factor',
                    avg_win: 'Average Win (%)',
                    avg_loss: 'Average Loss (%)',
                    // Risk
                    max_drawdown: 'Max Drawdown (%)',
                    sharpe_ratio: 'Sharpe Ratio',
                    max_win_streak: 'Max Win Streak',
                    max_loss_streak: 'Max Loss Streak',
                    // Time
                    avg_duration: 'Avg Trade Duration (min)',
                    max_duration: 'Max Trade Duration (min)',
                    min_duration: 'Min Trade Duration (min)',
                    pnl_per_day: 'PnL per Day (%)',
                    pnl_per_month: 'PnL per Month (%)',
                    pnl_per_year: 'PnL per Year (%)',
                    trades_per_day: 'Trades per Day',
                  };
                  const label = LABELS[key] ?? key;
                  const displayValue = typeof value === 'number'
                    ? (['n_trades','n_wins','n_losses'].includes(key) ? String(Math.round(value)) : value.toFixed(4))
                    : typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value);
                  return (
                    <div key={key} className="flex justify-between items-center py-1 border-b border-gray-800/60">
                      <span className="text-gray-400 mr-3 break-all">{label}</span>
                      <span className="text-gray-200 font-mono break-all truncate max-w-[60%]">{displayValue}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
