import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  SUBSCRIPTION_PLANS,
  getAnnualSavingsPercent,
  SubscriptionPlan,
} from '../src/constants/subscriptionPlans';
import { useMockPurchase } from '../src/hooks/useMockPurchase';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/integrations/supabase/client';

type BillingInterval = 'month' | 'year';

function BillingToggle({
  billingInterval,
  onToggle,
  savingsPercent,
}: {
  billingInterval: BillingInterval;
  onToggle: (interval: BillingInterval) => void;
  savingsPercent: number;
}) {
  return (
    <View style={toggleStyles.container}>
      <View style={toggleStyles.toggleRow}>
        <TouchableOpacity
          style={[
            toggleStyles.toggleButton,
            billingInterval === 'month' && toggleStyles.toggleButtonActive,
          ]}
          onPress={() => onToggle('month')}
        >
          <Text
            style={[
              toggleStyles.toggleText,
              billingInterval === 'month' && toggleStyles.toggleTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            toggleStyles.toggleButton,
            billingInterval === 'year' && toggleStyles.toggleButtonActive,
          ]}
          onPress={() => onToggle('year')}
        >
          <Text
            style={[
              toggleStyles.toggleText,
              billingInterval === 'year' && toggleStyles.toggleTextActive,
            ]}
          >
            Annual
          </Text>
          {billingInterval !== 'year' && (
            <View style={toggleStyles.savingsBadge}>
              <Text style={toggleStyles.savingsText}>Save {savingsPercent}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#4F46E5',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});

function PlanCard({
  plan,
  billingInterval,
  isPurchasing,
  onPurchase,
}: {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  isPurchasing: boolean;
  onPurchase: (plan: SubscriptionPlan) => void;
}) {
  const isPremium = plan.id === 'midsize';
  const price = billingInterval === 'month' ? plan.monthlyPrice : plan.annualPrice;
  const periodLabel = billingInterval === 'month' ? '/mo' : '/yr';

  return (
    <View style={[cardStyles.container, isPremium && cardStyles.containerPremium]}>
      {isPremium && plan.badge && (
        <View style={cardStyles.badge}>
          <Text style={cardStyles.badgeText}>{plan.badge}</Text>
        </View>
      )}
      <Text style={cardStyles.name}>{plan.name}</Text>
      <Text style={cardStyles.description}>{plan.description}</Text>
      <View style={cardStyles.priceRow}>
        <Text style={cardStyles.price}>${price.toFixed(2)}</Text>
        <Text style={cardStyles.period}>{periodLabel}</Text>
      </View>
      {billingInterval === 'year' && (
        <Text style={cardStyles.annualSaving}>
          Save {getAnnualSavingsPercent(plan)}% vs monthly
        </Text>
      )}
      <Text style={cardStyles.studentLimit}>
        {plan.studentLimit === 1
          ? '1 student'
          : `Up to ${plan.studentLimit} students`}
      </Text>
      <Text style={cardStyles.featureCount}>
        {plan.features.length} features included
      </Text>
      <TouchableOpacity
        style={[cardStyles.ctaButton, isPurchasing && cardStyles.ctaButtonDisabled]}
        onPress={() => onPurchase(plan)}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={cardStyles.ctaText}>Start Free Trial</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerPremium: {
    borderColor: '#4F46E5',
    borderWidth: 2,
    backgroundColor: '#FAFAFE',
  },
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -50,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    width: 100,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 2,
  },
  annualSaving: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  studentLimit: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  featureCount: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default function PaywallScreen() {
  const { user } = useAuth();
  const { purchase, isPurchasing } = useMockPurchase();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Use Premium plan for representative savings percentage
  const premiumPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'midsize')!;
  const savingsPercent = getAnnualSavingsPercent(premiumPlan);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setPurchasingPlanId(plan.id);
    try {
      await purchase({ plan: plan.id, billingInterval });
      Alert.alert('Welcome!', 'Your 7-day free trial has started.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'An error occurred. Please try again.');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    setIsRestoring(true);
    try {
      // Simulate restore delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) {
        Alert.alert('Error', 'Unable to check for purchases. Please try again.');
        return;
      }

      if (data) {
        Alert.alert('Subscription Restored!', 'Your subscription has been restored successfully.', [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]);
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active subscription was found for this account.'
        );
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDismiss = () => {
    router.back();
  };

  // Determine the displayed price for trial disclosure
  const selectedPlan = SUBSCRIPTION_PLANS[0]; // Default display
  const trialPrice = billingInterval === 'month'
    ? `$${selectedPlan.monthlyPrice.toFixed(2)}`
    : `$${selectedPlan.annualPrice.toFixed(2)}`;
  const trialPeriod = billingInterval === 'month' ? 'month' : 'year';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Loading overlay */}
      {(isPurchasing || isRestoring) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>
              {isRestoring ? 'Restoring...' : 'Processing...'}
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>Start your 7-day free trial today</Text>

        {/* Billing Toggle */}
        <BillingToggle
          billingInterval={billingInterval}
          onToggle={setBillingInterval}
          savingsPercent={savingsPercent}
        />

        {/* Plan Cards */}
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
            isPurchasing={purchasingPlanId === plan.id}
            onPurchase={handlePurchase}
          />
        ))}

        {/* Trial Disclosure */}
        <Text style={styles.trialDisclosure}>
          After your 7-day free trial, you will be charged the selected plan price per{' '}
          {trialPeriod}. Cancel anytime.
        </Text>

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Already subscribed? Restore Purchases</Text>
        </TouchableOpacity>

        {/* Legal Links */}
        <Text style={styles.legalText}>
          By subscribing, you agree to our{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://centsiblescholar.com/terms')}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://centsiblescholar.com/privacy')}
          >
            Privacy Policy
          </Text>
          .
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  trialDisclosure: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  legalText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  legalLink: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
