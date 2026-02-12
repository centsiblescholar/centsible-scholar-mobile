import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Linking, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { signOut, supabase } from '../../src/integrations/supabase/client';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { useSubscriptionStatus } from '../../src/hooks/useSubscriptionStatus';
import { useNotifications } from '../../src/hooks/useNotifications';
import { SUBSCRIPTION_PLANS } from '../../src/constants/subscriptionPlans';
import Constants from 'expo-constants';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile, isStudent, isParent } = useUserProfile();
  const {
    isLoading: subscriptionLoading, isActive, subscriptionTypeDisplay, status, tier, periodEndDate, refetch: refetchSubscription,
  } = useSubscriptionStatus();
  const {
    isEnabled: notificationsEnabled, hasPermission: hasNotificationPermission,
    isLoading: notificationsLoading, toggleNotifications, requestPermission,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([refetchProfile(), refetchSubscription()]); setRefreshing(false); };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await signOut(); router.replace('/(auth)/login'); } catch (error: any) { Alert.alert('Error', error.message || 'Failed to sign out'); } } },
    ]);
  };

  const handleManageSubscription = () => { if (isActive) { router.push('/manage-subscription' as any); } else { router.push('/paywall' as any); } };

  const handleRestorePurchases = async () => {
    if (!user) return;
    setIsRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { data, error } = await supabase.from('user_subscriptions').select('id, status').eq('user_id', user.id).in('status', ['active', 'trialing']).maybeSingle();
      if (error) { Alert.alert('Error', 'Unable to check for purchases. Please try again.'); return; }
      if (data) { Alert.alert('Subscription Restored!', 'Your subscription has been restored successfully.'); refetchSubscription(); }
      else { Alert.alert('No Purchases Found', 'No active subscription was found for this account.'); }
    } finally { setIsRestoring(false); }
  };

  const handleDeleteAccount = () => { router.push('/delete-account' as any); };

  const handleNotificationToggle = async (enabled: boolean) => {
    setTogglingNotifications(true);
    try {
      if (enabled && !hasNotificationPermission) {
        const granted = await requestPermission();
        if (!granted) { Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive reminders.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]); return; }
      }
      await toggleNotifications(enabled);
    } catch (error) { console.error('Error toggling notifications:', error); } finally { setTogglingNotifications(false); }
  };

  const isLoading = profileLoading || subscriptionLoading;
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getStatusBadgeStyle = () => {
    if (isActive) return { backgroundColor: colors.success };
    if (status === 'trialing') return { backgroundColor: colors.info };
    if (status === 'past_due') return { backgroundColor: colors.warning };
    return { backgroundColor: colors.error };
  };
  const getStatusText = () => {
    switch (status) { case 'active': return 'Active'; case 'trialing': return 'Trial'; case 'past_due': return 'Past Due'; case 'canceled': return 'Canceled'; default: return status.charAt(0).toUpperCase() + status.slice(1); }
  };
  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === tier);
  const featureCount = currentPlan?.features.length ?? 0;

  if (isLoading && !refreshing) {
    return <View style={styles.loadingContainer}><SkeletonList count={4} cardHeight={60} /></View>;
  }

  if (profileError) {
    return <View style={styles.container}><ErrorState message="Failed to load settings" onRetry={() => refetchProfile()} /></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            {profile?.name && (<View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{profile.name}</Text></View>)}
            <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user?.email}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Account Type</Text><View style={[styles.typeBadge, isParent ? styles.parentBadge : styles.studentBadge]}><Text style={styles.typeBadgeText}>{isParent ? 'Parent' : 'Student'}</Text></View></View>
            {profile?.grade_level && (<View style={styles.row}><Text style={styles.label}>Grade Level</Text><Text style={styles.value}>{profile.grade_level}</Text></View>)}
            {profile?.base_reward_amount && (<View style={styles.row}><Text style={styles.label}>Base Reward</Text><Text style={styles.value}>{formatCurrency(profile.base_reward_amount)}</Text></View>)}
            <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('/edit-profile' as any)}><Text style={styles.editProfileButtonText}>Edit Profile</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.editProfileButton, { marginTop: 8 }]} onPress={() => router.push('/term-tracking' as any)}><Text style={styles.editProfileButtonText}>Term Tracking</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.editProfileButton, { marginTop: 8 }]} onPress={() => router.push('/family-meetings' as any)}><Text style={styles.editProfileButtonText}>Family Meetings</Text></TouchableOpacity>
            {isParent && (
              <>
                <TouchableOpacity style={[styles.editProfileButton, { marginTop: 8 }]} onPress={() => router.push('/student-management' as any)}><Text style={styles.editProfileButtonText}>Manage Students</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.editProfileButton, { marginTop: 8 }]} onPress={() => router.push('/grade-approval' as any)}><Text style={styles.editProfileButtonText}>Grade Approval</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {isStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tutorial</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(onboarding)/welcome')}>
                <View style={styles.replayRow}><Ionicons name="play-circle-outline" size={22} color={colors.primary} /><View style={styles.replayTextContainer}><Text style={styles.linkText}>Replay Tutorial</Text><Text style={styles.replaySubtitle}>Review how everything works</Text></View></View>
                <Text style={styles.chevron}>&rsaquo;</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isParent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.card}>
              <View style={styles.row}><Text style={styles.label}>Status</Text><View style={styles.statusBadgeRow}><View style={[styles.statusDot, getStatusBadgeStyle()]} /><Text style={[styles.value, styles.statusText]}>{getStatusText()}</Text></View></View>
              <View style={styles.row}><Text style={styles.label}>Plan</Text><Text style={styles.value}>{subscriptionTypeDisplay}</Text></View>
              {featureCount > 0 && (<View style={styles.row}><Text style={styles.label}>Features</Text><Text style={styles.value}>{featureCount} features included</Text></View>)}
              {periodEndDate && (<View style={styles.row}><Text style={styles.label}>Renews</Text><Text style={styles.value}>{periodEndDate}</Text></View>)}
              <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}><Ionicons name="card-outline" size={18} color={colors.primary} /><Text style={styles.manageButtonText}>{isActive ? 'Manage Subscription' : 'Subscribe Now'}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.restoreButton, isRestoring && styles.buttonDisabled]} onPress={handleRestorePurchases} disabled={isRestoring}>
                {isRestoring ? <ActivityIndicator size="small" color={colors.primary} /> : (<><Ionicons name="refresh-circle-outline" size={18} color={colors.primary} /><Text style={styles.restoreButtonText}>Restore Purchases</Text></>)}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Ionicons name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'} size={24} color={notificationsEnabled ? colors.primary : colors.textTertiary} />
                <View style={styles.notificationText}>
                  <Text style={styles.label}>Push Notifications</Text>
                  <Text style={styles.notificationDescription}>{notificationsEnabled ? 'Receive meeting reminders and alerts' : 'Enable to receive reminders'}</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled} onValueChange={handleNotificationToggle}
                disabled={togglingNotifications || notificationsLoading}
                trackColor={{ false: colors.borderDark, true: indigo[300] }}
                thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
            {notificationsEnabled && (
              <View style={styles.notificationTypes}>
                {[{ icon: 'calendar-outline' as const, text: 'Meeting reminders' }, { icon: 'school-outline' as const, text: 'Grade updates' }, { icon: 'alert-circle-outline' as const, text: 'Behavior alerts' }, { icon: 'bulb-outline' as const, text: 'Daily question reminders' }].map((item) => (
                  <View key={item.text} style={styles.notificationTypeRow}><Ionicons name={item.icon} size={18} color={colors.textSecondary} /><Text style={styles.notificationTypeText}>{item.text}</Text></View>
                ))}
              </View>
            )}
          </View>
        </View>

        {isParent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.card}>
              <TouchableOpacity style={[styles.linkRow, styles.linkRowLast]} onPress={() => router.push('/data-export' as any)}>
                <View style={styles.privacyRow}><Ionicons name="download-outline" size={22} color={colors.primary} /><Text style={styles.linkText}>Export My Data</Text></View>
                <Text style={styles.chevron}>&rsaquo;</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.label}>Version</Text><Text style={styles.value}>{Constants.expoConfig?.version || '1.0.0'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Build</Text><Text style={styles.value}>{Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1'}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            {[{ label: 'Help Center', url: 'https://centsiblescholar.com/help' }, { label: 'Contact Support', url: 'mailto:support@centsiblescholar.com' }, { label: 'Privacy Policy', url: 'https://centsiblescholar.com/privacy' }].map((item) => (
              <TouchableOpacity key={item.label} style={styles.linkRow} onPress={() => Linking.openURL(item.url)}><Text style={styles.linkText}>{item.label}</Text><Text style={styles.chevron}>&rsaquo;</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.linkRow, styles.linkRowLast]} onPress={() => Linking.openURL('https://centsiblescholar.com/terms')}><Text style={styles.linkText}>Terms of Service</Text><Text style={styles.chevron}>&rsaquo;</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}><Text style={styles.signOutRowText}>Sign Out</Text></TouchableOpacity>
            {isParent && (<TouchableOpacity style={[styles.deleteRow, styles.linkRowLast]} onPress={handleDeleteAccount}><Text style={styles.deleteRowText}>Delete Account</Text></TouchableOpacity>)}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary, minHeight: 44 },
  label: { fontSize: 16, color: colors.text },
  value: { fontSize: 16, color: colors.textSecondary },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  parentBadge: { backgroundColor: colors.primaryLight },
  studentBadge: { backgroundColor: tints.green },
  typeBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  editProfileButton: { marginTop: 12, padding: 12, backgroundColor: colors.primaryLight, borderRadius: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  editProfileButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  manageButton: { marginTop: 12, padding: 12, backgroundColor: colors.primaryLight, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 44 },
  manageButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  restoreButton: { marginTop: 8, padding: 12, backgroundColor: colors.backgroundSecondary, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 44 },
  restoreButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  buttonDisabled: { opacity: 0.7 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary, minHeight: 44 },
  linkRowLast: { borderBottomWidth: 0 },
  linkText: { fontSize: 16, color: colors.primary },
  chevron: { fontSize: 20, color: colors.textTertiary },
  signOutRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary, minHeight: 44, justifyContent: 'center' },
  signOutRowText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  deleteRow: { paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  deleteRowText: { fontSize: 16, color: colors.error, fontWeight: '500' },
  replayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  replayTextContainer: { flex: 1 },
  replaySubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  notificationInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  notificationText: { marginLeft: 12, flex: 1 },
  notificationDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  notificationTypes: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.backgroundSecondary },
  notificationTypeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, minHeight: 44 },
  notificationTypeText: { fontSize: 14, color: colors.textSecondary, marginLeft: 12 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
