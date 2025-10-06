'use client';

/**
 * SymbolsTable Component
 *
 * Displays and manages trading symbols for parsing.
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ParsedSymbol, CreateSymbolRequest } from '@/lib/api/types';

export default function SymbolsTable() {
  const [symbols, setSymbols] = useState<ParsedSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<ParsedSymbol | null>(null);

  const [formData, setFormData] = useState({
    exchange: 'binance',
    symbol: '',
    enabled: true,
  });

  useEffect(() => {
    loadSymbols();
  }, []);

  async function loadSymbols() {
    try {
      setLoading(true);
      const data = await api.admin.getSymbols();
      setSymbols(data);
    } catch (error) {
      console.error('Failed to load symbols:', error);
      alert('Failed to load symbols');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.symbol) {
      alert('Symbol is required');
      return;
    }

    try {
      await api.admin.createSymbol(formData as CreateSymbolRequest);
      await loadSymbols();
      setShowCreateModal(false);
      resetForm();
      alert('Symbol created successfully');
    } catch (error) {
      console.error('Failed to create symbol:', error);
      alert('Failed to create symbol');
    }
  }

  async function handleUpdate() {
    if (!editingSymbol) return;

    try {
      await api.admin.updateSymbol(editingSymbol.id, formData);
      await loadSymbols();
      setEditingSymbol(null);
      resetForm();
      alert('Symbol updated successfully');
    } catch (error) {
      console.error('Failed to update symbol:', error);
      alert('Failed to update symbol');
    }
  }

  async function handleDelete(symbolId: number, symbol: string) {
    if (!confirm(`Delete symbol "${symbol}"?`)) return;

    try {
      await api.admin.deleteSymbol(symbolId);
      await loadSymbols();
      alert('Symbol deleted successfully');
    } catch (error) {
      console.error('Failed to delete symbol:', error);
      alert('Failed to delete symbol');
    }
  }

  async function toggleEnabled(symbol: ParsedSymbol) {
    try {
      await api.admin.updateSymbol(symbol.id, { enabled: !symbol.enabled });
      await loadSymbols();
    } catch (error) {
      console.error('Failed to toggle symbol:', error);
      alert('Failed to toggle symbol');
    }
  }

  function resetForm() {
    setFormData({
      exchange: 'binance',
      symbol: '',
      enabled: true,
    });
  }

  function openEditModal(symbol: ParsedSymbol) {
    setEditingSymbol(symbol);
    setFormData({
      exchange: symbol.exchange,
      symbol: symbol.symbol,
      enabled: symbol.enabled,
    });
  }

  if (loading) {
    return <div className="text-white text-center py-8">Loading symbols...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Symbols Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all"
        >
          + Add Symbol
        </button>
      </div>

      {/* Symbols Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Exchange</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Symbol</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Last Run</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Next Run</th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => (
              <tr key={symbol.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                <td className="py-3 px-4 text-gray-300 capitalize">{symbol.exchange}</td>
                <td className="py-3 px-4 text-white font-medium">{symbol.symbol}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleEnabled(symbol)}
                    className={`px-2 py-1 rounded text-xs ${
                      symbol.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {symbol.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="py-3 px-4 text-gray-400 text-sm">
                  {symbol.last_run_at
                    ? new Date(symbol.last_run_at).toLocaleString()
                    : 'Never'}
                </td>
                <td className="py-3 px-4 text-gray-400 text-sm">
                  {symbol.next_run_at
                    ? new Date(symbol.next_run_at).toLocaleString()
                    : 'N/A'}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(symbol)}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(symbol.id, symbol.symbol)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSymbol) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingSymbol ? 'Edit Symbol' : 'Add Symbol'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exchange</label>
                <input
                  type="text"
                  value={formData.exchange}
                  onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  placeholder="binance"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  placeholder="BTC/USDT"
                />
              </div>

              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                Enabled
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={editingSymbol ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all"
              >
                {editingSymbol ? 'Update' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSymbol(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
