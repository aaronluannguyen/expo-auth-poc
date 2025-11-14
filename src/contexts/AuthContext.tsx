/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app using React Context.
 *
 * This context:
 * - Manages authentication state (user, tokens, loading, errors)
 * - Provides login, logout, and session restoration methods
 * - Automatically restores sessions on app startup
 * - Handles token refresh transparently
 *
 * Usage:
 * Wrap your app with <AuthProvider> at the root level, then use
 * useAuth() hook in any component to access auth state and methods.
 */

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState, User, AuthTokens, AuthError, AuthErrorType } from '../types/auth.types';
import {
  loginWithWorkOS,
  logout as logoutService,
  restoreSession,
  refreshAccessToken as refreshTokenService,
} from '../services/auth/authService';
import { getTokens } from '../services/auth/tokenStorage';

/**
 * Authentication context methods and state
 */
interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

/**
 * Create the authentication context with undefined default
 * This forces consumers to use the context within a provider
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Manages authentication state and provides methods to child components.
 * Automatically attempts to restore session on mount.
 *
 * @param children - Child components that will have access to auth context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true, // Start as loading to check for existing session
    isAuthenticated: false,
    error: null,
  });

  /**
   * Updates authentication state with user and tokens
   */
  const setAuthSuccess = useCallback((user: User, tokens: AuthTokens) => {
    setAuthState({
      user,
      tokens,
      isLoading: false,
      isAuthenticated: true,
      error: null,
    });
  }, []);

  /**
   * Clears authentication state (user logged out)
   */
  const setAuthLoggedOut = useCallback(() => {
    setAuthState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  /**
   * Sets an error in the authentication state
   */
  const setAuthError = useCallback((error: string) => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: false,
      error,
    }));
  }, []);

  /**
   * Clears any authentication errors
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Initiates the login flow
   *
   * Opens the WorkOS authentication page and handles the OAuth flow.
   * On success, updates the auth state with user and tokens.
   */
  const login = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { user, tokens } = await loginWithWorkOS();
      setAuthSuccess(user, tokens);
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'An unexpected error occurred during login';

      if (error instanceof AuthError) {
        switch (error.type) {
          case AuthErrorType.USER_CANCELLED:
            errorMessage = 'Login was cancelled';
            break;
          case AuthErrorType.NETWORK_ERROR:
            errorMessage = 'Network error. Please check your connection and try again';
            break;
          case AuthErrorType.INVALID_CREDENTIALS:
            errorMessage = 'Authentication failed. Please try again';
            break;
          default:
            errorMessage = error.message;
        }
      }

      setAuthError(errorMessage);
    }
  }, [setAuthSuccess, setAuthError]);

  /**
   * Logs out the user
   *
   * Clears all stored tokens and resets auth state.
   */
  const logout = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await logoutService();
      setAuthLoggedOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setAuthLoggedOut();
    }
  }, [setAuthLoggedOut]);

  /**
   * Manually refreshes the access token
   *
   * This is typically called automatically when a token is about to expire,
   * but can also be called manually if needed.
   */
  const refreshToken = useCallback(async () => {
    try {
      const tokens = await getTokens();

      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await refreshTokenService(tokens.refreshToken);

      // Update state with new tokens, keep existing user
      setAuthState((prev) => ({
        ...prev,
        tokens: newTokens,
        error: null,
      }));
    } catch (error) {
      console.error('Token refresh error:', error);

      // If refresh fails, log the user out
      await logout();

      setAuthError('Your session has expired. Please log in again');
    }
  }, [logout]);

  /**
   * Attempts to restore an existing session on app startup
   *
   * Checks for stored tokens and validates them. If valid,
   * restores the user's session. If expired and a refresh token
   * exists, attempts to refresh. Otherwise, starts with logged out state.
   */
  useEffect(() => {
    const attemptSessionRestore = async () => {
      try {
        const session = await restoreSession();

        if (session) {
          setAuthSuccess(session.user, session.tokens);
        } else {
          setAuthLoggedOut();
        }
      } catch (error) {
        console.error('Session restore error:', error);
        setAuthLoggedOut();
      }
    };

    attemptSessionRestore();
  }, [setAuthSuccess, setAuthLoggedOut]);

  /**
   * Context value provided to consumers
   */
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
