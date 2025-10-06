'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';

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
  bars?: Array<Record<string, unknown>>;
}

export default function BacktestDetailsModal({
  isOpen,
  onClose,
  backtestId,
  strategyName,
  bars
}: BacktestDetailsModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'bars' | 'code'>('results');
  const [strategyCode, setStrategyCode] = useState<Record<string, unknown> | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    results: true,
    code: true
  });

  // Bars table state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const barsContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 32; // px, approximate fixed height per row

  // Compute headers and sorted rows at top-level to respect hooks rules
  const headers = useMemo(() => {
    if (!Array.isArray(bars) || bars.length === 0) return [] as string[];
    const first = bars[0] as Record<string, unknown>;
    return Object.keys(first);
  }, [bars]);

  const sortedBars = useMemo(() => {
    if (!Array.isArray(bars) || bars.length === 0) return [] as Array<Record<string, unknown>>;
    if (!sortKey) return bars as Array<Record<string, unknown>>;
    const copy = [...(bars as Array<Record<string, unknown>>)] as Array<Record<string, unknown>>;
    copy.sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === 'asc' ? -1 : 1;
      if (bv == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [bars, sortKey, sortDir]);

  const loadTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('backtest_id', backtestId)
      .order('entry_time', { ascending: true });

    if (error) {
      console.error('Error loading trades:', error);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  };

  const loadStrategyCode = async () => {
    const { data, error } = await supabase
      .from('backtests')
      .select('strategy_code')
      .eq('id', backtestId)
      .single();

    if (error) {
      console.error('Error loading strategy code:', error);
    } else {
      setStrategyCode(data?.strategy_code || null);
    }
  };

  useEffect(() => {
    if (isOpen && backtestId) {
      loadTrades();
      loadStrategyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, backtestId]);

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
    if (!downloadOptions.results && !downloadOptions.code) {
      alert('Выберите хотя бы один файл для скачивания');
      return;
    }

    try {
      const zip = new JSZip();

    // Add results CSV
    if (downloadOptions.results && trades.length > 0) {
      const csvHeader = 'Date,Time,Entry Price,Exit Price,Change %,Signal,Side,PnL,Duration (min)\n';
      const csvRows = trades.map(trade => {
        const priceChange = (((trade.exit_price - trade.entry_price) / trade.entry_price) * 100).toFixed(2);
        return `${formatDate(trade.entry_time)},${formatTime(trade.entry_time)},${trade.entry_price},${trade.exit_price},${priceChange},SMIIO ${trade.side.toUpperCase()},${trade.side},${trade.pnl},${trade.duration_minutes}`;
      }).join('\n');
      zip.file('results.csv', csvHeader + csvRows);
    }

    // Add strategy code JSON
    if (downloadOptions.code && strategyCode) {
      zip.file('strategy.json', JSON.stringify(strategyCode, null, 2));
    }

      // Generate and download zip
      const blob = await zip.generateAsync({ type: 'blob' });
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
      alert('Ошибка при создании архива. Попробуйте снова.');
    }
  };

  if (!isOpen) return null;

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
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              📊 Результаты
            </button>
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
          {activeTab === 'results' ? (
            <>
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  Загрузка данных...
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Нет данных о сделках для этого бэктеста
                </div>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Дата</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Время (Msk)</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Цена входа</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Цена выхода</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Изменение %</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Сигнал</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Зона</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F1</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F2</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F3</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F4</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">TF SUM</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">1Ч-2Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">2Ч-3Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">3Ч-4Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">4Ч-1Н</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">PnL</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Длительность</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => {
                    const flags = getMockFlags(trade.id, index);
                    const tfSum = flags.f1 + flags.f2 + flags.f3 + flags.f4;
                    const priceChange = calculatePriceChange(trade.entry_price, trade.exit_price);
                    const zone = getZone(trade.side);
                    const zoneColor = trade.side === 'long' ? 'bg-green-900/40' : 'bg-red-900/40';

                    return (
                      <tr key={trade.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {formatDate(trade.entry_time)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {formatTime(trade.entry_time)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          ${trade.entry_price.toFixed(2)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          ${trade.exit_price.toFixed(2)}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          parseFloat(priceChange) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {priceChange}%
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {getSignal(trade.side, index)}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-white text-sm font-semibold ${zoneColor}`}>
                          {zone}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f1}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f2}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f3}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f4}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          tfSum > 0 ? 'text-green-400' : tfSum < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {tfSum}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf1}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf2}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf3}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf4}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${trade.pnl.toFixed(2)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {trade.duration_minutes.toFixed(0)} мин
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              )}
            </>
          ) : activeTab === 'bars' ? (
            <>
              {!bars || bars.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Нет данных bars для этого бэктеста</div>
              ) : (
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
              )}
            </>
          ) : (
            /* Strategy Code Tab */
            <div>
              {strategyCode ? (
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-300 font-mono border border-gray-700/50 max-h-[calc(100vh-300px)]">
                  {JSON.stringify(strategyCode, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">📝</p>
                  <p>Код стратегии не сохранён для этого бэктеста</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        {activeTab === 'results' && trades.length > 0 && (
          <div className="px-6 pb-4 border-t border-gray-700/50">
            <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">📊 Сводка по сделкам</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total PnL */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Общий PnL</div>
                  <div className={`text-lg font-bold ${
                    trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
                  </div>
                </div>

                {/* Winrate */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Winrate</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {trades.filter(t => t.pnl > 0).length}W / {trades.filter(t => t.pnl <= 0).length}L
                  </div>
                </div>

                {/* Avg Win / Avg Loss */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Avg Win / Loss</div>
                  <div className="text-sm">
                    <span className="text-green-400 font-semibold">
                      ${(trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) /
                        (trades.filter(t => t.pnl > 0).length || 1)).toFixed(2)}
                    </span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400 font-semibold">
                      ${Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) /
                        (trades.filter(t => t.pnl <= 0).length || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Profit Factor</div>
                  <div className="text-lg font-bold text-purple-400">
                    {(trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) /
                      Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) || 1)).toFixed(2)}
                  </div>
                </div>

                {/* Best Trade */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Лучшая сделка</div>
                  <div className="text-lg font-bold text-green-400">
                    ${Math.max(...trades.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>

                {/* Worst Trade */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Худшая сделка</div>
                  <div className="text-lg font-bold text-red-400">
                    ${Math.min(...trades.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>

                {/* Avg Duration */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Средняя длительность</div>
                  <div className="text-lg font-bold text-blue-400">
                    {(trades.reduce((sum, t) => sum + t.duration_minutes, 0) / trades.length).toFixed(0)} мин
                  </div>
                </div>

                {/* Long vs Short */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Long / Short</div>
                  <div className="text-sm">
                    <span className="text-green-400 font-semibold">
                      {trades.filter(t => t.side === 'long').length}L
                    </span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400 font-semibold">
                      {trades.filter(t => t.side === 'short').length}S
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Long WR: {trades.filter(t => t.side === 'long').length > 0
                      ? ((trades.filter(t => t.side === 'long' && t.pnl > 0).length /
                          trades.filter(t => t.side === 'long').length) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Всего сделок: <span className="text-white font-semibold">{trades.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Download button with dropdown */}
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
                <div className="absolute right-0 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[280px] p-4">
                  <div className="mb-3">
                    <div className="text-white font-semibold mb-2">Что скачать?</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={downloadOptions.results}
                          onChange={(e) => setDownloadOptions(prev => ({ ...prev, results: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="text-gray-300 text-sm">📊 Результаты (CSV)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={downloadOptions.code}
                          onChange={(e) => setDownloadOptions(prev => ({ ...prev, code: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="text-gray-300 text-sm">💻 Код стратегии (JSON)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-700">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Скачать ZIP
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

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';

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
}

export default function BacktestDetailsModal({
  isOpen,
  onClose,
  backtestId,
  strategyName
}: BacktestDetailsModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'code'>('results');
  const [strategyCode, setStrategyCode] = useState<Record<string, unknown> | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    results: true,
    code: true
  });

  const loadTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('backtest_id', backtestId)
      .order('entry_time', { ascending: true });

    if (error) {
      console.error('Error loading trades:', error);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  };

  const loadStrategyCode = async () => {
    const { data, error } = await supabase
      .from('backtests')
      .select('strategy_code')
      .eq('id', backtestId)
      .single();

    if (error) {
      console.error('Error loading strategy code:', error);
    } else {
      setStrategyCode(data?.strategy_code || null);
    }
  };

  useEffect(() => {
    if (isOpen && backtestId) {
      loadTrades();
      loadStrategyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, backtestId]);

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
    if (!downloadOptions.results && !downloadOptions.code) {
      alert('Выберите хотя бы один файл для скачивания');
      return;
    }

    try {
      const zip = new JSZip();

    // Add results CSV
    if (downloadOptions.results && trades.length > 0) {
      const csvHeader = 'Date,Time,Entry Price,Exit Price,Change %,Signal,Side,PnL,Duration (min)\n';
      const csvRows = trades.map(trade => {
        const priceChange = (((trade.exit_price - trade.entry_price) / trade.entry_price) * 100).toFixed(2);
        return `${formatDate(trade.entry_time)},${formatTime(trade.entry_time)},${trade.entry_price},${trade.exit_price},${priceChange},SMIIO ${trade.side.toUpperCase()},${trade.side},${trade.pnl},${trade.duration_minutes}`;
      }).join('\n');
      zip.file('results.csv', csvHeader + csvRows);
    }

    // Add strategy code JSON
    if (downloadOptions.code && strategyCode) {
      zip.file('strategy.json', JSON.stringify(strategyCode, null, 2));
    }

      // Generate and download zip
      const blob = await zip.generateAsync({ type: 'blob' });
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
      alert('Ошибка при создании архива. Попробуйте снова.');
    }
  };

  if (!isOpen) return null;

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
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              📊 Результаты
            </button>
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
          {activeTab === 'results' ? (
            <>
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  Загрузка данных...
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Нет данных о сделках для этого бэктеста
                </div>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Дата</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Время (Msk)</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Цена входа</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Цена выхода</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Изменение %</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Сигнал</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Зона</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F1</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F2</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F3</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">F4</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">TF SUM</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">1Ч-2Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">2Ч-3Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">3Ч-4Д</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">4Ч-1Н</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">PnL</th>
                    <th className="border border-gray-600 px-3 py-2 text-white text-sm font-semibold">Длительность</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => {
                    const flags = getMockFlags(trade.id, index);
                    const tfSum = flags.f1 + flags.f2 + flags.f3 + flags.f4;
                    const priceChange = calculatePriceChange(trade.entry_price, trade.exit_price);
                    const zone = getZone(trade.side);
                    const zoneColor = trade.side === 'long' ? 'bg-green-900/40' : 'bg-red-900/40';

                    return (
                      <tr key={trade.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {formatDate(trade.entry_time)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {formatTime(trade.entry_time)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          ${trade.entry_price.toFixed(2)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          ${trade.exit_price.toFixed(2)}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          parseFloat(priceChange) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {priceChange}%
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {getSignal(trade.side, index)}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-white text-sm font-semibold ${zoneColor}`}>
                          {zone}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f1}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f2}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f3}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.f4}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          tfSum > 0 ? 'text-green-400' : tfSum < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {tfSum}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf1}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf2}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf3}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {flags.tf4}
                        </td>
                        <td className={`border border-gray-600 px-3 py-2 text-center text-sm font-semibold ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${trade.pnl.toFixed(2)}
                        </td>
                        <td className="border border-gray-600 px-3 py-2 text-center text-gray-300 text-sm">
                          {trade.duration_minutes.toFixed(0)} мин
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              )}
            </>
          ) : (
            /* Strategy Code Tab */
            <div>
              {strategyCode ? (
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-300 font-mono border border-gray-700/50 max-h-[calc(100vh-300px)]">
                  {JSON.stringify(strategyCode, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">📝</p>
                  <p>Код стратегии не сохранён для этого бэктеста</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        {activeTab === 'results' && trades.length > 0 && (
          <div className="px-6 pb-4 border-t border-gray-700/50">
            <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">📊 Сводка по сделкам</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total PnL */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Общий PnL</div>
                  <div className={`text-lg font-bold ${
                    trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
                  </div>
                </div>

                {/* Winrate */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Winrate</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {trades.filter(t => t.pnl > 0).length}W / {trades.filter(t => t.pnl <= 0).length}L
                  </div>
                </div>

                {/* Avg Win / Avg Loss */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Avg Win / Loss</div>
                  <div className="text-sm">
                    <span className="text-green-400 font-semibold">
                      ${(trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) /
                        (trades.filter(t => t.pnl > 0).length || 1)).toFixed(2)}
                    </span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400 font-semibold">
                      ${Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) /
                        (trades.filter(t => t.pnl <= 0).length || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Profit Factor</div>
                  <div className="text-lg font-bold text-purple-400">
                    {(trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) /
                      Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) || 1)).toFixed(2)}
                  </div>
                </div>

                {/* Best Trade */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Лучшая сделка</div>
                  <div className="text-lg font-bold text-green-400">
                    ${Math.max(...trades.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>

                {/* Worst Trade */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Худшая сделка</div>
                  <div className="text-lg font-bold text-red-400">
                    ${Math.min(...trades.map(t => t.pnl)).toFixed(2)}
                  </div>
                </div>

                {/* Avg Duration */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Средняя длительность</div>
                  <div className="text-lg font-bold text-blue-400">
                    {(trades.reduce((sum, t) => sum + t.duration_minutes, 0) / trades.length).toFixed(0)} мин
                  </div>
                </div>

                {/* Long vs Short */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Long / Short</div>
                  <div className="text-sm">
                    <span className="text-green-400 font-semibold">
                      {trades.filter(t => t.side === 'long').length}L
                    </span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400 font-semibold">
                      {trades.filter(t => t.side === 'short').length}S
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Long WR: {trades.filter(t => t.side === 'long').length > 0
                      ? ((trades.filter(t => t.side === 'long' && t.pnl > 0).length /
                          trades.filter(t => t.side === 'long').length) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Всего сделок: <span className="text-white font-semibold">{trades.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Download button with dropdown */}
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
                <div className="absolute right-0 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[280px] p-4">
                  <div className="mb-3">
                    <div className="text-white font-semibold mb-2">Что скачать?</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={downloadOptions.results}
                          onChange={(e) => setDownloadOptions(prev => ({ ...prev, results: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="text-gray-300 text-sm">📊 Результаты (CSV)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={downloadOptions.code}
                          onChange={(e) => setDownloadOptions(prev => ({ ...prev, code: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                        />
                        <span className="text-gray-300 text-sm">💻 Код стратегии (JSON)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-700">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Скачать ZIP
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
