'use client';

import { useState } from 'react';
import type { SavedStrategy } from '@/types/backtest';
import { getZipFile } from '@/lib/zipStorage';

interface LoadStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategies: SavedStrategy[];
  onLoad: (strategy: SavedStrategy) => void;
  onDelete: (id: string) => void;
}

export function LoadStrategyModal({ isOpen, onClose, strategies, onLoad, onDelete }: LoadStrategyModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadZip = async (strategy: SavedStrategy) => {
    setDownloadingId(strategy.id);
    try {
      const zipEntry = await getZipFile(strategy.id);
      
      if (!zipEntry) {
        alert('ZIP файл не найден. Возможно, он был удален.');
        return;
      }
      
      // Create download link
      const url = URL.createObjectURL(zipEntry.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipEntry.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('ZIP downloaded:', zipEntry.fileName);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Ошибка при скачивании архива');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredStrategies = strategies.filter(strategy =>
    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📂 Load Strategy</h2>
          
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search strategies..."
              className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filteredStrategies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {strategies.length === 0 ? 'No saved strategies' : 'No strategies match your search'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {strategy.name}
                      </h3>
                      {strategy.description && (
                        <p className="text-gray-300 text-sm mb-2">
                          {strategy.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>📅 {formatDate(strategy.createdAt)}</span>
                        <span>📊 PnL: {strategy.backtestData.total_pnl.toFixed(2)}</span>
                        <span>📈 Winrate: {(strategy.backtestData.winrate * 100).toFixed(1)}%</span>
                        <span>🎯 Trades: {strategy.backtestData.n_trades}</span>
                        <span>⚡ Type: {strategy.backtestData.strategy_type || 'single'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {strategy.hasZipFile && (
                        <button
                          onClick={() => handleDownloadZip(strategy)}
                          disabled={downloadingId === strategy.id}
                          className={`px-3 py-1.5 text-white text-sm rounded-lg transition-colors ${
                            downloadingId === strategy.id
                              ? 'bg-gray-600 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          title="Download ZIP archive"
                        >
                          {downloadingId === strategy.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '📦'
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onLoad(strategy)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete strategy "${strategy.name}"?`)) {
                            onDelete(strategy.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
