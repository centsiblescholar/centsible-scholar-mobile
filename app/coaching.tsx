import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COACHING_PRODUCT } from '../src/constants/coachingProduct';
import {
  useCoachingPurchase,
  useRestorePurchases,
} from '../src/hooks/useRevenueCatPurchase';
import { supabase } from '../src/integrations/supabase/client';
import { useTheme, type ThemeColors } from '@/theme';

export default function CoachingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { purchase, isPurchasing } = useCoachingPurchase();
  const { restore, isRestoring } = useRestorePurchases();

  // Form state — mirrors the web CoachingSection.tsx dialog fields.
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bestDayToCall, setBestDayToCall] = useState('');
  const [bestTimeToCall, setBestTimeToCall] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const busy = isCreatingOrder || isPurchasing;

  const handleBuy = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      Alert.alert(
        'Phone Number Required',
        'Please enter the phone number your coach should call to schedule your session.'
      );
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Step 1 — create the pending coaching_orders row with the buyer's
      // contact info. Apple IAP cannot ferry metadata, so the row must exist
      // before we call Purchases.purchasePackage().
      const { data, error } = await supabase.functions.invoke('create-coaching-iap-order', {
        body: {
          customerName: customerName.trim(),
          phoneNumber: trimmedPhone,
          bestDayToCall: bestDayToCall.trim(),
          bestTimeToCall: bestTimeToCall.trim(),
          sessionNotes: sessionNotes.trim(),
        },
      });

      if (error || !data?.orderId) {
        Alert.alert(
          'Could not prepare booking',
          error?.message ||
            'Something went wrong saving your booking details. Please try again.'
        );
        return;
      }

      setIsCreatingOrder(false);

      // Step 2 — trigger the Apple IAP. The RevenueCat webhook will find the
      // pending row above and flip it to `paid` + fire the notification email
      // to Dr. Rich. We don't poll or wait for confirmation — trust the SDK
      // return and show the confirmation immediately.
      await purchase();

      Alert.alert(
        'Payment Complete!',
        `Thank you! A coach will call you at ${trimmedPhone}${
          bestDayToCall || bestTimeToCall
            ? ` ${[bestDayToCall, bestTimeToCall].filter(Boolean).join(' ')}`
            : ''
        }. You'll get an email confirmation shortly.`,
        [{ text: 'OK' }]
      );

      // Reset the form so repeat buyers don't accidentally re-submit stale data.
      setCustomerName('');
      setPhoneNumber('');
      setBestDayToCall('');
      setBestTimeToCall('');
      setSessionNotes('');
    } catch (error: any) {
      if (error?.message === 'Purchase cancelled') return;
      Alert.alert(
        'Error',
        error?.message ||
          'The payment did not complete. If you were charged, please email coaching@centsiblescholar.com with your name and phone number and we will follow up.'
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert(
        'Purchases Restored',
        'Any previous purchases have been restored to this device.'
      );
    } catch {
      Alert.alert(
        'No Purchases to Restore',
        'Coaching sessions are one-time purchases and cannot be restored. If you have already paid but did not receive a booking call, please email coaching@centsiblescholar.com.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
              <Text style={styles.stepText}>Fill out the form below</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Complete payment via Apple</Text>
            </View>
            <View style={[styles.stepRow, styles.stepRowLast]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>A coach will call you at the time you picked</Text>
            </View>
          </View>
        </View>

        {/* Booking form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Booking Details</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={colors.textTertiary}
              value={customerName}
              onChangeText={setCustomerName}
              editable={!busy}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Required — so your coach can call you"
              placeholderTextColor={colors.textTertiary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!busy}
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Best Day to Call</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Monday"
                  placeholderTextColor={colors.textTertiary}
                  value={bestDayToCall}
                  onChangeText={setBestDayToCall}
                  editable={!busy}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Best Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2pm"
                  placeholderTextColor={colors.textTertiary}
                  value={bestTimeToCall}
                  onChangeText={setBestTimeToCall}
                  editable={!busy}
                  returnKeyType="next"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Session Goals</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Optional — what would you like to focus on?"
              placeholderTextColor={colors.textTertiary}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              editable={!busy}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Buy CTA */}
        <TouchableOpacity
          style={[styles.buyButton, busy && styles.buyButtonDisabled]}
          onPress={handleBuy}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.buyButtonText}>
              Buy Session — ${COACHING_PRODUCT.price}
            </Text>
          )}
        </TouchableOpacity>

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
          Charged to your Apple ID. Your coach will call the phone number above
          to schedule your 30-minute session. Questions? Email
          coaching@centsiblescholar.com.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
    },
    required: {
      color: colors.error,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
    },
    textarea: {
      minHeight: 96,
      paddingTop: 12,
    },
    rowFields: {
      flexDirection: 'row',
      gap: 12,
    },
    halfField: {
      flex: 1,
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
