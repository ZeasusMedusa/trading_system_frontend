'use client';

/**
 * AuthProvider - React Context for User Authentication
 *
 * Provides user state and auth functions throughout the app.
 * Automatically checks if user is logged in on mount.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      if (api.auth.isAuthenticated()) {
        const currentUser = await api.auth.getCurrentUser();
        setUser(currentUser);
        // Save user to localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be invalid, clear it
      api.auth.logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    try {
      await api.auth.login({ username, password });
      const currentUser = await api.auth.getCurrentUser();
      setUser(currentUser);
      
      // Save user to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      // Mirror token to cookie for middleware to enforce SSR route protection
      if (typeof document !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const isSecure = window.location.protocol === 'https:';
          document.cookie = `auth_token=${token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7};${isSecure ? ' Secure;' : ''}`;
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  function logout() {
    setUser(null);
    api.auth.logout();
    
    // Clear user from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    
    if (typeof document !== 'undefined') {
      // Delete cookie by setting Max-Age=0
      document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await api.auth.getCurrentUser();
      setUser(currentUser);
      // Update user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
