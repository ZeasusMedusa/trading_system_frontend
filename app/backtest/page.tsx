'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import BacktestDetailsModal from '../components/BacktestDetailsModal';
import { SaveStrategyModal } from '../components/SaveStrategyModal';
import { LoadStrategyModal } from '../components/LoadStrategyModal';
import { Terminal } from '../components/backtest/Terminal';
import { StrategyEditor } from '../components/backtest/StrategyEditor';
import { BacktestHeader } from '../components/backtest/BacktestHeader';
import { InfoPanel } from '../components/backtest/InfoPanel';
import type { CompletedBacktest } from '@/types/backtest';
import type { StrategyListItem } from '@/lib/api/endpoints/strategy';
import { useTypewriterAnimation } from '@/hooks/useTypewriterAnimation';
import { useFileUpload } from '@/hooks/backtest/useFileUpload';

export default function BacktestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Idle');
  const [strategyName, setStrategyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [completedBacktest, setCompletedBacktest] = useState<CompletedBacktest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCache, setDownloadCache] = useState<Map<string, Blob>>(new Map());
  const [savedStrategies, setSavedStrategies] = useState<StrategyListItem[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const { displayedText, showCursor } = useTypewriterAnimation('🧪 New Backtest Session 🧑‍🔬');
  const [strategyCode, setStrategyCode] = useState('');

  const {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleFileDrop,
    handleFileSelect,
    handleFileChange,
  } = useFileUpload({
    onFileLoad: (content, fileName) => {
      setStrategyCode(content);
      addTerminalLine(`> ✅ Loaded strategy from: ${fileName}`);
    },
    onStrategyNameUpdate: (name) => {
      if (!strategyName) {
        setStrategyName(name);
      }
    },
  });

  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> Backtest environment initialized...',
    '> Waiting for configuration...',
  ]);
  const [infoMessages, setInfoMessages] = useState<string[]>([]);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

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

  // File upload handlers are now provided by useFileUpload hook
  const handleGetDefault = async () => {
    try {
      addTerminalLine('> Fetching default strategy from server...');
      const defaultStrategy = await api.backtest.getDefaultStrategy();
      const json = JSON.stringify(defaultStrategy, null, 2);
      setStrategyCode(json);
      const name = typeof (defaultStrategy as any).name === 'string' ? (defaultStrategy as any).name : 'DefaultStrategy';
      if (!strategyName) {
        setStrategyName(name);
      }
      addTerminalLine('> ✅ Default strategy loaded into editor');
    } catch (e) {
      console.error(e);
      addTerminalLine('> ERROR: Failed to fetch default strategy');
    }
  };

  const handleGetBuyDefault = async () => {
    try {
      addTerminalLine('> Fetching BUY default strategy...');
      const s = await api.backtest.getBuyStrategy();
      setStrategyCode(JSON.stringify(s, null, 2));
      addTerminalLine('> ✅ BUY strategy loaded');
    } catch (e) {
      console.error(e);
      addTerminalLine('> ERROR: Failed to fetch BUY strategy');
    }
  };

  const handleGetSellDefault = async () => {
    try {
      addTerminalLine('> Fetching SELL default strategy...');
      const s = await api.backtest.getSellStrategy();
      setStrategyCode(JSON.stringify(s, null, 2));
      addTerminalLine('> ✅ SELL strategy loaded');
    } catch (e) {
      console.error(e);
      addTerminalLine('> ERROR: Failed to fetch SELL strategy');
    }
  };

  const handleGetDualTemplate = async () => {
    try {
      addTerminalLine('> Fetching DUAL template...');
      const s = await api.backtest.getDualTemplate();
      setStrategyCode(JSON.stringify(s, null, 2));
      addTerminalLine('> ✅ DUAL template loaded');
    } catch (e) {
      console.error(e);
      addTerminalLine('> ERROR: Failed to fetch DUAL template');
    }
  };

  const handleDownload = async () => {
    if (!completedBacktest) {
      return;
    }

    setIsDownloading(true);
    try {
      // Check cache first
      const cachedBlob = downloadCache.get(completedBacktest.id);
      
      let blob: Blob;
      if (cachedBlob) {
        addTerminalLine('> 📦 Using cached results...');
        blob = cachedBlob;
      } else {
        addTerminalLine('> 📥 Downloading results from server...');
        
        // Use server endpoint to download ZIP file
        blob = await api.backtest.downloadResults(completedBacktest.id);
        
        // Cache the blob
        setDownloadCache(prev => new Map(prev).set(completedBacktest.id, blob));
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename based on strategy type and name
      const stratName = typeof completedBacktest.strategy_code?.name === 'string'
        ? completedBacktest.strategy_code.name
        : 'backtest';
      const strategyType = completedBacktest.strategy_type === 'dual' ? 'dual' : 'single';
      const date = new Date().toISOString().split('T')[0];
      a.download = `backtest_${strategyType}_${stratName.replace(/\s+/g, '_')}_${date}.zip`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addTerminalLine('> ✅ Download completed');
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Download error:', error);
      addTerminalLine('> ❌ Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  // Load saved strategies from server on component mount
  useEffect(() => {
    const loadStrategiesFromServer = async () => {
      try {
        const strategies = await api.strategy.listStrategies();
        setSavedStrategies(strategies);
        addTerminalLine(`> 📂 Loaded ${strategies.length} saved strategies from server`);
      } catch (error) {
        console.error('Error loading strategies:', error);
        addTerminalLine('> ⚠️ Warning: Could not load saved strategies');
      }
    };
    
    loadStrategiesFromServer();
  }, []);

  const handleSaveStrategy = () => {
    if (!completedBacktest) {
      addTerminalLine('> ERROR: No completed backtest to save');
      return;
    }
    setShowSaveModal(true);
  };

  const handleLoadStrategy = async () => {
    try {
      const strategies = await api.strategy.listStrategies();
      setSavedStrategies(strategies);
      setShowLoadModal(true);
    } catch (error) {
      console.error('Error loading strategies:', error);
      addTerminalLine('> ❌ Failed to load strategies from server');
    }
  };

  const handleLoadSavedStrategy = async (strategy: StrategyListItem) => {
    try {
      // Load strategy code from config (already an object)
      setStrategyCode(JSON.stringify(strategy.config, null, 2));
      
      // Set strategy name
      setStrategyName(strategy.name);
      
      addTerminalLine(`> 📂 Loaded strategy: ${strategy.name}`);
      setShowLoadModal(false);
    } catch (error) {
      console.error('Error loading strategy:', error);
      addTerminalLine('> ❌ Failed to load strategy');
    }
  };

  const handleDeleteStrategy = async (id: number) => {
    try {
      await api.strategy.deleteStrategy(id);
      const strategies = await api.strategy.listStrategies();
      setSavedStrategies(strategies);
      addTerminalLine('> 🗑️ Strategy deleted from server');
    } catch (error) {
      console.error('Error deleting strategy:', error);
      addTerminalLine('> ❌ Failed to delete strategy');
    }
  };

  const runServerBacktest = async () => {
    try {
      // Clear download cache for new backtest
      setDownloadCache(new Map());
      
      if (!strategyCode.trim()) {
        addTerminalLine('> ERROR: Strategy JSON is empty');
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(strategyCode);
      } catch (e) {
        addTerminalLine('> ERROR: Strategy is not valid JSON');
        return;
      }

      setIsRunning(true);
      setProgress(0);
      setCurrentPhase('Submitting');
      addTerminalLine('> Submitting strategy to /backtest/test ...');

      const isDual = (parsed && (parsed.buy_strategy || parsed.sell_strategy || parsed.dual_strategy));
      const enqueue = isDual ? await api.backtest.submitDualBacktest(parsed) : await api.backtest.submitBacktest(parsed);
      addTerminalLine(`> ✅ Enqueued with job_id=${enqueue.job_id}`);

      setCurrentPhase('Polling');
      let done = false;
      let attempts = 0;
      while (!done && attempts < 300) {
        try {
          // Always use full=true to get complete data for bars display
          const status = await api.backtest.getBacktestStatus(enqueue.job_id, { full: true });
        if (status.status === 'finished') {
          const s = status as any;
          addTerminalLine('> ✅ Results ready');
          console.log('Backend response:', s); // Debug log
          addTerminalLine(`> 📊 Loaded ${s.bars?.length || 0} bars records`);
          if (s.bars_buy) {
            addTerminalLine(`> 📈 Loaded ${s.bars_buy.length} BUY bars records`);
          }
          if (s.bars_sell) {
            addTerminalLine(`> 📉 Loaded ${s.bars_sell.length} SELL bars records`);
          }
          setCompletedBacktest({
            id: enqueue.job_id,
            n_trades: s.analytics.n_trades,
            n_wins: s.analytics.n_wins,
            n_losses: s.analytics.n_losses,
            winrate: s.analytics.winrate,
            total_pnl: s.analytics.total_pnl,
            sharpe_ratio: s.analytics.sharpe_ratio,
            max_drawdown: s.analytics.max_drawdown,
            profit_factor: s.analytics.profit_factor,
            strategy_code: parsed,
            analytics: s.analytics,
            bars: s.bars,
            strategy_type: s.strategy_type || (isDual ? 'dual' : 'single'),
            bars_buy: s.bars_buy,
            bars_sell: s.bars_sell,
          });
          setCurrentPhase('Completed');
          setIsRunning(false);
          done = true;
          break;
        }

          if (status.status === 'too_frequent') {
            addTerminalLine('> ⚠️ Too frequent, waiting 10s...');
            await new Promise(r => setTimeout(r, 10000));
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
          attempts++;
          setProgress(Math.min(99, attempts));
        } catch (pollError) {
          console.error('Polling error:', pollError);
          addTerminalLine(`> ⚠️ Polling error: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
          await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry
          attempts++;
          setProgress(Math.min(99, attempts));
        }
      }

      if (!done) {
        addTerminalLine('> ERROR: Polling timed out');
        setIsRunning(false);
      }
    } catch (e) {
      console.error(e);
      addTerminalLine('> ERROR: Backtest failed');
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <BacktestHeader
        displayedText={displayedText}
        showCursor={showCursor}
        isRunning={isRunning}
        currentPhase={currentPhase}
      />

      {/* Main Content - Split View */}
      <div className="max-w-[1920px] mx-auto px-6 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)] w-full">

          {/* Left Side - Strategy Editor + Terminal */}
          <div className="flex flex-col gap-4">
            <StrategyEditor
              strategyCode={strategyCode}
              isDragging={isDragging}
              onCodeChange={setStrategyCode}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={async (e) => {
                const result = await handleFileDrop(e);
                if (result && !result.success && result.error) {
                  addTerminalLine(`> ⚠️ ${result.error.message}`);
                }
              }}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              onFileChange={async (e) => {
                const result = await handleFileChange(e);
                if (result && !result.success && result.error) {
                  addTerminalLine(`> ⚠️ ${result.error.message}`);
                }
                e.target.value = '';
              }}
            onGetDefault={handleGetDefault}
            onGetBuyDefault={handleGetBuyDefault}
            onGetSellDefault={handleGetSellDefault}
            onGetDualTemplate={handleGetDualTemplate}
            />
            <Terminal output={terminalOutput} />
          </div>

          <InfoPanel
            completedBacktest={completedBacktest}
            isRunning={isRunning}
            currentPhase={currentPhase}
            strategyName={strategyName}
            setStrategyName={setStrategyName}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            infoMessages={infoMessages}
            infoPanelRef={infoPanelRef}
            showScrollButton={showScrollButton}
            scrollToBottom={scrollToBottom}
            runServerBacktest={runServerBacktest}
            handleDownload={handleDownload}
            setShowDetailsModal={setShowDetailsModal}
            progress={progress}
            elapsedTime={elapsedTime}
            formatTime={formatTime}
            isDownloading={isDownloading}
            handleSaveStrategy={handleSaveStrategy}
            handleLoadStrategy={handleLoadStrategy}
          />
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
          strategy_type={completedBacktest.strategy_type}
          bars={completedBacktest.bars}
          bars_buy={completedBacktest.bars_buy}
          bars_sell={completedBacktest.bars_sell}
          isSaved={false}
          analytics={completedBacktest.analytics}
          config={completedBacktest.strategy_code}
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

      {/* Save Strategy Modal */}
      {showSaveModal && completedBacktest && (
        <SaveStrategyModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={async (name, description) => {
            setIsSavingStrategy(true);
            try {
              addTerminalLine('> 💾 Saving strategy to server...');
              
              // Prepare strategy config as object (not string)
              const configObject = completedBacktest.strategy_code || {};
              
              // Create strategy on server
              const result = await api.strategy.createStrategy({
                name,
                description: description || undefined,
                config: configObject,
              });
              
              addTerminalLine(`> ✅ Strategy created with ID: ${result.id}`);
              
              // Save analytics to strategy (if completedBacktest has analytics)
              if (completedBacktest.analytics) {
                try {
                  await api.strategy.saveResults(result.id, completedBacktest.analytics);
                  addTerminalLine('> ✅ Analytics saved to strategy');
                } catch (analyticsError) {
                  console.warn('Could not save analytics:', analyticsError);
                  addTerminalLine('> ⚠️ Analytics save failed');
                }
              }
              
              // Reload strategies list
              const strategies = await api.strategy.listStrategies();
              setSavedStrategies(strategies);
              
              addTerminalLine(`> 💾 Strategy saved: ${name}`);
              setShowSaveModal(false);
            } catch (error) {
              console.error('Save strategy error:', error);
              addTerminalLine(`> ❌ Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsSavingStrategy(false);
            }
          }}
          isSaving={isSavingStrategy}
        />
      )}

      {/* Load Strategy Modal */}
      {showLoadModal && (
        <LoadStrategyModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          strategies={savedStrategies}
          onLoad={handleLoadSavedStrategy}
          onDelete={handleDeleteStrategy}
        />
      )}
    </main>
  );
}
