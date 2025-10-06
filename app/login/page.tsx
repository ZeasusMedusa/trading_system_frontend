'use client';

/**
 * Login Page
 *
 * User authentication page with form validation.
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      router.push('/'); // Redirect to dashboard
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            SMIIO Backtest
          </h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials (for mock mode) */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 text-center mb-2">
              Demo credentials (mock mode):
            </p>
            <div className="bg-gray-900/30 rounded-lg p-3 text-xs text-gray-400 font-mono text-center">
              <div>Username: <span className="text-cyan-400">admin</span></div>
              <div>Password: <span className="text-cyan-400">admin</span></div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Powered by SMIIO Backtest Platform
        </p>
      </div>
    </div>
  );
}
