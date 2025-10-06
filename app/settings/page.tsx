'use client';

/**
 * Settings Page
 *
 * User settings for API keys and Telegram notifications.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';
import ApiKeysSection from './components/ApiKeysSection';
import TelegramSection from './components/TelegramSection';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ⚙️ Settings
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage your API keys and notification settings
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* API Keys Section */}
        <ApiKeysSection />

        {/* Telegram Section */}
        <TelegramSection />

        {/* User Info */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">👤 Account Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="text-white font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className={`font-medium ${user.is_admin ? 'text-purple-400' : 'text-gray-300'}`}>
                {user.is_admin ? 'Administrator' : 'User'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${user.activated ? 'text-green-400' : 'text-red-400'}`}>
                {user.activated ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Member since:</span>
              <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
