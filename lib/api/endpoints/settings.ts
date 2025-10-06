/**
 * Settings API Endpoints
 *
 * User settings for API keys and Telegram notifications.
 */

import { apiRequest } from '../client';
import { ENDPOINTS, USE_MOCK_API } from '../config';
import { mockSaveAPIKey, mockSaveTelegramSettings } from '../mock';
import type {
  APIKeyRequest,
  APIKeyResponse,
  APIKeyInfo,
  TelegramSettingsRequest,
  TelegramSettingsResponse,
  TelegramSettings,
} from '../types';

// ============================================================================
// API KEYS
// ============================================================================

/**
 * Save API keys for an exchange
 */
export async function saveAPIKeys(data: APIKeyRequest): Promise<APIKeyResponse> {
  if (USE_MOCK_API) {
    return mockSaveAPIKey();
  }

  return apiRequest<APIKeyResponse>({
    method: 'POST',
    url: ENDPOINTS.SETTINGS.API_KEYS,
    data,
  });
}

/**
 * Get API keys for an exchange
 */
export async function getAPIKeys(exchange: string): Promise<APIKeyInfo> {
  if (USE_MOCK_API) {
    return {
      exchange,
      api_key: '****...****', // Masked
      created_at: new Date().toISOString(),
    };
  }

  return apiRequest<APIKeyInfo>({
    method: 'GET',
    url: ENDPOINTS.SETTINGS.API_KEY(exchange),
  });
}

/**
 * Update API keys for an exchange
 */
export async function updateAPIKeys(exchange: string, data: APIKeyRequest): Promise<APIKeyResponse> {
  if (USE_MOCK_API) {
    return mockSaveAPIKey();
  }

  return apiRequest<APIKeyResponse>({
    method: 'PUT',
    url: ENDPOINTS.SETTINGS.API_KEY(exchange),
    data,
  });
}

/**
 * Delete API keys for an exchange
 */
export async function deleteAPIKeys(exchange: string): Promise<{ detail: string }> {
  if (USE_MOCK_API) {
    return { detail: 'API keys deleted' };
  }

  return apiRequest<{ detail: string }>({
    method: 'DELETE',
    url: ENDPOINTS.SETTINGS.API_KEY(exchange),
  });
}

// ============================================================================
// TELEGRAM
// ============================================================================

/**
 * Save Telegram settings
 */
export async function saveTelegramSettings(data: TelegramSettingsRequest): Promise<TelegramSettingsResponse> {
  if (USE_MOCK_API) {
    return mockSaveTelegramSettings();
  }

  return apiRequest<TelegramSettingsResponse>({
    method: 'POST',
    url: ENDPOINTS.SETTINGS.TELEGRAM,
    data,
  });
}

/**
 * Get Telegram settings
 */
export async function getTelegramSettings(): Promise<TelegramSettings> {
  if (USE_MOCK_API) {
    return {
      token: '****...****', // Masked
      chat_id: '123456789',
      created_at: new Date().toISOString(),
    };
  }

  return apiRequest<TelegramSettings>({
    method: 'GET',
    url: ENDPOINTS.SETTINGS.TELEGRAM,
  });
}

/**
 * Update Telegram settings
 */
export async function updateTelegramSettings(data: TelegramSettingsRequest): Promise<TelegramSettingsResponse> {
  if (USE_MOCK_API) {
    return mockSaveTelegramSettings();
  }

  return apiRequest<TelegramSettingsResponse>({
    method: 'PUT',
    url: ENDPOINTS.SETTINGS.TELEGRAM,
    data,
  });
}

/**
 * Delete Telegram settings
 */
export async function deleteTelegramSettings(): Promise<{ detail: string }> {
  if (USE_MOCK_API) {
    return { detail: 'Telegram settings deleted' };
  }

  return apiRequest<{ detail: string }>({
    method: 'DELETE',
    url: ENDPOINTS.SETTINGS.TELEGRAM,
  });
}
