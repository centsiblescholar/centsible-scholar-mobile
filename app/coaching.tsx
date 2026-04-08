import { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COACHING_PRODUCT } from '../src/constants/coachingProduct';
import {
  useCoachingPurchase,
  useRestorePurchases,
} from '../src/hooks/useRevenueCatPurchase';
import { useTheme, type ThemeColors } from '@/theme';

export default function CoachingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { purchase, isPurchasing } = useCoachingPurchase();
  const { restore, isRestoring } = useRestorePurchases();
  const [hasPurchased, setHasPurchased] = useState(false);

  const openBookingLink = () => {
    Linking.openURL(COACHING_PRODUCT.bookingUrl).catch(() => {
      Alert.alert(
        'Unable to open link',
        `Please visit ${COACHING_PRODUCT.bookingUrl} in your browser.`
      );
    });
  };

  const handleBuy = async () => {
    try {
      await purchase();
      setHasPurchased(true);
      Alert.alert(
        'Purchase Complete!',
        'Tap "Open Booking Link" to schedule your coaching session.',
        [
          { text: 'Done', style: 'cancel' },
          { text: 'Open Booking Link', onPress: openBookingLink },
        ]
      );
    } catch (error: any) {
      if (error?.message === 'Purchase cancelled') return;
      Alert.alert(
        'Error',
        error?.message || 'Failed to complete purchase. Please try again.'
      );
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert(
        'Purchases Restored',
        'Any previous purchases have been restored to this device.'
      );
    } catch (error: any) {
      // Consumables do not restore; surface a friendly message.
      Alert.alert(
        'No Purchases to Restore',
        'Coaching sessions are one-time purchases and cannot be restored. If you have an unused session, use the booking link below.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="school" size={28} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>{COACHING_PRODUCT.name}</Text>
        <Text style={styles.heroPrice}>
          ${COACHING_PRODUCT.price}
          <Text style={styles.heroPriceUnit}> / {COACHING_PRODUCT.unit}</Text>
        </Text>
        <Text style={styles.heroTagline}>{COACHING_PRODUCT.description}</Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.card}>
          {COACHING_PRODUCT.features.map((feature, idx) => (
            <View
              key={feature}
              style={[
                styles.featureRow,
                idx === COACHING_PRODUCT.features.length - 1 && styles.featureRowLast,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Purchase a session below</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Open the booking link</Text>
          </View>
          <View style={[styles.stepRow, styles.stepRowLast]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Schedule your call</Text>
          </View>
        </View>
      </View>

      {/* Buy CTA */}
      <TouchableOpacity
        style={[styles.buyButton, isPurchasing && styles.buyButtonDisabled]}
        onPress={handleBuy}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={styles.buyButtonText}>
            Buy Session — ${COACHING_PRODUCT.price}
          </Text>
        )}
      </TouchableOpacity>

      {/* Post-purchase shortcut to the booking link */}
      {hasPurchased && (
        <TouchableOpacity style={styles.bookingShortcut} onPress={openBookingLink}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.bookingShortcutText}>Open Booking Link</Text>
        </TouchableOpacity>
      )}

      {/* Restore Purchases (Apple guideline: every IAP screen needs this) */}
      <TouchableOpacity
        style={[styles.restoreButton, isRestoring && styles.buyButtonDisabled]}
        onPress={handleRestore}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* Fine print */}
      <Text style={styles.footer}>
        Charged to your Apple ID. Bookings are scheduled separately on our
        website after purchase.
      </Text>

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
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    heroIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    heroPrice: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 8,
    },
    heroPriceUnit: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    heroTagline: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    featureRowLast: {
      borderBottomWidth: 0,
    },
    featureIcon: {
      marginRight: 12,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    stepRowLast: {
      borderBottomWidth: 0,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    stepText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    buyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      marginBottom: 12,
    },
    buyButtonDisabled: {
      opacity: 0.7,
    },
    buyButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '700',
    },
    bookingShortcut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      marginBottom: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      minHeight: 44,
    },
    bookingShortcutText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    restoreButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginBottom: 16,
      minHeight: 44,
    },
    restoreButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 16,
    },
  });
}
