/**
 * Environment Configuration
 *
 * Centralizes all environment-specific configuration.
 * In production, these values should come from environment variables
 * or a secure configuration management system.
 *
 * SECURITY NOTE: Never commit real credentials to version control.
 * Use .env files (excluded from git) for local development.
 */

import Constants from 'expo-constants';

/**
 * WorkOS Configuration
 *
 * To get these values:
 * 1. Sign up at https://workos.com
 * 2. Create a new application in the WorkOS Dashboard
 * 3. Note your Client ID
 * 4. Configure your redirect URI (must match exactly)
 *
 * For development:
 * - Use exp://localhost:8081 or your Expo dev URL
 * - Register this URL in WorkOS Dashboard under "Redirect URIs"
 *
 * For production:
 * - Use your app's custom scheme: myapp://oauth/callback
 * - Or use universal links: https://yourapp.com/oauth/callback
 */
export const WORKOS_CONFIG = {
  // Your WorkOS Client ID (also called API Key in some contexts)
  // Example: 'client_01H5JXXXXXXXXXXXXXXXXXXX'
  clientId: process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID || 'your_workos_client_id',

  // The redirect URI where users will be sent after authentication
  // Must be registered in your WorkOS Dashboard
  redirectUri: process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI || 'exp://localhost:8081',

  // WorkOS OAuth discovery endpoint
  // This follows the OpenID Connect Discovery standard
  // WorkOS uses: https://api.workos.com/.well-known/openid-configuration
  discoveryUrl:
    process.env.EXPO_PUBLIC_WORKOS_DISCOVERY_URL ||
    'https://api.workos.com/.well-known/openid-configuration',

  // Authorization endpoint (can be derived from discovery, but included for reference)
  authorizationEndpoint:
    process.env.EXPO_PUBLIC_WORKOS_AUTH_ENDPOINT || 'https://api.workos.com/sso/authorize',

  // Token endpoint (can be derived from discovery, but included for reference)
  tokenEndpoint:
    process.env.EXPO_PUBLIC_WORKOS_TOKEN_ENDPOINT || 'https://api.workos.com/sso/token',

  // UserInfo endpoint for fetching user profile
  userInfoEndpoint:
    process.env.EXPO_PUBLIC_WORKOS_USERINFO_ENDPOINT || 'https://api.workos.com/user_management/userinfo',

  // Scopes to request during authentication
  // 'openid' is required for OpenID Connect
  // 'profile' provides user profile information
  // 'email' provides email address
  scopes: ['openid', 'profile', 'email'],
};

/**
 * App Configuration
 */
export const APP_CONFIG = {
  // App name displayed in UI
  name: 'WorkOS Auth Demo',

  // App version from app.json
  version: Constants.expoConfig?.version || '1.0.0',

  // Environment (development, staging, production)
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',

  // Enable debug logging
  debugMode: process.env.EXPO_PUBLIC_DEBUG === 'true',
};

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  // Token refresh buffer time (in seconds)
  // Refresh token this many seconds before it expires
  tokenRefreshBuffer: 300, // 5 minutes

  // Maximum number of token refresh retries
  maxRefreshRetries: 3,

  // Timeout for API requests (in milliseconds)
  apiTimeout: 30000, // 30 seconds
};

/**
 * Validates that all required environment variables are set
 * Call this on app startup to fail fast if configuration is missing
 */
export const validateEnvironmentConfig = (): void => {
  const requiredVars = [
    { key: 'WORKOS_CLIENT_ID', value: WORKOS_CONFIG.clientId },
    { key: 'WORKOS_REDIRECT_URI', value: WORKOS_CONFIG.redirectUri },
  ];

  const missing = requiredVars.filter(
    ({ value }) => !value || value.startsWith('your_')
  );

  if (missing.length > 0 && APP_CONFIG.environment !== 'development') {
    const missingKeys = missing.map(({ key }) => key).join(', ');
    throw new Error(
      `Missing required environment variables: ${missingKeys}. ` +
        'Please configure these in your .env file or environment.'
    );
  }

  if (missing.length > 0 && APP_CONFIG.debugMode) {
    console.warn(
      '⚠️  Warning: Using placeholder values for environment variables. ' +
        'Please configure proper values for production use.'
    );
  }
};
