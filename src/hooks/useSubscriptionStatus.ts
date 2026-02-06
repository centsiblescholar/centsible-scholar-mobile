import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface SubscriptionStatus {
  id: number;
  user_id: string;
  status: string;
  subscription_type: string; // 'single' | 'midsize' | 'large'
  current_period_end: string | null;
  current_period_start: string | null;
  platform: 'stripe' | 'apple' | 'google';
  // Stripe-specific (null for IAP)
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  // IAP-specific (null for Stripe)
  iap_product_id: string | null;
  iap_original_transaction_id: string | null;
  revenucat_customer_id: string | null;
}

// Query key factory
export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: (userId: string) => [...subscriptionKeys.all, 'status', userId] as const,
};

async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  // First, try to find an active or trialing subscription
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }

  // If no active/trialing record found, try to find any record
  // (for canceled/past_due status display)
  if (!data) {
    const { data: anyRecord, error: fallbackError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      console.error('Error fetching fallback subscription status:', fallbackError);
      throw fallbackError;
    }

    // Cast: post-migration, select('*') will include new IAP columns.
    // Pre-migration, these fields will be undefined (safely handled by optional chaining).
    return anyRecord as unknown as SubscriptionStatus | null;
  }

  // Cast: auto-generated types don't yet include IAP columns (migration pending).
  // After migration + type regen, this cast can be removed.
  return data as unknown as SubscriptionStatus | null;
}

export function useSubscriptionStatus() {
  const { user } = useAuth();

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: subscriptionKeys.status(user?.id || ''),
    queryFn: () => fetchSubscriptionStatus(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Format subscription type for display
  const formatSubscriptionType = (type: string): string => {
    switch (type) {
      case 'single':
        return 'Standard';
      case 'midsize':
        return 'Premium';
      case 'large':
        return 'Family';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // isActive is null when there's no subscription record at all
  // This distinguishes "no subscription" from "subscription query failed" (which throws)
  const isActive = subscription
    ? (subscription.status === 'active' || subscription.status === 'trialing')
    : null;

  // Format period end date
  const periodEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return {
    // Raw data
    subscription,
    isLoading,
    error,
    refetch,

    // Platform-agnostic accessors (the public API)
    isActive,                                        // true | false | null (null = no subscription)
    tier: subscription?.subscription_type || null,   // 'single' | 'midsize' | 'large' | null
    periodEnd: subscription?.current_period_end || null,
    platform: subscription?.platform || null,        // 'stripe' | 'apple' | 'google' | null

    // Backward-compatible display fields (used by Settings screen)
    subscriptionType: subscription?.subscription_type || 'none',
    subscriptionTypeDisplay: subscription?.subscription_type
      ? formatSubscriptionType(subscription.subscription_type)
      : 'None',
    // Keep 'inactive' fallback for backward compatibility with Settings getStatusText()
    // which calls status.charAt(0) and would crash on null
    status: subscription?.status || 'inactive',
    periodEndDate,
  };
}
