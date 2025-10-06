'use client';

/**
 * TelegramSection Component
 *
 * Manage Telegram bot settings for notifications.
 */

import { useState } from 'react';
import { api } from '@/lib/api';

export default function TelegramSection() {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!token || !chatId) {
      alert('Bot Token and Chat ID are required');
      return;
    }

    try {
      setLoading(true);
      await api.settings.saveTelegramSettings({
        token,
        chat_id: chatId,
      });
      alert('Telegram settings saved successfully');
      // Clear sensitive data
      setToken('');
      setChatId('');
    } catch (error) {
      console.error('Failed to save Telegram settings:', error);
      alert('Failed to save Telegram settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete Telegram settings?')) return;

    try {
      setLoading(true);
      await api.settings.deleteTelegramSettings();
      alert('Telegram settings deleted successfully');
    } catch (error) {
      console.error('Failed to delete Telegram settings:', error);
      alert('Failed to delete Telegram settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">📱 Telegram Notifications</h2>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors disabled:opacity-50"
        >
          Delete Settings
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Configure Telegram bot to receive notifications about backtest results and trading signals.
      </p>

      <div className="space-y-4">
        {/* Bot Token */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bot Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">@BotFather</a>
          </p>
        </div>

        {/* Chat ID */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Chat ID</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="123456789"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your chat ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">@userinfobot</a>
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Telegram Settings'}
        </button>
      </div>

      {/* How to Setup */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-2 text-sm">📝 How to setup:</h4>
        <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
          <li>Create a bot via @BotFather on Telegram</li>
          <li>Copy the bot token</li>
          <li>Get your chat ID from @userinfobot</li>
          <li>Enter both values above and save</li>
        </ol>
      </div>
    </div>
  );
}
