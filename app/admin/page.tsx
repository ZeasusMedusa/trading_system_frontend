'use client';

/**
 * Admin Panel
 *
 * Main admin page with tabs for Users, Symbols, and Sync management.
 * Only accessible to admin users.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';
import UsersTable from './components/UsersTable';
import SymbolsTable from './components/SymbolsTable';
import SyncStatus from './components/SyncStatus';

type Tab = 'users' | 'symbols' | 'sync';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (!loading && (!user || !user.is_admin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                🛠️ Admin Panel
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage users, symbols, and system settings
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'users'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('symbols')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'symbols'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Symbols
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'sync'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔄 Sync Status
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'symbols' && <SymbolsTable />}
          {activeTab === 'sync' && <SyncStatus />}
        </div>
      </div>
    </div>
  );
}
