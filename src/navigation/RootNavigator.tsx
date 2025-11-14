/**
 * Root Navigator
 *
 * Manages the app's navigation structure and implements protected routes.
 *
 * Navigation Flow:
 * - Shows LoginScreen for unauthenticated users
 * - Shows authenticated stack (Home, Profile) for logged-in users
 * - Shows loading screen during authentication check
 *
 * Features:
 * - Automatic route protection based on auth state
 * - Smooth transitions between auth states
 * - Persistent navigation state
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

/**
 * Root navigation stack param list
 * Defines all routes and their parameters
 */
export type RootStackParamList = {
  // Unauthenticated routes
  Login: undefined;

  // Authenticated routes
  Home: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator Component
 *
 * Conditionally renders different navigation stacks based on
 * the user's authentication state.
 */
export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Stack
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
              // Prevent going back to auth screens after logout
              gestureEnabled: false,
            }}
          />
        ) : (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'Home',
                // Prevent going back to login after authentication
                gestureEnabled: false,
                headerLeft: () => null,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: 'Profile',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
