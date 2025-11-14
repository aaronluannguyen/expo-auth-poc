/**
 * Token Storage Service
 *
 * Securely stores and retrieves authentication tokens using Expo SecureStore.
 * SecureStore provides encrypted storage backed by:
 * - iOS: Keychain Services
 * - Android: EncryptedSharedPreferences (uses Android Keystore)
 *
 * This ensures tokens are encrypted at rest and protected by the device's
 * secure enclave/hardware security module.
 */

import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from '../../types/auth.types';

// Storage keys - using prefixed keys for better organization
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'workos_access_token',
  REFRESH_TOKEN: 'workos_refresh_token',
  ID_TOKEN: 'workos_id_token',
  EXPIRES_AT: 'workos_expires_at',
  TOKEN_TYPE: 'workos_token_type',
} as const;

/**
 * Stores authentication tokens securely
 *
 * @param tokens - The authentication tokens to store
 * @throws Error if storage operation fails
 */
export const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    // Calculate absolute expiration timestamp
    const expiresAt = Date.now() + tokens.expiresIn * 1000;

    // Store each token separately for better security and flexibility
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString()),
      SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_TYPE, tokens.tokenType),
      tokens.refreshToken
        ? SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        : Promise.resolve(),
      tokens.idToken
        ? SecureStore.setItemAsync(STORAGE_KEYS.ID_TOKEN, tokens.idToken)
        : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Failed to securely store authentication tokens');
  }
};

/**
 * Retrieves stored authentication tokens
 *
 * @returns The stored tokens or null if not found
 * @throws Error if retrieval operation fails
 */
export const getTokens = async (): Promise<AuthTokens | null> => {
  try {
    const [accessToken, refreshToken, idToken, expiresAt, tokenType] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.ID_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.EXPIRES_AT),
      SecureStore.getItemAsync(STORAGE_KEYS.TOKEN_TYPE),
    ]);

    // If essential tokens are missing, return null
    if (!accessToken || !expiresAt || !tokenType) {
      return null;
    }

    // Calculate remaining time until expiration
    const expiresAtTimestamp = parseInt(expiresAt, 10);
    const now = Date.now();
    const expiresIn = Math.max(0, Math.floor((expiresAtTimestamp - now) / 1000));

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      idToken: idToken || undefined,
      expiresIn,
      tokenType,
    };
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    throw new Error('Failed to retrieve authentication tokens');
  }
};

/**
 * Checks if the stored access token is expired or will expire soon
 *
 * @param bufferSeconds - Number of seconds before expiration to consider token expired (default: 300 = 5 minutes)
 * @returns true if token is expired or will expire within buffer time
 */
export const isTokenExpired = async (bufferSeconds: number = 300): Promise<boolean> => {
  try {
    const expiresAt = await SecureStore.getItemAsync(STORAGE_KEYS.EXPIRES_AT);

    if (!expiresAt) {
      return true;
    }

    const expiresAtTimestamp = parseInt(expiresAt, 10);
    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;

    // Token is considered expired if it will expire within the buffer time
    return expiresAtTimestamp - now <= bufferMs;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true; // Assume expired on error for safety
  }
};

/**
 * Clears all stored authentication tokens
 *
 * @throws Error if deletion operation fails
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ID_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.EXPIRES_AT),
      SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_TYPE),
    ]);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw new Error('Failed to clear authentication tokens');
  }
};

/**
 * Gets the access token if it exists and is not expired
 *
 * @returns The access token or null if expired/missing
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  try {
    const expired = await isTokenExpired();

    if (expired) {
      return null;
    }

    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to get valid access token:', error);
    return null;
  }
};
