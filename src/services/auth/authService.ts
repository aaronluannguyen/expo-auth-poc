/**
 * Authentication Service
 *
 * Handles OAuth 2.0 with PKCE (Proof Key for Code Exchange) flow for WorkOS.
 *
 * PKCE Flow Overview:
 * 1. Generate a random code verifier
 * 2. Create a code challenge from the verifier (SHA256 hash)
 * 3. Send user to authorization endpoint with code challenge
 * 4. User authenticates with their identity provider
 * 5. Redirect back to app with authorization code
 * 6. Exchange code + code verifier for tokens
 *
 * Security Benefits of PKCE:
 * - Protects against authorization code interception attacks
 * - No client secret needed (secure for mobile apps)
 * - Each authorization request uses a unique code verifier
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import {
  AuthTokens,
  User,
  UserInfoResponse,
  TokenRefreshResponse,
  AuthError,
  AuthErrorType,
} from '../../types/auth.types';
import { WORKOS_CONFIG, SECURITY_CONFIG } from '../../config/environment';
import { storeTokens, getTokens, clearTokens, isTokenExpired } from './tokenStorage';

// Enable WebBrowser to handle authentication results properly
WebBrowser.maybeCompleteAuthSession();

/**
 * Generate a random code verifier for PKCE
 * Returns a base64url-encoded random string (43-128 characters)
 */
const generateCodeVerifier = (): string => {
  const randomBytes = Crypto.getRandomBytes(32);
  // Convert Uint8Array to base64
  const base64 = btoa(String.fromCharCode(...randomBytes));
  // Convert to base64url format (URL-safe)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Generate code challenge from verifier
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  // Convert to base64url format
  return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Initiates the OAuth login flow with WorkOS
 *
 * This function:
 * 1. Generates a PKCE code verifier and challenge
 * 2. Opens a web browser for user authentication
 * 3. Handles the redirect back to the app
 * 4. Exchanges the authorization code for tokens
 *
 * @returns Authentication tokens and user information
 * @throws AuthError if authentication fails
 */
export const loginWithWorkOS = async (): Promise<{
  tokens: AuthTokens;
  user: User;
}> => {
  try {
    // Create the authorization request with PKCE
    const discovery = {
      authorizationEndpoint: WORKOS_CONFIG.authorizationEndpoint,
      tokenEndpoint: WORKOS_CONFIG.tokenEndpoint,
    };

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authRequest = new AuthSession.AuthRequest({
      clientId: WORKOS_CONFIG.clientId,
      redirectUri: WORKOS_CONFIG.redirectUri,
      scopes: WORKOS_CONFIG.scopes,
      usePKCE: false, // We handle PKCE manually
      codeChallenge,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      // Additional parameters that WorkOS may use
      extraParams: {
        // Can add organization, connection, or other WorkOS-specific params
        // organization: 'org_xxx', // If you want to restrict to specific org
        // provider: 'GoogleOAuth', // If you want to bypass the provider selection
      },
    });

    // Prompt user to authenticate
    const authResult = await authRequest.promptAsync(discovery);

    // Handle user cancellation
    if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
      throw new AuthError(
        AuthErrorType.USER_CANCELLED,
        'User cancelled the authentication process'
      );
    }

    // Handle authentication errors and check for success with code
    if (authResult.type !== 'success') {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Authentication failed'
      );
    }

    if (!authResult.params.code) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'No authorization code received'
      );
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(
      authResult.params.code,
      codeVerifier
    );

    // Store tokens securely
    await storeTokens(tokens);

    // Fetch user information using the access token
    const user = await fetchUserInfo(tokens.accessToken);

    return { tokens, user };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error('Login failed:', error);
    throw new AuthError(
      AuthErrorType.UNKNOWN_ERROR,
      'An unexpected error occurred during login',
      error as Error
    );
  }
};

/**
 * Exchanges an authorization code for access tokens
 *
 * @param code - The authorization code from the OAuth callback
 * @param codeVerifier - The PKCE code verifier
 * @returns Authentication tokens
 * @throws AuthError if exchange fails
 */
