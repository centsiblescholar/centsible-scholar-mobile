import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface SubscriptionStatus {
  id: number;
  user_id: string;
  status: string;
  subscription_type: string;
  current_period_end: string | null;
  current_period_start: string | null;
  stripe_customer_id: string | null;
}

// Query key factory
export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: (userId: string) => [...subscriptionKeys.all, 'status', userId] as const,
};

async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }

  return data;
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
        return 'Enterprise';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Check if subscription is active
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Format period end date
  const periodEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return {
    subscription,
    isLoading,
    error,
    refetch,
    isActive,
    subscriptionType: subscription?.subscription_type || 'none',
    subscriptionTypeDisplay: subscription?.subscription_type
      ? formatSubscriptionType(subscription.subscription_type)
      : 'None',
    status: subscription?.status || 'inactive',
    periodEndDate,
  };
}
