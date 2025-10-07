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

  // Use /auth/me endpoint to get full user info from backend
  return apiRequest<User>({
    method: 'GET',
    url: ENDPOINTS.AUTH.ME,
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('auth_token');
}
