/**
 * Profile Screen
 *
 * Displays detailed user profile information and account management options.
 *
 * Features:
 * - Complete user profile display
 * - Token information (for development/debugging)
 * - Logout functionality
 * - Clean, card-based layout
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProfileScreen: React.FC = () => {
  const { user, tokens, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  // Format token expiration
  const getTokenExpirationText = () => {
    if (!tokens?.expiresIn) return 'Unknown';

    const hours = Math.floor(tokens.expiresIn / 3600);
    const minutes = Math.floor((tokens.expiresIn % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.profilePictureUrl ? (
              // If you want to display actual images, uncomment this and import Image
              // <Image source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
              <Text style={styles.avatarText}>
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </Text>
            ) : (
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.email[0].toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            {user?.firstName && (
              <InfoRow label="First Name" value={user.firstName} />
            )}
            {user?.lastName && (
              <InfoRow label="Last Name" value={user.lastName} />
            )}
            <InfoRow label="Email" value={user?.email || 'N/A'} />
            <InfoRow label="User ID" value={user?.id || 'N/A'} />
            {user?.organizationId && (
              <InfoRow label="Organization ID" value={user.organizationId} />
            )}
          </View>
        </View>

        {/* Session Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <View style={styles.card}>
            <InfoRow label="Token Type" value={tokens?.tokenType || 'N/A'} />
            <InfoRow label="Expires In" value={getTokenExpirationText()} />
            <InfoRow
              label="Has Refresh Token"
              value={tokens?.refreshToken ? 'Yes' : 'No'}
            />
            <InfoRow
              label="Has ID Token"
              value={tokens?.idToken ? 'Yes' : 'No'}
            />
          </View>
        </View>

        {/* Security Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>🔐</Text>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>OAuth 2.0 with PKCE</Text>
                <Text style={styles.securityDescription}>
                  Your credentials are secure and never stored on this device
                </Text>
              </View>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>🔑</Text>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Encrypted Storage</Text>
                <Text style={styles.securityDescription}>
                  Tokens are encrypted using platform secure storage
                </Text>
              </View>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>♻️</Text>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Auto-Refresh</Text>
                <Text style={styles.securityDescription}>
                  Session is automatically renewed when needed
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
  },
  securityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  securityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});

export default ProfileScreen;
