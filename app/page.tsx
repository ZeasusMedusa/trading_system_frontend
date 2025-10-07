'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BacktestDetailsModal from './components/BacktestDetailsModal';
import { useAuth } from './providers/AuthProvider';
import { api } from '@/lib/api';
import type { StrategyListItem } from '@/lib/api/endpoints/strategy';

interface Backtest {
  id: string;
  created_at: string;
  strategy_id: string;
  job_id: string;
  status: string;
  n_trades: number;
  n_wins: number;
  n_losses: number;
  winrate: number;
  total_pnl: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  strategies: {
    name: string;
  };
  // Additional fields for saved strategies
  isSaved?: boolean;
  source?: 'local' | 'server';
  description?: string;
  metrics?: Record<string, unknown>;
  config?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  strategy_type?: 'single' | 'dual';
  bars?: Array<Record<string, unknown>>;
  bars_buy?: Array<Record<string, unknown>>;
  bars_sell?: Array<Record<string, unknown>>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [filteredBacktests, setFilteredBacktests] = useState<Backtest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'winrate' | 'sharpe' | 'pnl'>('date');
  const [filterProfitable, setFilterProfitable] = useState<'all' | 'profitable' | 'unprofitable'>('all');
  const [selectedBacktest, setSelectedBacktest] = useState<Backtest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [dots, setDots] = useState('');
  const [savedStrategies, setSavedStrategies] = useState<StrategyListItem[]>([]);

  useEffect(() => {
    loadBacktests();
    loadSavedStrategies();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backtests, savedStrategies, searchQuery, sortBy, filterProfitable]);

