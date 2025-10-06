'use client';

/**
 * SyncStatus Component
 *
 * Displays sync status and allows starting sync for exchanges.
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { SyncStatusResponse } from '@/lib/api/types';

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStatus();
    // Poll status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const data = await api.admin.getSyncStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSync() {
    if (!confirm('Start synchronization for all active exchanges?')) return;

    try {
      setSyncing(true);
      const result = await api.admin.startSync();
      alert(`Sync started! Jobs: ${result.jobs.join(', ')}`);
      await loadStatus();
    } catch (error) {
      console.error('Failed to start sync:', error);
      alert('Failed to start sync');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="text-white text-center py-8">Loading sync status...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Sync Status</h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitor and control data synchronization
          </p>
        </div>
        <button
          onClick={handleStartSync}
          disabled={syncing || status?.running}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? '🔄 Starting...' : status?.running ? '🔄 Running...' : '▶️ Start Sync'}
        </button>
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status?.running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <div>
            <div className="text-white font-semibold">
              Overall Status: {status?.running ? 'Running' : 'Idle'}
            </div>
            <div className="text-sm text-gray-400">
              {status?.running ? 'Synchronization in progress' : 'No active synchronization'}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Status */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-3">Exchange Details</h3>

        {status?.details && status.details.length > 0 ? (
          status.details.map((exchange) => (
            <div
              key={exchange.exchange}
              className="p-4 bg-gray-900/30 border border-gray-700/50 rounded-lg hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${exchange.running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  <div>
                    <div className="text-white font-medium capitalize">
                      {exchange.exchange}
                    </div>
                    <div className="text-sm text-gray-400">
                      {exchange.running ? 'Syncing data...' : 'Idle'}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-sm ${
                  exchange.running
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {exchange.running ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No exchanges configured
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-2">ℹ️ About Synchronization</h4>
        <p className="text-sm text-gray-300">
          Synchronization fetches market data from configured exchanges.
          Status updates automatically every 5 seconds.
        </p>
      </div>
    </div>
  );
}
