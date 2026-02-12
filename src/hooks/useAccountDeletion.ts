import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase, signOut } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export type DeletionStep = 'warning' | 'confirm' | 'deleting';

interface AccountDeletionState {
  step: DeletionStep;
  isDeleting: boolean;
  error: string | null;
  studentCount: number;
  canDelete: boolean;
  subscriptionBlockReason: string | null;
}

export function useAccountDeletion() {
  const { user } = useAuth();
  const { isActive } = useSubscriptionStatus();

  const [state, setState] = useState<AccountDeletionState>({
    step: 'warning',
    isDeleting: false,
    error: null,
    studentCount: 0,
    canDelete: true,
    subscriptionBlockReason: null,
  });

  // Check if user can delete (subscription status)
  useEffect(() => {
    if (isActive === true) {
      setState((prev) => ({
        ...prev,
        canDelete: false,
        subscriptionBlockReason: 'Cancel your subscription first.',
      }));
    } else {
      setState((prev) => ({
        ...prev,
        canDelete: true,
        subscriptionBlockReason: null,
      }));
    }
  }, [isActive]);

  // Fetch student count on mount
  useEffect(() => {
    if (!user) return;

    const fetchStudentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('parent_student_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('parent_user_id', user.id);

        if (error) {
          console.error('Error fetching student count:', error.message);
          return;
        }

        setState((prev) => ({ ...prev, studentCount: count || 0 }));
      } catch (err) {
        console.error('Error fetching student count:', err);
      }
    };

    fetchStudentCount();
  }, [user]);

  const setStep = useCallback((step: DeletionStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const deleteAccount = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'deleting', isDeleting: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        setState((prev) => ({
          ...prev,
          step: 'confirm',
          isDeleting: false,
          error: error.message || 'Failed to delete account. Please contact support at support@centsiblescholar.com',
        }));
        return;
      }

      // Check for application-level errors in response body
      if (data && !data.success) {
        setState((prev) => ({
          ...prev,
          step: 'confirm',
          isDeleting: false,
          error: data.error || 'Failed to delete account. Please contact support at support@centsiblescholar.com',
        }));
        return;
      }

      // Success: sign out and redirect to login
      try {
        await signOut();
      } catch {
        // Sign out may fail if the session is already invalidated
        // (the auth user was deleted server-side)
      }

      router.replace('/(auth)/login');
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        step: 'confirm',
        isDeleting: false,
        error: err?.message || 'An unexpected error occurred. Please contact support at support@centsiblescholar.com',
      }));
    }
  }, []);

  return {
    ...state,
    setStep,
    deleteAccount,
  };
}
