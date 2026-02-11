import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionKeys } from './useSubscriptionStatus';

export interface MockPurchaseInput {
  plan: 'single' | 'midsize' | 'large';
  billingInterval: 'month' | 'year';
}

/**
 * Mock purchase mutation hook for Phase 4 testing.
 *
 * Simulates an IAP purchase by writing a real subscription row to Supabase
 * with 'trialing' status and a 7-day trial period. Uses a two-step
 * query-then-insert/update pattern to avoid upsert unique constraint issues.
 *
 * Replaced with RevenueCat in Phase 5.
 */
export function useMockPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: MockPurchaseInput) => {
      if (!user) throw new Error('User must be authenticated to purchase');

      // Simulate purchase processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const subscriptionData = {
        user_id: user.id,
        status: 'trialing',
        subscription_type: input.plan,
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        platform: 'apple', // Mock as IAP
      };

      // Two-step pattern: query first, then insert or update
      // Avoids upsert unique constraint issues (Research Pitfall 2)
      const { data: existing, error: queryError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.error('Error checking existing subscription:', queryError);
        throw queryError;
      }

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (error) {
          console.error('Error creating subscription:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      // Invalidate subscription cache so gate re-evaluates immediately
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return {
    purchase: mutation.mutateAsync,
    isPurchasing: mutation.isPending,
    purchaseError: mutation.error,
  };
}
