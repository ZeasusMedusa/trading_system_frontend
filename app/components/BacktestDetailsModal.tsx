'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '@/lib/api';

interface Trade {
  id: string;
  trade_number: number;
  entry_time: string;
  entry_price: number;
  exit_time: string;
  exit_price: number;
  side: string;
  pnl: number;
  duration_minutes: number;
}

interface BacktestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backtestId: string;
  strategyName: string;
  strategy_type?: 'single' | 'dual';
  bars?: Array<Record<string, unknown>>;
  bars_buy?: Array<Record<string, unknown>>;
  bars_sell?: Array<Record<string, unknown>>;
  isSaved?: boolean;
  analytics?: Record<string, unknown>;
  config?: Record<string, unknown>; // Strategy config for saved strategies
}

export default function BacktestDetailsModal({
  isOpen,
  onClose,
  backtestId,
  strategyName,
  strategy_type = 'single',
  bars,
  bars_buy,
  bars_sell,
  isSaved = false,
  analytics,
  config
}: BacktestDetailsModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bars' | 'bars_buy' | 'bars_sell' | 'code' | 'metrics'>(
    'metrics' // Always default to metrics tab
  );
  const [strategyCode, setStrategyCode] = useState<Record<string, unknown> | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCache, setDownloadCache] = useState<Map<string, Blob>>(new Map());

  // Debug props on mount
  useEffect(() => {
    if (isOpen) {
      console.log('BacktestDetailsModal opened with props:', {
        backtestId,
        strategyName,
        strategy_type,
        isSaved,
        bars_count: bars?.length || 0,
        bars_buy_count: bars_buy?.length || 0,
        bars_sell_count: bars_sell?.length || 0,
        analytics_keys: analytics ? Object.keys(analytics) : []
      });
    }
  }, [isOpen, backtestId, strategyName, strategy_type, isSaved, bars, bars_buy, bars_sell, analytics]);

  // Clear cache when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDownloadCache(new Map());
    }
  }, [isOpen]);

  // Bars table state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const barsContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 32; // px, approximate fixed height per row

  // Compute headers and sorted rows at top-level to respect hooks rules
  const headers = useMemo(() => {
    const dataset = activeTab === 'bars_buy' ? bars_buy : activeTab === 'bars_sell' ? bars_sell : bars;
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return [] as string[];
    }
    const first = dataset[0] as Record<string, unknown>;
    return Object.keys(first);
  }, [activeTab, bars, bars_buy, bars_sell]);

  const sortedBars = useMemo(() => {
    const dataset = activeTab === 'bars_buy' ? bars_buy : activeTab === 'bars_sell' ? bars_sell : bars;
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return [] as Array<Record<string, unknown>>;
    }
    if (!sortKey) {
      return dataset as Array<Record<string, unknown>>;
    }
    const copy = [...(dataset as Array<Record<string, unknown>>)] as Array<Record<string, unknown>>;
    copy.sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) {
        return 0;
      }
      if (av == null) {
        return sortDir === 'asc' ? -1 : 1;
      }
      if (bv == null) {
        return sortDir === 'asc' ? 1 : -1;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [activeTab, bars, bars_buy, bars_sell, sortKey, sortDir]);

  const loadTrades = async () => {
    // Trades are not loaded from database anymore
    // All data comes from backtest results (analytics)
    setLoading(false);
    setTrades([]);
  };

  const loadStrategyCode = async () => {
    // If config is provided via props, use it directly
    if (config) {
      setStrategyCode(config);
      return;
    }
    
    // Strategy code should be provided via props
    setStrategyCode(null);
  };

  useEffect(() => {
    if (isOpen && backtestId) {
      loadTrades();
      loadStrategyCode();
      // Debug log
      console.log('Modal props:', { strategy_type, bars, bars_buy, bars_sell, isSaved });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, backtestId, strategy_type, bars, bars_buy, bars_sell, isSaved]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const calculatePriceChange = (entryPrice: number, exitPrice: number) => {
    return (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);
  };

  const getSignal = (side: string, index: number) => {
    return side === 'long' ? `SMIIO LN-${String(index + 1).padStart(4, '0')}` : `SMIIO SH-${String(index + 1).padStart(4, '0')}`;
  };

  const getZone = (side: string) => {
    return side === 'long' ? 'LONG ZONE' : 'SHORT ZONE';
  };

  // Generate stable mock data based on trade ID (would come from strategy execution in real system)
  const getMockFlags = (tradeId: string, index: number) => {
    // Simple hash function to generate stable values from ID
    const hash = (str: string, seed: number) => {
      let h = seed;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      }
      return Math.abs(h);
    };

    const h = hash(tradeId, index);
    return {
      f1: (h % 2) === 0 ? 1 : -1,
      f2: ((h >> 1) % 2) === 0 ? 1 : -1,
      f3: ((h >> 2) % 2) === 0 ? 1 : -1,
      f4: ((h >> 3) % 2) === 0 ? 1 : -1,
      tf1: ((h >> 4) % 2) === 0 ? '↑' : '↓',
      tf2: ((h >> 5) % 2) === 0 ? '↑' : '↓',
      tf3: ((h >> 6) % 2) === 0 ? '↑' : '↓',
      tf4: ((h >> 7) % 2) === 0 ? '↑' : '↓',
    };
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // For saved strategies, we can't download from server
      if (isSaved) {
        alert('Скачивание доступно только для стратегий, запущенных на сервере. Для сохраненных стратегий данные уже есть локально.');
        setIsDownloading(false);
        setShowDownloadMenu(false);
        return;
      }
      
      // Check cache first
      const cachedBlob = downloadCache.get(backtestId);
      
      let blob: Blob;
      if (cachedBlob) {
        console.log('Using cached download for', backtestId);
        blob = cachedBlob;
      } else {
        console.log('Downloading from server for', backtestId);
        // Use server endpoint to download ZIP file
        blob = await api.backtest.downloadResults(backtestId);
        
        // Cache the blob
        setDownloadCache(prev => new Map(prev).set(backtestId, blob));
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtest_${strategyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Download error:', error);
      alert('Ошибка при скачивании. Попробуйте снова.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-[95vw] max-h-[90vh] w-full overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Результаты бэктеста</h2>
              <p className="text-gray-400 mt-1">{strategyName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {/* Metrics tab - always available */}
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              📊 Metrics
            </button>
            
            {/* Show Bars tabs only for non-saved strategies (they have bars data) */}
            {!isSaved && strategy_type === 'single' && (
              <button
                onClick={() => setActiveTab('bars')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'bars'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📈 Bars
              </button>
            )}
            {!isSaved && strategy_type === 'dual' && (
              <>
                <button
                  onClick={() => setActiveTab('bars')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'bars'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  📊 Объединённые данные
                </button>
                <button
                  onClick={() => setActiveTab('bars_buy')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'bars_buy'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  📈 BUY данные
                </button>
                <button
                  onClick={() => setActiveTab('bars_sell')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'bars_sell'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  📈 SELL данные
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              💻 Код стратегии
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'metrics' ? (
            /* Metrics Tab - show analytics */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics && Object.entries(analytics)
                .filter(([key]) => key !== 'trades' && key !== 'trade_type_analysis') // Exclude trades and trade_type_analysis
                .map(([key, value]) => (
                <div key={key} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </div>
                </div>
              ))}
              {(!analytics || Object.keys(analytics).filter(k => k !== 'trades' && k !== 'trade_type_analysis').length === 0) && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">📊</p>
                  <p>Нет метрик для отображения</p>
                </div>
              )}
            </div>
          ) : activeTab === 'bars' || activeTab === 'bars_buy' || activeTab === 'bars_sell' ? (
            <>
              {(() => {
                const dataset = activeTab === 'bars_buy' ? bars_buy : activeTab === 'bars_sell' ? bars_sell : bars;
                console.log('Dataset for tab', activeTab, ':', dataset); // Debug log
                if (!dataset || dataset.length === 0) {
                  return <div className="text-center py-12 text-gray-400">Нет данных для выбранной вкладки ({activeTab})</div>;
                }
                console.log(`Rendering ${dataset.length} records for tab ${activeTab}`); // Debug log
                return (
                <div>
                  <div className="mb-3 text-sm text-gray-400">
                    Показано записей: <span className="text-white font-semibold">{dataset.length}</span>
                  </div>
                  <div
                    className="overflow-auto overflow-x-auto"
                    ref={barsContainerRef}
                    onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
                    style={{ maxHeight: '60vh' }}
                  >
                  <table className="min-w-full border-collapse text-xs">
                    <thead className="bg-gray-800 sticky top-0 z-10">
                      <tr>
                        {headers.map((h) => (
                          <th
                            key={h}
                            onClick={() => {
                              if (sortKey === h) {
                                setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortKey(h);
                                setSortDir('asc');
                              }
                            }}
                            className="border border-gray-700 px-3 py-2 text-left text-white font-semibold whitespace-nowrap select-none cursor-pointer sticky top-0 bg-gray-800"
                          >
                            <span className="inline-flex items-center gap-1">
                              {h.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              {sortKey === h ? (
                                <span className="text-gray-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                              ) : null}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const containerHeight = barsContainerRef.current?.clientHeight || 0;
                        const visibleCount = Math.max(20, Math.ceil(containerHeight / rowHeight) + 10);
                        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
                        const endIndex = Math.min(sortedBars.length, startIndex + visibleCount);
                        const topPad = startIndex * rowHeight;
                        const bottomPad = (sortedBars.length - endIndex) * rowHeight;

                        return (
                          <>
                            {topPad > 0 && (
                              <tr style={{ height: `${topPad}px` }}><td colSpan={headers.length} /></tr>
                            )}
                            {sortedBars.slice(startIndex, endIndex).map((row, idx) => {
                              const r = row as Record<string, unknown>;
                              const rowIndex = startIndex + idx;
                              return (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-900/30' : ''} style={{ height: `${rowHeight}px` }}>
                                  {headers.map((h) => {
                                    const v = r[h];
                                    let text: string;
                                    if (typeof v === 'number') {
                                      text = Number.isInteger(v) ? String(v) : v.toFixed(4);
                                    } else if (typeof v === 'string') {
                                      text = v;
                                    } else if (v == null) {
                                      text = '';
                                    } else {
                                      text = JSON.stringify(v);
                                    }
                                    return (
                                      <td key={h} className="border border-gray-800 px-3 py-2 text-gray-200 whitespace-nowrap max-w-[280px] truncate font-mono">
                                        {text}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                            {bottomPad > 0 && (
                              <tr style={{ height: `${bottomPad}px` }}><td colSpan={headers.length} /></tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                  </div>
                </div>
                );
              })()}
            </>
          ) : (
            /* Strategy Code Tab */
            <div>
              {strategyCode ? (
                <>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(strategyCode, null, 2));
                        alert('Код скопирован в буфер обмена!');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      📋 Скопировать
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(strategyCode, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `strategy_${strategyName.replace(/\s+/g, '_')}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      💾 Скачать JSON
                    </button>
                  </div>
                  <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-300 font-mono border border-gray-700/50 max-h-[calc(100vh-300px)]">
                    {JSON.stringify(strategyCode, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">📝</p>
                  <p>Код стратегии не сохранён для этого бэктеста</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Removed analytics summary tied to Results tab */}

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Всего сделок: <span className="text-white font-semibold">{(analytics as any)?.n_trades || trades.length || 0}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Download button with dropdown - only for server backtests */}
            {!isSaved && (
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать
                </button>

              {/* Download menu */}
              {showDownloadMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[200px] p-4">
                  <div className="mb-3">
                    <div className="text-white font-semibold mb-2">Скачать результаты</div>
                    <div className="text-gray-300 text-sm">
                      {strategy_type === 'dual' 
                        ? 'ZIP содержит: bars.csv, bars_buy.csv, bars_sell.csv, buy_positions.csv, sell_positions.csv, analytics.json, strategy_info.json'
                        : 'ZIP содержит: bars.csv, analytics.json, strategy_info.json'
                      }
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-700">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                        isDownloading
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isDownloading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          Скачивание...
                        </span>
                      ) : (
                        'Скачать ZIP'
                      )}
                    </button>
                    <button
                      onClick={() => setShowDownloadMenu(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
