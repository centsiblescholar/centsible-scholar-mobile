import { Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { REVENUECAT_CONFIG } from '../constants/revenuecatConfig';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import { COACHING_PRODUCT } from '../constants/coachingProduct';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionKeys } from './useSubscriptionStatus';
// `import type` is erased at compile time — no runtime penalty, preserves
// the lazy-load pattern below.
import type { PurchasesPackage } from 'react-native-purchases';

// Lazy-load react-native-purchases to match RevenueCatProvider pattern and
// prevent TurboModule bridge initialisation at import time.
let _Purchases: typeof import('react-native-purchases') | null = null;

async function getPurchases() {
  if (!_Purchases) {
    _Purchases = await import('react-native-purchases');
  }
  return _Purchases;
}

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

      const { default: Purchases } = await getPurchases();

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

      const { default: Purchases } = await getPurchases();

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

/**
 * One-on-One Coaching purchase hook.
 *
 * Coaching is a Consumable IAP (not a subscription), so this hook is a
 * slimmed-down sibling of useRevenueCatPurchase:
 *   - No plan / billingInterval input (single SKU).
 *   - No webhook polling — the RC client SDK confirms the purchase locally
 *     and we trust it to show the booking link.
 *   - No subscription cache invalidation.
 *
 * If a backend record of coaching purchases is later needed, add polling
 * + query invalidation here without changing the screen's call site.
 */
export function useCoachingPurchase() {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be authenticated to purchase');

      const { default: Purchases } = await getPurchases();

      const offerings = await Purchases.getOfferings();

      // Collect every package across every offering RC returned. Coaching may
      // live in the `current` (default) offering alongside subscriptions, OR
      // in a separate standalone offering. We don't care which — we just want
      // the package whose underlying product.identifier matches.
      const allOfferingKeys = Object.keys(offerings.all ?? {});
      const allPackages: Array<{ offeringKey: string; pkg: PurchasesPackage }> = [];
      for (const key of allOfferingKeys) {
        const offering = offerings.all[key];
        if (!offering) continue;
        for (const pkg of offering.availablePackages) {
          allPackages.push({ offeringKey: key, pkg });
        }
      }

      // Prefer the current offering's match for speed; fall back to any
      // offering that contains the coaching product id.
      let pkg: PurchasesPackage | undefined = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === COACHING_PRODUCT.appleProductId
      );
      let matchedOfferingKey = offerings.current?.identifier ?? null;

      if (!pkg) {
        const fallback = allPackages.find(
          (entry) => entry.pkg.product.identifier === COACHING_PRODUCT.appleProductId
        );
        if (fallback) {
          pkg = fallback.pkg;
          matchedOfferingKey = fallback.offeringKey;
        }
      }

      if (!pkg) {
        // Build a diagnostic dump so we can tell at a glance whether the
        // coaching product is missing entirely from RC, or merely not wrapped
        // in a package inside any offering.
        const offeringSummary = allOfferingKeys.length === 0
          ? '(none — offerings.all is empty)'
          : allOfferingKeys
              .map((key) => {
                const off = offerings.all[key];
                const pkgs = off?.availablePackages ?? [];
                const pkgList = pkgs
                  .map((p) => `${p.identifier}=${p.product.identifier}`)
                  .join(', ');
                return `${key}: [${pkgList || 'empty'}]`;
              })
              .join(' | ');

        // Also dump to the Metro console so we can copy the full structure.
        console.warn(
          '[useCoachingPurchase] Coaching product not found in any offering.',
          {
            expectedProductId: COACHING_PRODUCT.appleProductId,
            currentOffering: offerings.current?.identifier ?? null,
            offeringsAllKeys: allOfferingKeys,
            offeringSummary,
          }
        );

        throw new Error(
          `Coaching package not found. Expected product id "${COACHING_PRODUCT.appleProductId}". ` +
            `Offerings seen: ${offeringSummary}`
        );
      }

      console.log('[useCoachingPurchase] Found coaching package', {
        offering: matchedOfferingKey,
        packageIdentifier: pkg.identifier,
        productIdentifier: pkg.product.identifier,
      });

      try {
        await Purchases.purchasePackage(pkg);
      } catch (error: any) {
        if (error.userCancelled) {
          throw new Error('Purchase cancelled');
        }
        throw error;
      }

      return { confirmed: true };
    },
  });

  return {
    purchase: mutation.mutateAsync,
    isPurchasing: mutation.isPending,
    purchaseError: mutation.error,
  };
}
