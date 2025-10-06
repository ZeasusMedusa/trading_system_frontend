/**
 * Admin API Endpoints
 *
 * Admin-only endpoints for user and symbol management.
 */

import { apiRequest } from '../client';
import { ENDPOINTS, USE_MOCK_API } from '../config';
import {
  mockGetUsers,
  mockCreateUser,
  mockDeleteUser,
  mockGetSymbols,
  mockCreateSymbol,
  mockDeleteSymbol,
  mockSyncStart,
  mockSyncStatus,
} from '../mock';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ParsedSymbol,
  CreateSymbolRequest,
  UpdateSymbolRequest,
  SyncStartResponse,
  SyncStatusResponse,
} from '../types';

// ============================================================================
// USERS
// ============================================================================

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  if (USE_MOCK_API) {
    return mockGetUsers();
  }

  return apiRequest<User[]>({
    method: 'GET',
    url: ENDPOINTS.ADMIN.USERS,
  });
}

/**
 * Get single user by ID
 */
export async function getUser(userId: number): Promise<User> {
  if (USE_MOCK_API) {
    const users = await mockGetUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  return apiRequest<User>({
    method: 'GET',
    url: ENDPOINTS.ADMIN.USER(userId),
  });
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  if (USE_MOCK_API) {
    return mockCreateUser(data);
  }

  return apiRequest<User>({
    method: 'POST',
    url: ENDPOINTS.ADMIN.USERS,
    data,
  });
}

/**
 * Update user
 */
export async function updateUser(userId: number, data: UpdateUserRequest): Promise<User> {
  if (USE_MOCK_API) {
    const user = await getUser(userId);
    return { ...user, ...data };
  }

  return apiRequest<User>({
    method: 'PUT',
    url: ENDPOINTS.ADMIN.USER(userId),
    data,
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: number): Promise<{ detail: string }> {
  if (USE_MOCK_API) {
    return mockDeleteUser(userId);
  }

  return apiRequest<{ detail: string }>({
    method: 'DELETE',
    url: ENDPOINTS.ADMIN.USER(userId),
  });
}

// ============================================================================
// SYMBOLS
// ============================================================================

/**
 * Get all parsed symbols
 */
export async function getSymbols(): Promise<ParsedSymbol[]> {
  if (USE_MOCK_API) {
    return mockGetSymbols();
  }

  return apiRequest<ParsedSymbol[]>({
    method: 'GET',
    url: ENDPOINTS.ADMIN.SYMBOLS,
  });
}

/**
 * Get single symbol by ID
 */
export async function getSymbol(symbolId: number): Promise<ParsedSymbol> {
  if (USE_MOCK_API) {
    const symbols = await mockGetSymbols();
    const symbol = symbols.find(s => s.id === symbolId);
    if (!symbol) throw new Error('Symbol not found');
    return symbol;
  }

  return apiRequest<ParsedSymbol>({
    method: 'GET',
    url: ENDPOINTS.ADMIN.SYMBOL(symbolId),
  });
}

/**
 * Create new symbol
 */
export async function createSymbol(data: CreateSymbolRequest): Promise<ParsedSymbol> {
  if (USE_MOCK_API) {
    return mockCreateSymbol(data);
  }

  return apiRequest<ParsedSymbol>({
    method: 'POST',
    url: ENDPOINTS.ADMIN.SYMBOLS,
    data,
  });
}

/**
 * Update symbol
 */
export async function updateSymbol(symbolId: number, data: UpdateSymbolRequest): Promise<ParsedSymbol> {
  if (USE_MOCK_API) {
    const symbol = await getSymbol(symbolId);
    return { ...symbol, ...data };
  }

  return apiRequest<ParsedSymbol>({
    method: 'PUT',
    url: ENDPOINTS.ADMIN.SYMBOL(symbolId),
    data,
  });
}

/**
 * Delete symbol
 */
export async function deleteSymbol(symbolId: number): Promise<{ detail: string }> {
  if (USE_MOCK_API) {
    return mockDeleteSymbol(symbolId);
  }

  return apiRequest<{ detail: string }>({
    method: 'DELETE',
    url: ENDPOINTS.ADMIN.SYMBOL(symbolId),
  });
}

// ============================================================================
// SYNC
// ============================================================================

/**
 * Start sync for all active exchanges
 */
export async function startSync(): Promise<SyncStartResponse> {
  if (USE_MOCK_API) {
    return mockSyncStart();
  }

  return apiRequest<SyncStartResponse>({
    method: 'POST',
    url: ENDPOINTS.PARSE.SYNC_START,
  });
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatusResponse> {
  if (USE_MOCK_API) {
    return mockSyncStatus();
  }

  return apiRequest<SyncStatusResponse>({
    method: 'GET',
    url: ENDPOINTS.PARSE.SYNC_STATUS,
  });
}
