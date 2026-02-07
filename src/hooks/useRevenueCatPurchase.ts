import { Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Purchases, { PurchasesError } from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../constants/revenuecatConfig';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionKeys } from './useSubscriptionStatus';

export interface PurchaseInput {
  plan: 'single' | 'midsize' | 'large';
  billingInterval: 'month' | 'year';
}

/**
 * Polls Supabase `user_subscriptions` table until the RevenueCat webhook
 * has confirmed the subscription by writing an active/trialing record.
 *
 * Returns true if confirmed within timeout, false if timed out.
 */
async function pollForWebhookConfirmation(userId: string): Promise<boolean> {
  const { intervalMs, timeoutMs } = REVENUECAT_CONFIG.polling;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id, status, platform')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .in('platform', ['apple', 'google'])
      .maybeSingle();

    if (error) {
      console.error('[RC-Purchase] Polling error:', error.message);
      // Continue polling on transient errors
    }

    if (data) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Real RevenueCat purchase hook that replaces useMockPurchase.
 *
 * Same interface as useMockPurchase for drop-in replacement:
 *   { purchase, isPurchasing, purchaseError }
 *
 * Flow:
 * 1. Look up plan and find correct RevenueCat package from offerings
 * 2. Call Purchases.purchasePackage() to initiate store purchase
 * 3. Poll Supabase until webhook confirms the subscription
 * 4. Invalidate subscription cache on success
 */
export function useRevenueCatPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: PurchaseInput) => {
      if (!user) throw new Error('User must be authenticated to purchase');

      // 1. Look up the plan
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === input.plan);
      if (!plan) throw new Error(`Unknown plan: ${input.plan}`);

      // 2. Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        throw new Error('No offerings available. Please check your RevenueCat configuration.');
      }

      // 3. Find the correct package
      // First try by RC package ID (e.g. $rc_monthly, $rc_annual)
      const intervalKey = input.billingInterval === 'month' ? 'monthly' : 'annual';
      const rcPackageId = plan.rcPackageId[intervalKey];
      let pkg = offerings.current.availablePackages.find(
        (p) => p.identifier === rcPackageId
      );

      // Fall back to matching by product ID if RC package ID doesn't match
      if (!pkg) {
        const productIds =
          Platform.OS === 'ios' ? plan.appleProductId : plan.googleProductId;
        const targetProductId = productIds[intervalKey];
        pkg = offerings.current.availablePackages.find(
          (p) => p.product.identifier === targetProductId
        );
      }

      if (!pkg) {
        const availableIds = offerings.current.availablePackages.map(
          (p) => `${p.identifier} (${p.product.identifier})`
        );
        throw new Error(
          `Package not found for ${plan.name} ${input.billingInterval}. ` +
            `Available packages: ${availableIds.join(', ')}`
        );
      }

      // 4. Execute the purchase
      try {
        await Purchases.purchasePackage(pkg);
      } catch (error: any) {
        if (error.userCancelled) {
          throw new Error('Purchase cancelled');
        }
        throw error;
      }

      // 5. Poll Supabase for webhook confirmation
      const confirmed = await pollForWebhookConfirmation(user.id);
      if (!confirmed) {
        throw new Error('PURCHASE_PENDING');
      }

      return { confirmed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return {
    purchase: mutation.mutateAsync,
    isPurchasing: mutation.isPending,
    purchaseError: mutation.error,
  };
}

/**
 * Restore purchases hook using RevenueCat's restorePurchases API.
 *
 * Calls RevenueCat restore, then polls Supabase for webhook confirmation
 * (same polling pattern as purchase flow).
 */
export function useRestorePurchases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be authenticated to restore purchases');

      // Call RevenueCat restore
      await Purchases.restorePurchases();

      // Poll Supabase for webhook confirmation
      const confirmed = await pollForWebhookConfirmation(user.id);
      if (!confirmed) {
        throw new Error('No active purchases found to restore.');
      }

      return { confirmed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return {
    restore: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    restoreError: mutation.error,
  };
}
