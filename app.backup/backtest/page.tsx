// backup placeholder created before further edits
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BacktestDetailsModal from '../components/BacktestDetailsModal';
import JSZip from 'jszip';

export default function BacktestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Idle');
  const [strategyName, setStrategyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  interface CompletedBacktest {
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
  }
  const [completedBacktest, setCompletedBacktest] = useState<CompletedBacktest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    results: true,
    code: true,
  });
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [strategyCode, setStrategyCode] = useState('');

  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> Backtest environment initialized...',
    '> Waiting for configuration...',
  ]);
  const [infoMessages, setInfoMessages] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Typewriter animation for title
  useEffect(() => {
    const fullText = '🧪 New Backtest Session 🧑‍🔬';
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Restart after 45 seconds
        setTimeout(() => {
          currentIndex = 0;
          setDisplayedText('');
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

  // Cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      if (infoPanelRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = infoPanelRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && scrollTop > 200);
      }
    };

    const panel = infoPanelRef.current;
    if (panel) {
      panel.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (panel) {
        panel.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => [...prev, line]);
  };

  const addInfoMessage = (message: string) => {
    setInfoMessages(prev => [...prev, message]);
  };

  const scrollToBottom = () => {
    if (infoPanelRef.current) {
      infoPanelRef.current.scrollTo({
        top: infoPanelRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));

    if (jsonFile) {
      await loadJsonFile(jsonFile);
    } else {
      addTerminalLine('> ⚠️ Please drop a .json file');
    }
  };

  const loadJsonFile = async (file: File) => {
    const text = await file.text();
    try {
      // Validate JSON
      const parsed = JSON.parse(text);
      setStrategyCode(JSON.stringify(parsed, null, 2));

      // Auto-fill strategy name if available
      if (parsed.name && !strategyName) {
        setStrategyName(parsed.name);
      }

      addTerminalLine(`> ✅ Loaded strategy from: ${file.name}`);
    } catch {
      addTerminalLine(`> ❌ Invalid JSON file: ${file.name}`);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      await loadJsonFile(file);
    } else if (file) {
      addTerminalLine('> ⚠️ Please select a .json file');
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDownload = async () => {
    if (!completedBacktest) return;

    const zip = new JSZip();

    // Fetch trades if downloading results
    if (downloadOptions.results) {
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('backtest_id', completedBacktest.id)
        .order('trade_number', { ascending: true });

      if (trades && trades.length > 0) {
        const csvHeader = 'Date,Time,Entry Price,Exit Price,Change %,Signal,Side,PnL,Duration (min)\n';
        const csvRows = trades.map(trade => {
          const entryDate = new Date(trade.entry_time);
          const priceChange = (((trade.exit_price - trade.entry_price) / trade.entry_price) * 100).toFixed(2);
          return `${entryDate.toLocaleDateString()},${entryDate.toLocaleTimeString()},${trade.entry_price},${trade.exit_price},${priceChange},SMIIO ${trade.side.toUpperCase()},${trade.side},${trade.pnl},${trade.duration_minutes}`;
        }).join('\n');
        zip.file('results.csv', csvHeader + csvRows);
      }
    }

    // Add strategy code if selected
    if (downloadOptions.code && completedBacktest.strategy_code) {
      zip.file('strategy.json', JSON.stringify(completedBacktest.strategy_code, null, 2));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stratName = typeof completedBacktest.strategy_code?.name === 'string'
      ? completedBacktest.strategy_code.name
      : 'backtest';
    const date = new Date().toISOString().split('T')[0];
    a.download = `backtest_${stratName.replace(/\s+/g, '_')}_${date}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const simulateBacktest = async () => {
    if (!strategyName || !startDate || !endDate) {
      addTerminalLine('> ERROR: Please fill all configuration fields');
      addInfoMessage('⚠️ Configuration incomplete - fill all fields before running');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    const phases = [
      { name: 'Initializing', progress: 10, logs: ['> Starting backtest engine...', '> Connecting to data sources...'] },
      { name: 'Loading Data', progress: 30, logs: ['> Fetching historical data...', `> Period: ${startDate} to ${endDate}`, '> Processing 15,234 candles...'] },
      { name: 'Running Strategy', progress: 60, logs: ['> Executing strategy logic...', '> Calculating indicators...', '> Generating signals...'] },
      { name: 'Computing Metrics', progress: 85, logs: ['> Computing performance metrics...', '> Calculating Sharpe ratio...', '> Analyzing drawdowns...'] },
      { name: 'Finalizing', progress: 100, logs: ['> Generating report...', '> Backtest completed successfully!', '> Results ready for review'] },
    ];

    for (const phase of phases) {
      setCurrentPhase(phase.name);
      setProgress(phase.progress);

      for (const log of phase.logs) {
        addTerminalLine(log);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      addInfoMessage(`✅ ${phase.name} completed`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    setCurrentPhase('Completed');
  };

  const createMockBacktest = async () => {
    // Parse strategy code first
    let parsedStrategy: Record<string, unknown>;
    try {
      parsedStrategy = JSON.parse(strategyCode);
    } catch {
      parsedStrategy = { raw: strategyCode };
    }

    // Use strategy name from JSON or form, auto-generate if missing
    const finalStrategyName = strategyName || (typeof parsedStrategy.name === 'string' ? parsedStrategy.name : '') || `Strategy_${Date.now()}`;

    // Auto-generate dates if missing
    const finalEndDate = endDate || new Date().toISOString().split('T')[0];
    const finalStartDate = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    addTerminalLine('> Creating mock backtest with results...');
    if (!strategyName) {
      addTerminalLine(`> Using strategy name from JSON: ${finalStrategyName}`);
    }
    if (!startDate || !endDate) {
      addTerminalLine(`> Using auto-generated dates: ${finalStartDate} to ${finalEndDate}`);
    }

    try {
      // Update parsed strategy with final name
      parsedStrategy.name = finalStrategyName;

      // Create strategy first
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .insert({
          name: finalStrategyName,
          config: parsedStrategy,
          description: (typeof parsedStrategy.description === 'string' ? parsedStrategy.description : '') || 'Mock strategy for testing'
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      // Generate mock results
      const nTrades = Math.floor(Math.random() * 50) + 20;
      const nWins = Math.floor(nTrades * (0.4 + Math.random() * 0.3));
      const nLosses = nTrades - nWins;
      const winrate = nWins / nTrades;
      const totalPnl = (Math.random() - 0.3) * 20;
      const sharpeRatio = (Math.random() * 2) + 0.5;

      // Create backtest
      const { data: backtest, error: backtestError } = await supabase
        .from('backtests')
        .insert({
          strategy_id: strategy.id,
          job_id: `mock_${Date.now()}`,
          status: 'finished',
          n_trades: nTrades,
          n_wins: nWins,
          n_losses: nLosses,
          winrate: winrate,
          total_pnl: totalPnl,
          sharpe_ratio: sharpeRatio,
          max_drawdown: Math.random() * 15 + 5,
          profit_factor: (Math.random() * 2) + 0.8,
          strategy_code: parsedStrategy
        })
        .select()
        .single();

      if (backtestError) throw backtestError;

      // Create mock trades
      const trades = [];
      const startPrice = 45000 + Math.random() * 5000;
      let currentPrice = startPrice;
      const daysDiff = Math.floor((new Date(finalEndDate).getTime() - new Date(finalStartDate).getTime()) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < nTrades; i++) {
        const isWin = i < nWins;
        const side = Math.random() > 0.5 ? 'long' : 'short';
        const entryPrice = currentPrice;
        const priceChange = isWin
          ? (0.005 + Math.random() * 0.015) * (side === 'long' ? 1 : -1)
          : -(0.003 + Math.random() * 0.012) * (side === 'long' ? 1 : -1);

        const exitPrice = entryPrice * (1 + priceChange);
        const pnl = (exitPrice - entryPrice) * (side === 'long' ? 1 : -1);

        const hoursOffset = Math.floor((daysDiff * 24 / nTrades) * i) + Math.floor(Math.random() * 4);
        const entryTime = new Date(new Date(finalStartDate).getTime() + hoursOffset * 60 * 60 * 1000);
        const duration = 30 + Math.floor(Math.random() * 300);
        const exitTime = new Date(entryTime.getTime() + duration * 60 * 1000);

        currentPrice = exitPrice;

        trades.push({
          backtest_id: backtest.id,
          trade_number: i + 1,
          entry_time: entryTime.toISOString(),
          entry_price: entryPrice,
          exit_time: exitTime.toISOString(),
          exit_price: exitPrice,
          side: side,
          pnl: pnl,
          duration_minutes: duration
        });
      }

      // Insert trades in batches
      const { error: tradesError } = await supabase
        .from('trades')
        .insert(trades);

      if (tradesError) throw tradesError;

      addTerminalLine(`> ✅ Mock backtest created successfully!`);
      addTerminalLine(`> Backtest ID: ${backtest.id}`);
      addTerminalLine(`> Total trades: ${nTrades}`);
      addTerminalLine(`> Winrate: ${(winrate * 100).toFixed(1)}%`);
      addTerminalLine(`> Total PnL: ${totalPnl.toFixed(2)}%`);
      addTerminalLine('> Results are ready for review →');

      // Set completed backtest data for display
      setCompletedBacktest(backtest);
      setCurrentPhase('Completed');

    } catch (error) {
      console.error('Error creating mock backtest:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLine(`> ❌ ERROR: ${errorMessage}`);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-mono">
                  {displayedText}
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
                </h1>
                <p className="text-sm text-gray-500">Configure and run your trading strategy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                isRunning
                  ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
                  : currentPhase === 'Completed'
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
              }`}>
                ● {isRunning ? 'Running' : currentPhase}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="max-w-[1920px] mx-auto px-6 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)] w-full">

          {/* Left Side - Strategy Editor + Terminal */}
          <div className="flex flex-col gap-4">
            {/* Strategy Code Editor */}
            <div
              className={`flex-1 flex flex-col bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-2xl transition-all ${
                isDragging
                  ? 'border-cyan-500 border-2 shadow-cyan-500/50'
                  : 'border-purple-500/30 shadow-purple-500/20'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-6 py-3 border-b border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-purple-400 font-mono text-sm font-semibold">strategy.json</span>
                </div>
                <button
                  onClick={handleFileSelect}
                  className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
                >
                  <span>📁 Drag & Drop .json file here</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1 overflow-hidden relative flex">
                {/* Line numbers */}
                <div className="w-12 bg-black/30 border-r border-gray-800/50 py-6 px-2 flex-shrink-0 overflow-hidden">
                  {strategyCode ? (
                    strategyCode.split('\n').map((_, index) => (
                      <div
                        key={index}
                        className="text-gray-600 text-xs font-mono text-right leading-5 select-none"
                      >
                        {index + 1}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-600 text-xs font-mono text-right leading-5 select-none">1</div>
                  )}
                </div>

                <div className="flex-1 relative overflow-hidden">
                  {/* Empty state placeholder */}
                  {!strategyCode && !isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="relative">
                          <div className="text-8xl opacity-20">📋</div>
                          <div className="absolute -bottom-2 -right-2 text-4xl">✨</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-400 mb-2">No Strategy Loaded</div>
                          <div className="text-sm text-gray-500 max-w-xs">
                            Drag & drop a <span className="text-purple-400 font-mono">.json</span> file here
                            <br />
                            or click the 📁 button above to select a file
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-pink-500/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blinking cursor indicator when empty */}
                  {!strategyCode && !isDragging && (
                    <div className="absolute top-6 left-6 flex items-center gap-1 pointer-events-none">
                      <span className="text-gray-700 font-mono text-sm">{'{'}</span>
                      <div className="w-2 h-4 bg-cyan-500 animate-pulse"></div>
                    </div>
                  )}

                  <textarea
                    value={strategyCode}
                    onChange={(e) => setStrategyCode(e.target.value)}
                    className={`w-full h-full p-6 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none custom-scrollbar ${
                      !strategyCode ? 'opacity-0' : 'opacity-100'
                    }`}
                    placeholder=""
                    spellCheck={false}
                  />

                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                      <div className="bg-gray-900/90 border-2 border-cyan-500 border-dashed rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
                        <div className="text-6xl">📂</div>
                        <div className="text-cyan-400 font-bold text-xl">Drop JSON file here</div>
                        <div className="text-gray-400 text-sm">strategy.json will be loaded automatically</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="h-64 flex flex-col bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20">
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-6 py-3 border-b border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-cyan-400 font-mono text-sm font-semibold">terminal</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div
                ref={terminalRef}
                className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar"
              >
                {terminalOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className={`mb-1 animate-fadeIn ${
                      line.includes('ERROR') ? 'text-red-400' :
                      line.includes('SUCCESS') || line.includes('completed') ? 'text-green-400' :
                      line.includes('WARNING') ? 'text-yellow-400' :
                      'text-green-400'
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {line}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-cyan-400">$</span>
                  <div className="w-2 h-4 bg-cyan-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Info Panel */}
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
                /* Before Starting - Configuration View */
                <>
                  {/* Configuration and Educational Content */}
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

                  {/* Analytics Metrics */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                      Метрики аналитики
                    </h3>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {/* Basic Metrics */}
                      <div>
                        <div className="text-cyan-400 font-semibold mb-2">🧾 Базовые метрики</div>
                        <div className="space-y-1 text-gray-300 pl-3">
                          <div><span className="text-purple-400">n_trades</span> — общее кол-во сделок</div>
                          <div><span className="text-purple-400">n_wins</span> / <span className="text-purple-400">n_losses</span> — прибыльные/убыточные</div>
                          <div><span className="text-purple-400">winrate</span> — процент выигрышей (0–1)</div>
                        </div>
                      </div>

                      {/* PnL */}
                      <div>
                        <div className="text-green-400 font-semibold mb-2">💰 Прибыль/Убыток</div>
                        <div className="space-y-1 text-gray-300 pl-3">
                          <div><span className="text-purple-400">total_pnl</span> — совокупная прибыль</div>
                          <div><span className="text-purple-400">avg_pnl</span> / <span className="text-purple-400">med_pnl</span> — средний/медианный PnL</div>
                          <div><span className="text-purple-400">profit_factor</span> — отношение прибыли к убыткам</div>
                        </div>
                      </div>

                      {/* Risk */}
                      <div>
                        <div className="text-orange-400 font-semibold mb-2">⚠️ Риск и стабильность</div>
                        <div className="space-y-1 text-gray-300 pl-3">
                          <div><span className="text-purple-400">max_drawdown</span> — макс. просадка</div>
                          <div><span className="text-purple-400">sharpe_ratio</span> — коэфф. Шарпа</div>
                          <div><span className="text-purple-400">max_win_streak</span> — серия побед</div>
                        </div>
                      </div>

                      {/* Time */}
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

                  {/* JSON Schema */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                      JSON Schema
                    </h3>
                    <div className="bg-black/40 border border-gray-700/50 rounded-lg p-4 font-mono text-xs space-y-1">
                      <div className="text-gray-500">{`// Required fields:`}</div>
                      <div className="text-gray-300"><span className="text-cyan-400">&quot;name&quot;</span>: string</div>
                      <div className="text-gray-300"><span className="text-cyan-400">&quot;indicators&quot;</span>: {`{type, period}`}</div>
                      <div className="text-gray-300"><span className="text-cyan-400">&quot;entry&quot;</span>: {`{long, short}`}</div>
                      <div className="text-gray-300"><span className="text-cyan-400">&quot;exit&quot;</span>: {`{stop_loss, take_profit}`}</div>
                    </div>
                  </div>

                  {/* Scroll to Bottom Button */}
                  {showScrollButton && (
                    <button
                      onClick={scrollToBottom}
                      className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-full shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all hover:scale-110 flex items-center justify-center group z-10 animate-fadeIn"
                      title="Scroll to configuration"
                    >
                      <svg className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  )}

                  {/* Configuration Form */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Strategy Configuration</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Strategy Name</label>
                        <input
                          type="text"
                          value={strategyName}
                          onChange={(e) => setStrategyName(e.target.value)}
                          placeholder="e.g., MA Crossover Strategy"
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        <button
                          onClick={simulateBacktest}
                          disabled={isRunning}
                          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🚀 Run Backtest (Demo)
                        </button>

                        <button
                          onClick={createMockBacktest}
                          disabled={isRunning}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💾 Create Mock Backtest with Results
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : completedBacktest ? (
                /* Backtest Completed - Results View */
                <>
                  {/* Results Summary Title */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-2">📊 Backtest Results</h3>
                    <p className="text-sm text-gray-400">
                      {(typeof completedBacktest.strategy_code?.name === 'string'
                        ? completedBacktest.strategy_code.name
                        : strategyName) || 'Strategy'}
                    </p>
                  </div>

                  {/* Main Metrics Grid */}
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
                        {completedBacktest.n_trades}
                        <span className="text-sm text-gray-400 ml-2">
                          ({completedBacktest.n_wins}W/{completedBacktest.n_losses}L)
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

                  {/* Additional Metrics */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase">Risk Metrics</h4>

                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Max Drawdown</span>
                        <span className="text-sm font-semibold text-red-400">
                          {completedBacktest.max_drawdown.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Profit Factor</span>
                        <span className="text-sm font-semibold text-cyan-400">
                          {completedBacktest.profit_factor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowDetailsModal(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]"
                    >
                      📊 View Details
                    </button>

                    {/* Download Button with Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]"
                      >
                        💾 Download
                      </button>

                      {showDownloadMenu && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-10">
                          <div className="p-3 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={downloadOptions.results}
                                onChange={(e) => setDownloadOptions({ ...downloadOptions, results: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-gray-300">Results (CSV)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={downloadOptions.code}
                                onChange={(e) => setDownloadOptions({ ...downloadOptions, code: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-gray-300">Strategy Code (JSON)</span>
                            </label>
                          </div>
                          <button
                            onClick={handleDownload}
                            disabled={!downloadOptions.results && !downloadOptions.code}
                            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Download ZIP
                          </button>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/"
                      className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] text-center"
                    >
                      🏠 Go to Dashboard
                    </Link>
                  </div>

                  {/* Success Message */}
                  <div className="mt-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Backtest Completed!</h4>
                        <p className="text-sm text-gray-300">
                          Your strategy has been tested against historical data. Review the detailed metrics above and analyze individual trades in the modal.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* During Running - Status View */
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

                  {/* Recommendations */}
                  {currentPhase === 'Completed' && (
                    <div className="mt-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        ✨ Next Steps
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>Review detailed metrics in the dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>Compare with other strategies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>Optimize parameters for better results</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {completedBacktest && (
        <BacktestDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          backtestId={completedBacktest.id}
          strategyName={
            (typeof completedBacktest.strategy_code?.name === 'string'
              ? completedBacktest.strategy_code.name
              : strategyName) || 'Strategy'
          }
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </main>
  );
}
