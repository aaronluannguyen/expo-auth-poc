/**
 * App Root Component
 *
 * The main entry point of the application.
 * Sets up the authentication provider and navigation.
 *
 * Architecture:
 * - AuthProvider wraps the entire app to provide auth state
 * - RootNavigator manages navigation and route protection
 * - Environment configuration is validated on startup
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { validateEnvironmentConfig, APP_CONFIG } from './src/config/environment';

export default function App() {
  useEffect(() => {
    // Validate environment configuration on startup
    try {
      validateEnvironmentConfig();
    } catch (error) {
      console.error('Environment configuration error:', error);
      // In a production app, you might want to show an error screen here
    }

    // Log app startup in debug mode
    if (APP_CONFIG.debugMode) {
      console.log('🚀 App started');
      console.log('Environment:', APP_CONFIG.environment);
      console.log('Version:', APP_CONFIG.version);
    }
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
