import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { signOut } from '../../src/integrations/supabase/client';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useSubscriptionStatus } from '../../src/hooks/useSubscriptionStatus';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useStudentProfile();
  const {
    isLoading: subscriptionLoading,
    isActive,
    subscriptionTypeDisplay,
    status,
    periodEndDate,
    refetch: refetchSubscription,
  } = useSubscriptionStatus();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchSubscription()]);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Linking.openURL('https://centsiblescholar.com/settings');
  };

  const isLoading = profileLoading || subscriptionLoading;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getStatusColor = () => {
    if (isActive) return styles.valueGreen;
    if (status === 'trialing') return styles.valueBlue;
    if (status === 'past_due') return styles.valueOrange;
    return styles.valueRed;
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            {profile?.name && (
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{profile.name}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
            {profile?.grade_level && (
              <View style={styles.row}>
                <Text style={styles.label}>Grade Level</Text>
                <Text style={styles.value}>{profile.grade_level}</Text>
              </View>
            )}
            {profile?.base_reward_amount && (
              <View style={styles.row}>
                <Text style={styles.label}>Base Reward</Text>
                <Text style={styles.value}>
                  {formatCurrency(profile.base_reward_amount)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, getStatusColor()]}>{getStatusText()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plan</Text>
              <Text style={styles.value}>{subscriptionTypeDisplay}</Text>
            </View>
            {periodEndDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Renews</Text>
                <Text style={styles.value}>{periodEndDate}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>
                {Constants.expoConfig?.version || '1.0.0'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Build</Text>
              <Text style={styles.value}>
                {Constants.expoConfig?.ios?.buildNumber ||
                 Constants.expoConfig?.android?.versionCode ||
                 '1'}
              </Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL('https://centsiblescholar.com/help')}
            >
              <Text style={styles.linkText}>Help Center</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL('mailto:support@centsiblescholar.com')}
            >
              <Text style={styles.linkText}>Contact Support</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkRow, styles.linkRowLast]}
              onPress={() => Linking.openURL('https://centsiblescholar.com/privacy')}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 16,
    color: '#111827',
  },
  value: {
    fontSize: 16,
    color: '#6B7280',
  },
  valueGreen: {
    color: '#10B981',
    fontWeight: '600',
  },
  valueBlue: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  valueOrange: {
    color: '#F97316',
    fontWeight: '600',
  },
  valueRed: {
    color: '#EF4444',
    fontWeight: '600',
  },
  manageButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkText: {
    fontSize: 16,
    color: '#4F46E5',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
