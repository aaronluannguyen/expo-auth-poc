/**
 * Authentication Types
 *
 * Defines all TypeScript interfaces and types used throughout
 * the authentication system.
 */

/**
 * Represents OAuth tokens received from WorkOS
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number; // Expiration time in seconds
  tokenType: string;
}

/**
 * User profile information decoded from ID token or fetched from API
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  organizationId?: string;
}

/**
 * Authentication state that tracks the current user and loading status
 */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * WorkOS OAuth configuration
 */
export interface WorkOSConfig {
  clientId: string;
  redirectUri: string;
  discoveryUrl: string;
}

/**
 * Token refresh response from WorkOS
 */
export interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * User info response from WorkOS
 */
export interface UserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
  organization_id?: string;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  USER_CANCELLED = 'USER_CANCELLED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  type: AuthErrorType;
  originalError?: Error;

  constructor(type: AuthErrorType, message: string, originalError?: Error) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.name = 'AuthError';
  }
}
