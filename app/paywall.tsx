import { useState, useMemo, useEffect } from 'react';
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
import { useRevenueCatPurchase, useRestorePurchases } from '../src/hooks/useRevenueCatPurchase';
import { useSubscriptionStatus } from '../src/hooks/useSubscriptionStatus';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '@/theme';

type BillingInterval = 'month' | 'year';

function BillingToggle({
  billingInterval,
  onToggle,
  savingsPercent,
  colors,
}: {
  billingInterval: BillingInterval;
  onToggle: (interval: BillingInterval) => void;
  savingsPercent: number;
  colors: ThemeColors;
}) {
  const toggleStyles = useMemo(() => createToggleStyles(colors), [colors]);

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

function PlanCard({
  plan,
  billingInterval,
  isPurchasing,
  onPurchase,
  colors,
}: {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  isPurchasing: boolean;
  onPurchase: (plan: SubscriptionPlan) => void;
  colors: ThemeColors;
}) {
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);
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
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={cardStyles.ctaText}>Start Free Trial</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function PaywallScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { purchase, isPurchasing, purchaseError } = useRevenueCatPurchase();
  const { restore, isRestoring } = useRestorePurchases();
  const { platform, isActive } = useSubscriptionStatus();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [offeringsReady, setOfferingsReady] = useState<boolean | null>(null); // null=loading
  const [offeringsError, setOfferingsError] = useState<string | null>(null);

  // Pre-check that RevenueCat offerings are available
  useEffect(() => {
    let cancelled = false;
    const checkOfferings = async () => {
      try {
        const { default: Purchases } = await import('react-native-purchases');
        const offerings = await Purchases.getOfferings();
        if (cancelled) return;
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          setOfferingsReady(true);
        } else {
          setOfferingsError('No subscription packages are currently available. Please try again later.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setOfferingsError(err?.message || 'Unable to load subscription options. Please try again.');
      }
    };
    checkOfferings();
    return () => { cancelled = true; };
  }, []);

  // Use Premium plan for representative savings percentage
  const premiumPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'midsize')!;
  const savingsPercent = getAnnualSavingsPercent(premiumPlan);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setPurchasingPlanId(plan.id);
    try {
      await purchase({ plan: plan.id, billingInterval });
      Alert.alert('Welcome!', 'Your subscription is now active.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error: any) {
      if (error.message === 'Purchase cancelled') {
        // User intentionally dismissed the store dialog -- do nothing
      } else if (error.message === 'PURCHASE_PENDING') {
        Alert.alert(
          'Purchase Processing',
          'Your purchase was successful but is still being confirmed. This usually takes a few seconds. If your subscription isn\'t active in a few minutes, try pulling down to refresh.'
        );
      } else {
        Alert.alert('Purchase Failed', error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    try {
      await restore();
      Alert.alert('Restored!', 'Your subscription has been restored successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error: any) {
      if (error.message?.includes('No active purchases')) {
        Alert.alert(
          'No Purchases Found',
          'No active subscription was found for this account.'
        );
      } else {
        Alert.alert('Unable to Restore', error.message || 'Please try again later.');
      }
    }
  };

  const handleDismiss = () => {
    // The paywall is reached via router.replace() from index, so there is no
    // previous screen on the stack. Navigate forward to the dashboard if the
    // user now has an active subscription; otherwise stay on the paywall.
    if (isActive === true) {
      router.replace('/(tabs)/dashboard' as any);
    } else if (router.canGoBack()) {
      router.back();
    }
    // If not subscribed and can't go back, do nothing — they need to subscribe.
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
            <ActivityIndicator size="large" color={colors.primary} />
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
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Web subscriber guard */}
        {isActive === true && platform === 'stripe' ? (
          <View style={styles.webGuardContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.primary} />
            <Text style={styles.webGuardTitle}>Already Subscribed via Web</Text>
            <Text style={styles.webGuardMessage}>
              Your subscription is managed through the website. To change your plan, please visit
              centsiblescholar.com.
            </Text>
          </View>
        ) : offeringsError ? (
          <View style={styles.webGuardContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.webGuardTitle}>Unable to Load Plans</Text>
            <Text style={styles.webGuardMessage}>{offeringsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setOfferingsError(null);
                setOfferingsReady(null);
                // Re-trigger the effect by forcing a re-render
                import('react-native-purchases').then(({ default: Purchases }) => {
                  Purchases.getOfferings().then((offerings) => {
                    if (offerings.current && offerings.current.availablePackages.length > 0) {
                      setOfferingsReady(true);
                    } else {
                      setOfferingsError('No subscription packages are currently available. Please try again later.');
                    }
                  }).catch((err: any) => {
                    setOfferingsError(err?.message || 'Unable to load subscription options.');
                  });
                }).catch((err: any) => {
                  setOfferingsError(err?.message || 'Unable to load subscription options.');
                });
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : offeringsReady === null ? (
          <View style={styles.webGuardContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.webGuardTitle}>Loading Plans...</Text>
          </View>
        ) : (
          <>
            {/* Subtitle */}
            <Text style={styles.subtitle}>Start your 30-day free trial today</Text>

            {/* Billing Toggle */}
            <BillingToggle
              billingInterval={billingInterval}
              onToggle={setBillingInterval}
              savingsPercent={savingsPercent}
              colors={colors}
            />

            {/* Plan Cards */}
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingInterval={billingInterval}
                isPurchasing={purchasingPlanId === plan.id}
                onPurchase={handlePurchase}
                colors={colors}
              />
            ))}

            {/* Trial Disclosure */}
            <Text style={styles.trialDisclosure}>
              After your 30-day free trial, you will be charged the selected plan price per{' '}
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
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createToggleStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
      alignItems: 'center',
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: colors.border,
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
    savingsBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    savingsText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textInverse,
    },
  });
}

function createCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    containerPremium: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryLight,
    },
    badge: {
      position: 'absolute',
      top: -12,
      alignSelf: 'center',
      left: '50%',
      marginLeft: -50,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: 12,
      width: 100,
      alignItems: 'center',
    },
    badgeText: {
      color: colors.textInverse,
      fontSize: 12,
      fontWeight: '700',
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
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
      color: colors.text,
    },
    period: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 2,
    },
    annualSaving: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
      marginTop: 2,
    },
    studentLimit: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8,
    },
    featureCount: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    ctaButton: {
      backgroundColor: colors.primary,
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
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
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
      color: colors.text,
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
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    trialDisclosure: {
      fontSize: 12,
      color: colors.textTertiary,
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
      color: colors.primary,
      fontWeight: '500',
    },
    legalText: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
      paddingHorizontal: 16,
    },
    legalLink: {
      color: colors.primary,
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
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    webGuardContainer: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 12,
    },
    webGuardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    webGuardMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 32,
      paddingVertical: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    retryButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
