import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export type GateStatus = 'loading' | 'subscribed' | 'not_subscribed' | 'error';

export interface SubscriptionGateResult {
  gateStatus: GateStatus;
  isStudent: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch parent's subscription status for a student user.
 * Two-step query: find parent via relationship, then check parent's subscription.
 */
async function fetchStudentInheritance(studentUserId: string): Promise<boolean> {
  // Step 1: Find parent via parent_student_relationships
  const { data: relationship, error: relError } = await supabase
    .from('parent_student_relationships')
    .select('parent_user_id')
    .eq('student_user_id', studentUserId)
    .limit(1)
    .maybeSingle();

  if (relError) {
    console.error('Error fetching parent relationship for student:', relError);
    throw relError;
  }

  if (!relationship) {
    // No parent relationship found -- student cannot inherit subscription
    console.error('No parent relationship found for student:', studentUserId);
    return false;
  }

  // Step 2: Check parent's subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('status')
    .eq('user_id', relationship.parent_user_id)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (subError) {
    console.error('Error fetching parent subscription for student:', subError);
    throw subError;
  }

  return !!subscription;
}

/**
 * Combined subscription gate hook that handles both parent and student users.
 *
 * - Parent users: checks their own subscription via useSubscriptionStatus
 * - Student users: checks parent's subscription via parent_student_relationships inheritance
 *
 * Returns a unified interface regardless of role.
 */
export function useSubscriptionGate(): SubscriptionGateResult {
  const { user, userRole } = useAuth();
  const isStudent = userRole === 'student';

  // Parent self-check (only enabled for parent users)
  const {
    isActive,
    isLoading: parentSubLoading,
    error: parentSubError,
    refetch: parentRefetch,
  } = useSubscriptionStatus();

  // Student inheritance check (only enabled for student users)
  const {
    data: studentHasAccess,
    isLoading: studentSubLoading,
    error: studentSubError,
    refetch: studentRefetch,
  } = useQuery({
    queryKey: ['subscriptionGate', 'studentInheritance', user?.id ?? ''],
    queryFn: () => fetchStudentInheritance(user!.id),
    enabled: !!user && isStudent,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // No user or no role yet -- still loading
  if (!user || !userRole) {
    return {
      gateStatus: 'loading',
      isStudent: false,
      error: null,
      refetch: () => {},
    };
  }

  // Parent flow
  if (!isStudent) {
    if (parentSubLoading) {
      return { gateStatus: 'loading', isStudent: false, error: null, refetch: parentRefetch };
    }
    if (parentSubError) {
      return {
        gateStatus: 'error',
        isStudent: false,
        error: parentSubError instanceof Error ? parentSubError : new Error(String(parentSubError)),
        refetch: parentRefetch,
      };
    }
    // isActive === true -> subscribed; isActive === null || false -> not_subscribed
    return {
      gateStatus: isActive === true ? 'subscribed' : 'not_subscribed',
      isStudent: false,
      error: null,
      refetch: parentRefetch,
    };
  }

  // Student flow
  if (studentSubLoading) {
    return { gateStatus: 'loading', isStudent: true, error: null, refetch: studentRefetch };
  }
  if (studentSubError) {
    return {
      gateStatus: 'error',
      isStudent: true,
      error: studentSubError instanceof Error ? studentSubError : new Error(String(studentSubError)),
      refetch: studentRefetch,
    };
  }
  return {
    gateStatus: studentHasAccess ? 'subscribed' : 'not_subscribed',
    isStudent: true,
    error: null,
    refetch: studentRefetch,
  };
}
