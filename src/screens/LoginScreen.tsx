/**
 * Login Screen
 *
 * The initial screen shown to unauthenticated users.
 * Provides a button to initiate the WorkOS OAuth flow.
 *
 * Features:
 * - Simple, clean UI with branding
 * - Single "Sign in with WorkOS" button
 * - Error display if authentication fails
 * - Loading state during authentication
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { APP_CONFIG } from '../config/environment';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    try {
      clearError();
      await login();
    } catch (err) {
      // Error is handled by AuthContext and displayed via error state
      console.error('Login error:', err);
    }
  };

  // Show error alert if authentication fails
  React.useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🔐</Text>
          </View>
          <Text style={styles.title}>{APP_CONFIG.name}</Text>
          <Text style={styles.subtitle}>
            Secure authentication powered by WorkOS
          </Text>
        </View>

        {/* Login Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Sign in with WorkOS</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            You'll be redirected to a secure login page
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Enterprise-grade authentication
          </Text>
          <Text style={styles.versionText}>v{APP_CONFIG.version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: '#CCCCCC',
  },
});

export default LoginScreen;
