import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  SUBSCRIPTION_PLANS,
  getStudentLimit,
  getAnnualSavingsPercent,
  SubscriptionPlan,
} from '../src/constants/subscriptionPlans';
import { useRevenueCatPurchase } from '../src/hooks/useRevenueCatPurchase';
import { useSubscriptionStatus, subscriptionKeys } from '../src/hooks/useSubscriptionStatus';
import { useStudentManagement } from '../src/hooks/useStudentManagement';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/integrations/supabase/client';
import { useTheme, type ThemeColors } from '@/theme';

type BillingInterval = 'month' | 'year';

export default function ManageSubscriptionScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const {
    subscription,
    isActive,
    tier,
    status,
    periodEndDate,
    subscriptionTypeDisplay,
    refetch: refetchSubscription,
  } = useSubscriptionStatus();
  const { activeStudents } = useStudentManagement();
  const { purchase, isPurchasing } = useRevenueCatPurchase();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [switchingPlanId, setSwitchingPlanId] = useState<string | null>(null);

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === tier);
  const studentLimit = getStudentLimit(tier);

  const getStatusBadgeStyle = () => {
    if (status === 'active') return styles.badgeActive;
    if (status === 'trialing') return styles.badgeTrialing;
    return styles.badgeInactive;
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'canceled':
        return 'Canceled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleSwitchPlan = (targetPlan: SubscriptionPlan) => {
    if (!currentPlan || targetPlan.id === currentPlan.id) return;

    const isDowngrade = targetPlan.studentLimit < currentPlan.studentLimit;
    const title = isDowngrade
      ? `Downgrade to ${targetPlan.name}?`
      : `Upgrade to ${targetPlan.name}?`;
    const message = isDowngrade
      ? `You'll have a limit of ${targetPlan.studentLimit} student${targetPlan.studentLimit !== 1 ? 's' : ''}. If you currently have more, you won't be able to add new students until you're under the limit.`
      : `You'll be able to have up to ${targetPlan.studentLimit} student${targetPlan.studentLimit !== 1 ? 's' : ''}.`;
    const confirmText = isDowngrade ? 'Confirm Downgrade' : 'Confirm Upgrade';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmText,
        onPress: async () => {
          setSwitchingPlanId(targetPlan.id);
          try {
            await purchase({ plan: targetPlan.id, billingInterval });
            Alert.alert('Plan Updated!', `You're now on the ${targetPlan.name} plan.`);
            refetchSubscription();
          } catch (error: any) {
            if (error.message === 'Purchase cancelled') {
              // User intentionally dismissed the store dialog -- do nothing
            } else if (error.message === 'PURCHASE_PENDING') {
              Alert.alert(
                'Plan Change Processing',
                'Your plan change was successful but is still being confirmed. This usually takes a few seconds. If your plan hasn\'t updated in a few minutes, try pulling down to refresh.'
              );
            } else {
              Alert.alert('Error', error.message || 'Failed to update plan. Please try again.');
            }
          } finally {
            setSwitchingPlanId(null);
          }
        },
      },
    ]);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription?',
      "You'll lose access to all features at the end of your current billing period.",
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            if (!subscription?.id) return;
            try {
              const { error } = await supabase
                .from('user_subscriptions')
                .update({ status: 'canceled', updated_at: new Date().toISOString() })
                .eq('id', subscription.id);

              if (error) {
                Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
                return;
              }

              refetchSubscription();
              Alert.alert(
                'Subscription Canceled',
                `You'll have access until ${periodEndDate || 'the end of your billing period'}.`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  // Debug tools: update subscription state for testing
  const handleDebugSetStatus = async (newStatus: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Debug Error', error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      Alert.alert('Debug', `Status set to "${newStatus}"`);
    } catch (err: any) {
      Alert.alert('Debug Error', err.message);
    }
  };

  const handleDebugDeleteSub = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Debug Error', error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      Alert.alert('Debug', 'Subscription row deleted');
    } catch (err: any) {
      Alert.alert('Debug Error', err.message);
    }
  };

  const currentPrice = currentPlan
    ? billingInterval === 'month'
      ? `$${currentPlan.monthlyPrice.toFixed(2)}/mo`
      : `$${currentPlan.annualPrice.toFixed(2)}/yr`
    : '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Current Plan Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryPlanName}>{subscriptionTypeDisplay}</Text>
          <View style={[styles.statusBadge, getStatusBadgeStyle()]}>
            <Text style={styles.statusBadgeText}>{getStatusLabel()}</Text>
          </View>
        </View>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.summaryText}>
              {activeStudents.length} of {studentLimit > 0 ? studentLimit : '--'} students
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.summaryText}>
              {status === 'trialing'
                ? `Trial ends ${periodEndDate || '--'}`
                : `Renews ${periodEndDate || '--'}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="card-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.summaryText}>{currentPrice}</Text>
          </View>
        </View>
      </View>

      {/* Change Plan Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Plan</Text>

        {/* Billing Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, billingInterval === 'month' && styles.toggleActive]}
            onPress={() => setBillingInterval('month')}
          >
            <Text style={[styles.toggleText, billingInterval === 'month' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, billingInterval === 'year' && styles.toggleActive]}
            onPress={() => setBillingInterval('year')}
          >
            <Text style={[styles.toggleText, billingInterval === 'year' && styles.toggleTextActive]}>
              Annual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan Options */}
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = plan.id === tier;
          const price = billingInterval === 'month' ? plan.monthlyPrice : plan.annualPrice;
          const periodLabel = billingInterval === 'month' ? '/mo' : '/yr';
          const isSwitching = switchingPlanId === plan.id;

          return (
            <View
              key={plan.id}
              style={[styles.planRow, isCurrent && styles.planRowCurrent]}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  ${price.toFixed(2)}
                  <Text style={styles.planPeriod}>{periodLabel}</Text>
                </Text>
                <Text style={styles.planLimit}>
                  {plan.studentLimit === 1
                    ? '1 student'
                    : `Up to ${plan.studentLimit} students`}
                </Text>
              </View>
              <View style={styles.planAction}>
                {isCurrent ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.switchButton, isSwitching && styles.switchButtonDisabled]}
                    onPress={() => handleSwitchPlan(plan)}
                    disabled={isPurchasing || isSwitching}
                  >
                    {isSwitching ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={styles.switchButtonText}>Switch</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cancel Subscription */}
      {isActive && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
          <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
        </TouchableOpacity>
      )}

      {/* Dev-only Debug Section */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Tools (Dev Only)</Text>
          <View style={styles.debugGrid}>
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: colors.success }]}
              onPress={() => handleDebugSetStatus('active')}
            >
              <Text style={styles.debugButtonText}>Set Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: colors.info }]}
              onPress={() => handleDebugSetStatus('trialing')}
            >
              <Text style={styles.debugButtonText}>Set Trialing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: colors.warning }]}
              onPress={() => handleDebugSetStatus('canceled')}
            >
              <Text style={styles.debugButtonText}>Set Canceled</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: colors.error }]}
              onPress={handleDebugDeleteSub}
            >
              <Text style={styles.debugButtonText}>Delete Sub</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    scrollContent: {
      padding: 16,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    summaryPlanName: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeActive: {
      backgroundColor: colors.success + '22',
    },
    badgeTrialing: {
      backgroundColor: colors.info + '22',
    },
    badgeInactive: {
      backgroundColor: colors.error + '22',
    },
    statusBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    summaryDetails: {
      gap: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    summaryText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    toggleTextActive: {
      color: colors.primary,
    },
    planRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    planRowCurrent: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryLight,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    planPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    planPeriod: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    planLimit: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    planAction: {
      marginLeft: 12,
    },
    currentBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    currentBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    switchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 80,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchButtonDisabled: {
      opacity: 0.7,
    },
    switchButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 14,
      marginBottom: 24,
      minHeight: 44,
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '600',
    },
    debugSection: {
      marginTop: 8,
      backgroundColor: colors.warning + '15',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.warning + '66',
    },
    debugTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.warning,
      marginBottom: 12,
    },
    debugGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    debugButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      minHeight: 44,
      justifyContent: 'center',
    },
    debugButtonText: {
      color: colors.textInverse,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
