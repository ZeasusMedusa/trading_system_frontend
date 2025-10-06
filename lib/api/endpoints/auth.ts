/**
 * Auth API Endpoints
 *
 * Authentication and user management functions.
 */

import { apiRequest, setAuthToken, getAuthToken } from '../client';
import { ENDPOINTS, USE_MOCK_API } from '../config';
import { mockLogin, mockGetMe } from '../mock';
import type { LoginRequest, LoginResponse, User } from '../types';

/**
 * Login user and get JWT token
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK_API) {
    const response = await mockLogin(credentials.username, credentials.password);
    setAuthToken(response.access_token);
    return response;
  }

  // Note: Backend expects form data for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await apiRequest<LoginResponse>({
    method: 'POST',
    url: ENDPOINTS.AUTH.LOGIN,
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // Save token
  setAuthToken(response.access_token);

  return response;
}

/**
 * Logout user (clear token)
 */
export function logout(): void {
  setAuthToken(null);

  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  if (USE_MOCK_API) {
    return mockGetMe();
  }

  // No /auth/me endpoint on backend: derive user info from JWT if possible
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Try to decode JWT payload to extract username/claims
  let username = 'user';
  let is_admin = false;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      username = payloadJson.username || payloadJson.sub || username;
      is_admin = !!(payloadJson.is_admin || payloadJson.admin || payloadJson.isAdmin);
    }
  } catch (_e) {
    // ignore decode errors; fall back to defaults
  }

  const user: User = {
    id: 0,
    username,
    is_admin,
    activated: true,
    created_at: new Date().toISOString(),
  };
  return user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}
