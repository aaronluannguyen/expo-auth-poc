/**
 * useAuth Hook
 *
 * Custom React hook that provides easy access to authentication context.
 *
 * This hook:
 * - Provides access to auth state (user, tokens, loading, errors)
 * - Provides auth methods (login, logout, refreshToken)
 * - Ensures the hook is used within an AuthProvider
 * - Provides type-safe access to all auth functionality
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <LoginButton onPress={login} />;
 * return <Profile user={user} onLogout={logout} />;
 * ```
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook to access authentication context
 *
 * @returns Authentication state and methods
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const { user, logout, isLoading } = useAuth();
 *
 *   if (isLoading) {
 *     return <ActivityIndicator />;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Welcome, {user?.firstName}!</Text>
 *       <Button title="Logout" onPress={logout} />
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Make sure your component is wrapped with <AuthProvider>.'
    );
  }

  return context;
};

/**
 * Hook to check if user is authenticated
 *
 * Convenience hook that returns only the authentication status.
 * Useful for simple conditional rendering without accessing the full context.
 *
 * @returns Boolean indicating if user is authenticated
 *
 * @example
 * ```tsx
 * function ProtectedButton() {
 *   const isAuthenticated = useIsAuthenticated();
 *
 *   if (!isAuthenticated) {
 *     return null;
 *   }
 *
 *   return <Button title="Protected Action" />;
 * }
 * ```
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user
 *
 * Convenience hook that returns only the current user.
 * Returns null if no user is authenticated.
 *
 * @returns Current user or null
 *
 * @example
 * ```tsx
 * function UserGreeting() {
 *   const user = useCurrentUser();
 *
 *   if (!user) {
 *     return <Text>Please log in</Text>;
 *   }
 *
 *   return <Text>Hello, {user.firstName}!</Text>;
 * }
 * ```
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

export default useAuth;
