'use client';

/**
 * ApiKeysSection Component
 *
 * Manage exchange API keys for trading.
 */

import { useState } from 'react';
import { api } from '@/lib/api';

const SUPPORTED_EXCHANGES = ['binance', 'bybit', 'okx', 'kraken'];

export default function ApiKeysSection() {
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!apiKey || !apiSecret) {
      alert('API Key and Secret are required');
      return;
    }

    try {
      setLoading(true);
      await api.settings.saveAPIKeys({
        exchange: selectedExchange,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      alert('API keys saved successfully');
      // Clear sensitive data
      setApiKey('');
      setApiSecret('');
    } catch (error) {
      console.error('Failed to save API keys:', error);
      alert('Failed to save API keys');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete API keys for ${selectedExchange}?`)) return;

    try {
      setLoading(true);
      await api.settings.deleteAPIKeys(selectedExchange);
      alert('API keys deleted successfully');
    } catch (error) {
      console.error('Failed to delete API keys:', error);
      alert('Failed to delete API keys');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">🔑 Exchange API Keys</h2>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors disabled:opacity-50"
        >
          Delete Keys
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Add your exchange API keys to enable live trading features.
        Keys are encrypted and stored securely.
      </p>

      <div className="space-y-4">
        {/* Exchange Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Exchange</label>
          <select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {SUPPORTED_EXCHANGES.map((exchange) => (
              <option key={exchange} value={exchange}>
                {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* API Secret */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your API secret"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save API Keys'}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-xs text-yellow-400">
          ⚠️ Never share your API keys with anyone. Make sure to set proper permissions (read-only recommended for backtesting).
        </p>
      </div>
    </div>
  );
}