  // Typewriter effect for title
  useEffect(() => {
    const fullText = '📊 SMIIO Backtest Platform';
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Restart animation after 45 seconds
        setTimeout(() => {
          currentIndex = 0;
          setDisplayedText('');
          setDots('');
          const restartInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
              setDisplayedText(fullText.slice(0, currentIndex));
              currentIndex++;
            } else {
              clearInterval(restartInterval);
            }
          }, 100);
        }, 45000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, []);

  // Dots animation after typing is complete
  useEffect(() => {
    const dotsSequence = ['', '.', '..', '.', ''];
    let dotIndex = 0;

    const dotsInterval = setInterval(() => {
      if (displayedText === '📊 SMIIO Backtest Platform') {
        setDots(dotsSequence[dotIndex]);
        dotIndex = (dotIndex + 1) % dotsSequence.length;
      }
    }, 500);

    return () => clearInterval(dotsInterval);
  }, [displayedText]);

  const loadBacktests = async () => {
    try {
      const { data, error } = await supabase
        .from('backtests')
        .select(`
          *,
          strategies (
            name
          )
        `)
        .eq('status', 'finished')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setBacktests(data || []);
    } catch (err) {
      console.error('Error loading backtests:', err);
    } finally {
      setLoading(false);
    }
  };


  const loadSavedStrategies = async () => {
    try {
      const strategies = await api.strategy.listStrategies();
      setSavedStrategies(strategies);
    } catch (error) {
      console.error('Error loading saved strategies:', error);
    }
  };


  const deleteBacktest = async (backtestId: string, isSaved?: boolean, source?: 'local' | 'server') => {
    if (!confirm('Вы уверены что хотите удалить этот бэктест? Это действие нельзя отменить.')) {
      return;
    }

    try {
      // Check if this is a saved strategy
      if (isSaved && source === 'local') {
        // Delete from server API
        await api.strategy.deleteStrategy(Number(backtestId));
        // Reload saved strategies
        await loadSavedStrategies();
        console.log('Saved strategy deleted:', backtestId);
      } else {
        // Delete from Supabase
        const { error } = await supabase
          .from('backtests')
          .delete()
          .eq('id', backtestId);

        if (error) {
          throw error;
        }

        // Update local state
        setBacktests(prev => prev.filter(bt => bt.id !== backtestId));
      }
    } catch (err) {
      console.error('Error deleting backtest:', err);
    }
  };

  const applyFilters = () => {
    // Combine server backtests with saved strategies
    const serverBacktests = backtests.map(bt => ({
      ...bt,
      isSaved: false,
      source: 'server' as const
    }));
    
    const savedBacktests = savedStrategies.map(strategy => ({
      id: String(strategy.id),
      created_at: strategy.created_at,
      strategy_id: String(strategy.id),
      job_id: String(strategy.id),
      status: 'finished',
      n_trades: (strategy.metrics as any)?.n_trades || 0,
      n_wins: (strategy.metrics as any)?.n_wins || 0,
      n_losses: (strategy.metrics as any)?.n_losses || 0,
      winrate: (strategy.metrics as any)?.winrate || 0,
      total_pnl: (strategy.metrics as any)?.total_pnl || 0,
      sharpe_ratio: (strategy.metrics as any)?.sharpe_ratio || 0,
      max_drawdown: (strategy.metrics as any)?.max_drawdown || 0,
      profit_factor: (strategy.metrics as any)?.profit_factor || 0,
      folder_ids: [],
      strategies: { name: strategy.name },
      isSaved: true,
      source: 'local' as const,
      description: strategy.description,
      metrics: strategy.metrics,
      config: strategy.config,
      analytics: strategy.metrics, // Pass metrics as analytics for modal
      strategy_type: 'single' as const, // Saved strategies are single by default
    }));
    
    let filtered = [...serverBacktests, ...savedBacktests];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bt =>
        bt.strategies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Profitable filter
    if (filterProfitable === 'profitable') {
      filtered = filtered.filter(bt => (bt.total_pnl || 0) > 0);
    } else if (filterProfitable === 'unprofitable') {
      filtered = filtered.filter(bt => (bt.total_pnl || 0) <= 0);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'winrate':
          return (b.winrate || 0) - (a.winrate || 0);
        case 'sharpe':
          return (b.sharpe_ratio || 0) - (a.sharpe_ratio || 0);
        case 'pnl':
          return (b.total_pnl || 0) - (a.total_pnl || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredBacktests(filtered);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent min-h-[2.5rem]">
                {displayedText}{dots}
                {displayedText !== '📊 SMIIO Backtest Platform' && <span className="animate-pulse">|</span>}
              </h1>
              <p className="text-gray-400 mt-1">Professional Trading Strategy Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Settings Link */}
                  <Link
                    href="/settings"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium text-gray-200 transition-all border border-gray-700 hover:border-gray-600"
                    title="Settings"
                  >
                    ⚙️ Settings
                  </Link>

                  {/* Admin Link - Only for admins */}
                  {user.is_admin && (
                    <Link
                      href="/admin"
                      className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 rounded-lg font-medium text-purple-200 transition-all border border-purple-700 hover:border-purple-600"
                      title="Admin Panel"
                    >
                      👑 Admin
                    </Link>
                  )}

                  {/* User Info & Logout */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-300 text-sm">
                      👤 {user.username}
                    </span>
                    <button
                      onClick={() => {
                        logout();
                        window.location.reload();
                      }}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-800/50 rounded text-red-200 text-sm transition-all border border-red-700 hover:border-red-600"
                    >
                      Logout
                    </button>
                  </div>

                  {/* New Backtest Button */}
                  <Link
                    href="/backtest"
                    className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 border-2 border-cyan-400/50 hover:border-cyan-300 animate-pulse hover:animate-none"
                  >
                    <span className="text-white">🧪 New Backtest 🧑‍🔬</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold text-white transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 border-2 border-green-400/50 hover:border-green-300"
                  >
                    🔐 Login
                  </Link>

                  {/* New Backtest Button (still accessible without login) */}
                  <Link
                    href="/backtest"
                    className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 border-2 border-cyan-400/50 hover:border-cyan-300 animate-pulse hover:animate-none"
                  >
                    <span className="text-white">🧪 New Backtest 🧑‍🔬</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="text-gray-400 text-sm mb-2">Total Backtests</div>
            <div className="text-3xl font-bold text-white">{backtests.length + savedStrategies.length}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-green-500/50 transition-colors">
            <div className="text-gray-400 text-sm mb-2">Avg Winrate</div>
            <div className="text-3xl font-bold text-green-400">
              {(() => {
                const allBacktests = [...backtests, ...savedStrategies.map(s => ({ 
                  winrate: ((s.metrics as any)?.winrate || 0) 
                }))];
                return allBacktests.length > 0
                  ? ((allBacktests.reduce((acc, bt) => acc + (bt.winrate || 0), 0) / allBacktests.length) * 100).toFixed(1)
                  : '0';
              })()}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <div className="text-gray-400 text-sm mb-2">Avg Sharpe</div>
            <div className="text-3xl font-bold text-blue-400">
              {(() => {
                const allBacktests = [...backtests, ...savedStrategies.map(s => ({ 
                  sharpe_ratio: ((s.metrics as any)?.sharpe_ratio || 0) 
                }))];
                return allBacktests.length > 0
                  ? (allBacktests.reduce((acc, bt) => acc + (bt.sharpe_ratio || 0), 0) / allBacktests.length).toFixed(2)
                  : '0.00';
              })()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="text-gray-400 text-sm mb-2">Total Trades</div>
            <div className="text-3xl font-bold text-purple-400">
              {(() => {
                const serverTrades = backtests.reduce((acc, bt) => acc + (bt.n_trades || 0), 0);
                const savedTrades = savedStrategies.reduce((acc, s) => acc + ((s.metrics as any)?.n_trades || 0), 0);
                return (serverTrades + savedTrades).toLocaleString();
              })()}
            </div>
          </div>
        </div>

        {/* Backtests Grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📈 Backtest History</h2>
          <div className="text-sm text-gray-400">
            Showing {filteredBacktests.length} of {backtests.length + savedStrategies.length} backtests
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Search Strategy</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'pnl' | 'winrate' | 'sharpe')}
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="date">Latest First</option>
                  <option value="pnl">Highest P&L</option>
                  <option value="winrate">Best Winrate</option>
                  <option value="sharpe">Best Sharpe Ratio</option>
                </select>
              </div>

              {/* Filter Profitable */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Filter</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterProfitable('all')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterProfitable === 'all'
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterProfitable('profitable')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterProfitable === 'profitable'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    📈 Profit
                  </button>
                  <button
                    onClick={() => setFilterProfitable('unprofitable')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterProfitable === 'unprofitable'
                        ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    📉 Loss
                  </button>
                </div>
              </div>
            </div>
          </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-gray-400">Loading backtests...</p>
          </div>
        ) : filteredBacktests.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 border border-gray-700/50 rounded-xl">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-400">
              {backtests.length === 0
                ? 'No backtests yet. Create your first one!'
                : 'No backtests match your filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBacktests.map((backtest) => (
              <div
                key={backtest.id}
                className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-white">
                        {backtest.strategies?.name || 'Unknown Strategy'}
                      </h3>
                      {backtest.isSaved && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          💾 Saved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(backtest.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {backtest.description && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {backtest.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      (backtest.total_pnl || 0) > 0
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {(backtest.total_pnl || 0) > 0 ? '📈' : '📉'} {(backtest.total_pnl || 0).toFixed(2)}%
                    </div>

                    {/* Actions dropdown */}
                    <div className="relative group/actions">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10 min-w-[200px]">
                        {/* Delete */}
                        <button
                          onClick={() => deleteBacktest(backtest.id, backtest.isSaved, backtest.source)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Trades</div>
                    <div className="text-lg font-bold text-white">{backtest.n_trades || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Winrate</div>
                    <div className={`text-lg font-bold ${
                      (backtest.winrate || 0) > 0.5 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {((backtest.winrate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Sharpe</div>
                    <div className="text-lg font-bold text-blue-400">
                      {(backtest.sharpe_ratio || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-400">
                      ✓ {backtest.n_wins || 0}
                    </span>
                    <span className="text-red-400">
                      ✗ {backtest.n_losses || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBacktest(backtest);
                      setShowModal(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedBacktest && (
        <BacktestDetailsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedBacktest(null);
          }}
          backtestId={selectedBacktest.id}
          strategyName={selectedBacktest.strategies?.name || 'Unknown Strategy'}
          strategy_type={selectedBacktest.strategy_type}
          bars={selectedBacktest.bars}
          bars_buy={selectedBacktest.bars_buy}
          bars_sell={selectedBacktest.bars_sell}
          isSaved={selectedBacktest.isSaved}
          analytics={selectedBacktest.analytics}
          config={selectedBacktest.config}
        />
      )}
    </main>
  );
}