const exchangeCodeForTokens = async (
  code: string,
  codeVerifier: string
): Promise<AuthTokens> => {
  try {
    const tokenResponse = await fetch(WORKOS_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: WORKOS_CONFIG.clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: WORKOS_CONFIG.redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error_description || `Token exchange failed: ${tokenResponse.status}`
      );
    }

    const tokenData: TokenRefreshResponse = await tokenResponse.json();

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    };
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw new AuthError(
      AuthErrorType.NETWORK_ERROR,
      'Failed to exchange authorization code for tokens',
      error as Error
    );
  }
};

/**
 * Fetches user information from WorkOS UserInfo endpoint
 *
 * @param accessToken - Valid access token
 * @returns User profile information
 * @throws AuthError if fetch fails
 */
export const fetchUserInfo = async (accessToken: string): Promise<User> => {
  try {
    const response = await fetch(WORKOS_CONFIG.userInfoEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    const userInfo: UserInfoResponse = await response.json();

    return {
      id: userInfo.sub,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      profilePictureUrl: userInfo.picture,
      organizationId: userInfo.organization_id,
    };
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    throw new AuthError(
      AuthErrorType.NETWORK_ERROR,
      'Failed to fetch user information',
      error as Error
    );
  }
};

/**
 * Refreshes the access token using the refresh token
 *
 * @param refreshToken - The refresh token
 * @returns New authentication tokens
 * @throws AuthError if refresh fails
 */
export const refreshAccessToken = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const response = await fetch(WORKOS_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: WORKOS_CONFIG.clientId,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error_description || `Token refresh failed: ${response.status}`
      );
    }

    const tokenData: TokenRefreshResponse = await response.json();

    const tokens: AuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
      idToken: tokenData.id_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    };

    // Store the new tokens
    await storeTokens(tokens);

    return tokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new AuthError(
      AuthErrorType.REFRESH_FAILED,
      'Failed to refresh access token',
      error as Error
    );
  }
};

/**
 * Logs out the user by clearing all stored tokens
 *
 * @throws AuthError if logout fails
 */
export const logout = async (): Promise<void> => {
  try {
    await clearTokens();
  } catch (error) {
    console.error('Logout failed:', error);
    throw new AuthError(
      AuthErrorType.UNKNOWN_ERROR,
      'Failed to log out',
      error as Error
    );
  }
};

/**
 * Attempts to restore authentication session from stored tokens
 *
 * This should be called on app startup to check if the user
 * has a valid session.
 *
 * @returns User and tokens if session is valid, null otherwise
 */
export const restoreSession = async (): Promise<{
  tokens: AuthTokens;
  user: User;
} | null> => {
  try {
    // Get stored tokens
    const tokens = await getTokens();

    if (!tokens) {
      return null;
    }

    // Check if access token is expired
    const expired = await isTokenExpired(SECURITY_CONFIG.tokenRefreshBuffer);

    if (expired && tokens.refreshToken) {
      // Try to refresh the token
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken);
        const user = await fetchUserInfo(newTokens.accessToken);
        return { tokens: newTokens, user };
      } catch (error) {
        // If refresh fails, clear tokens and return null
        await clearTokens();
        return null;
      }
    } else if (expired) {
      // Token expired and no refresh token available
      await clearTokens();
      return null;
    }

    // Token is still valid, fetch user info
    const user = await fetchUserInfo(tokens.accessToken);
    return { tokens, user };
  } catch (error) {
    console.error('Failed to restore session:', error);
    // On any error, clear tokens and return null
    await clearTokens();
    return null;
  }
};

/**
 * Gets the current valid access token, refreshing if necessary
 *
 * @returns Valid access token or null if not authenticated
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  try {
    const tokens = await getTokens();

    if (!tokens) {
      return null;
    }

    const expired = await isTokenExpired(SECURITY_CONFIG.tokenRefreshBuffer);

    if (expired && tokens.refreshToken) {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      return newTokens.accessToken;
    } else if (expired) {
      return null;
    }

    return tokens.accessToken;
  } catch (error) {
    console.error('Failed to get valid access token:', error);
    return null;
  }
};
