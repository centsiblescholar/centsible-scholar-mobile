import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { format, differenceInDays, parseISO, addWeeks } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export type PaycheckStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RenewalMode = 'manual' | 'prompt' | 'auto';

export interface TermConfig {
  id: string;
  user_id: string;
  term_length: number; // in weeks
  current_term_start: string;
  current_term_end: string;
  renewal_mode: string; // RenewalMode
  payday: number | null; // day of month
  created_at: string;
  updated_at: string;
}

export interface TermSnapshot {
  id: string;
  user_id: string;
  term_number: number;
  term_start: string;
  term_end: string;
  gpa: number | null;
  grade_earnings: number;
  behavior_earnings: number;
  education_earnings: number;
  total_earnings: number;
  allocation_breakdown: {
    tax?: number;
    retirement?: number;
    savings?: number;
    discretionary?: number;
  } | null;
  grades_data: any;
  status: PaycheckStatus;
  pay_period_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavePaycheckInput {
  term_number: number;
  term_start: string;
  term_end: string;
  pay_period_number: number | null;
  gpa: number | null;
  grade_earnings: number;
  behavior_earnings: number;
  education_earnings: number;
  total_earnings: number;
  allocation_breakdown: Record<string, number> | null;
  grades_data: any;
}

// ── Query key factory ──────────────────────────────────────────────────

export const termTrackingKeys = {
  all: ['termTracking'] as const,
  config: (userId: string) => [...termTrackingKeys.all, 'config', userId] as const,
  snapshots: (userId: string) => [...termTrackingKeys.all, 'snapshots', userId] as const,
  currentSnapshot: (userId: string) => [...termTrackingKeys.all, 'currentSnapshot', userId] as const,
  pendingPaychecks: (userId: string) => [...termTrackingKeys.all, 'pendingPaychecks', userId] as const,
};

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Resolves a student profile ID or user ID to the actual user ID.
 */
async function resolveStudentUserId(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<string> {
  if (!parentUserId) {
    return studentUserIdOrProfileId;
  }

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('user_id')
    .eq('id', studentUserIdOrProfileId)
    .maybeSingle();

  if (profile?.user_id) {
    return profile.user_id;
  }

  return studentUserIdOrProfileId;
}

// ── Data fetchers ──────────────────────────────────────────────────────

async function fetchTermConfig(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<TermConfig | null> {
  const userId = await resolveStudentUserId(studentUserIdOrProfileId, parentUserId);

  const { data, error } = await supabase
    .from('term_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching term config:', error);
    throw error;
  }

  return data;
}

async function fetchTermSnapshots(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<TermSnapshot[]> {
  const userId = await resolveStudentUserId(studentUserIdOrProfileId, parentUserId);

  const { data, error } = await supabase
    .from('term_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('term_number', { ascending: false });

  if (error) {
    console.error('Error fetching term snapshots:', error);
    throw error;
  }

  return (data || []).map((snapshot) => ({
    ...snapshot,
    allocation_breakdown: snapshot.allocation_breakdown as TermSnapshot['allocation_breakdown'],
    grades_data: snapshot.grades_data,
    status: (snapshot.status || 'completed') as PaycheckStatus,
    education_earnings: snapshot.education_earnings ?? 0,
    pay_period_number: snapshot.pay_period_number ?? null,
  }));
}

async function fetchPendingPaychecks(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<TermSnapshot[]> {
  const userId = await resolveStudentUserId(studentUserIdOrProfileId, parentUserId);

  const { data, error } = await supabase
    .from('term_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending paychecks:', error);
    throw error;
  }

  return (data || []).map((snapshot) => ({
    ...snapshot,
    allocation_breakdown: snapshot.allocation_breakdown as TermSnapshot['allocation_breakdown'],
    grades_data: snapshot.grades_data,
    status: 'pending' as PaycheckStatus,
    education_earnings: snapshot.education_earnings ?? 0,
    pay_period_number: snapshot.pay_period_number ?? null,
  }));
}

// ── Mutations ──────────────────────────────────────────────────────────

async function createTermConfig(config: {
  user_id: string;
  term_length: number;
  current_term_start: string;
  current_term_end: string;
}): Promise<TermConfig> {
  const { data, error } = await supabase
    .from('term_configs')
    .insert(config)
    .select()
    .single();

  if (error) {
    console.error('Error creating term config:', error);
    throw error;
  }

  return data;
}

async function updateTermConfig(
  id: string,
  updates: Partial<Omit<TermConfig, 'id' | 'user_id' | 'created_at'>>
): Promise<TermConfig> {
  const { data, error } = await supabase
    .from('term_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating term config:', error);
    throw error;
  }

  return data;
}

async function savePaycheck(
  userId: string,
  params: SavePaycheckInput
): Promise<void> {
  // Duplicate guard: check for existing snapshot with same term dates + pay period
  const query = supabase
    .from('term_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('term_start', params.term_start)
    .eq('term_end', params.term_end);

  // If pay_period_number is set, check uniqueness per period
  if (params.pay_period_number !== null) {
    query.eq('pay_period_number', params.pay_period_number);
  }

  const { data: existing, error: checkError } = await query.maybeSingle();

  if (checkError) {
    console.error('Error checking for existing paycheck:', checkError);
    throw checkError;
  }

  if (existing) {
    throw new Error('A paycheck already exists for this pay period.');
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from('term_snapshots').insert({
    user_id: userId,
    term_number: params.term_number,
    term_start: params.term_start,
    term_end: params.term_end,
    pay_period_number: params.pay_period_number,
    gpa: params.gpa,
    grade_earnings: params.grade_earnings,
    behavior_earnings: params.behavior_earnings,
    education_earnings: params.education_earnings,
    total_earnings: params.total_earnings,
    allocation_breakdown: params.allocation_breakdown,
    grades_data: params.grades_data,
    status: 'pending',
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error('Error saving paycheck:', error);
    throw error;
  }
}

async function updatePaycheckStatus(
  snapshotId: string,
  status: PaycheckStatus
): Promise<void> {
  const { error } = await supabase
    .from('term_snapshots')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', snapshotId);

  if (error) {
    console.error('Error updating paycheck status:', error);
    throw error;
  }
}

// ── Main hook ──────────────────────────────────────────────────────────

export function useTermTracking(studentUserIdOrProfileId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = studentUserIdOrProfileId || '';
  const parentUserId = user?.id;

  // ── Queries ────────────────────────────────────────────────────────

  const {
    data: termConfig,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: termTrackingKeys.config(targetUserId),
    queryFn: () => fetchTermConfig(targetUserId, parentUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: termSnapshots = [],
    isLoading: snapshotsLoading,
    error: snapshotsError,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: termTrackingKeys.snapshots(targetUserId),
    queryFn: () => fetchTermSnapshots(targetUserId, parentUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: pendingPaychecks = [],
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: termTrackingKeys.pendingPaychecks(targetUserId),
    queryFn: () => fetchPendingPaychecks(targetUserId, parentUserId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // refresh more often for pending items
  });

  // ── Mutations ──────────────────────────────────────────────────────

  const createConfigMutation = useMutation({
    mutationFn: createTermConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.config(targetUserId) });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<TermConfig, 'id' | 'user_id' | 'created_at'>> }) =>
      updateTermConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.config(targetUserId) });
    },
  });

  const savePaycheckMutation = useMutation({
    mutationFn: (params: SavePaycheckInput) =>
      resolveStudentUserId(targetUserId, parentUserId).then((resolvedId) =>
        savePaycheck(resolvedId, params)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.snapshots(targetUserId) });
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.pendingPaychecks(targetUserId) });
    },
  });

  const approvePaycheckMutation = useMutation({
    mutationFn: (snapshotId: string) => updatePaycheckStatus(snapshotId, 'approved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.snapshots(targetUserId) });
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.pendingPaychecks(targetUserId) });
    },
  });

  const rejectPaycheckMutation = useMutation({
    mutationFn: (snapshotId: string) => updatePaycheckStatus(snapshotId, 'rejected'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.snapshots(targetUserId) });
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.pendingPaychecks(targetUserId) });
    },
  });

  // ── Derived data ───────────────────────────────────────────────────

  // Set of pay period numbers that already have a paycheck (any status)
  const paidPeriodNumbers = useMemo(() => {
    const currentStart = termConfig?.current_term_start?.split('T')[0];
    const currentEnd = termConfig?.current_term_end?.split('T')[0];
    if (!currentStart || !currentEnd) return new Set<number>();

    return new Set(
      termSnapshots
        .filter(
          (s) =>
            s.term_start === currentStart &&
            s.term_end === currentEnd &&
            s.pay_period_number !== null
        )
        .map((s) => s.pay_period_number!)
    );
  }, [termSnapshots, termConfig]);

  // Check if current term already has a full-term snapshot
  const currentTermHasSnapshot = useMemo(() => {
    if (!termConfig) return false;
    const start = termConfig.current_term_start.split('T')[0];
    const end = termConfig.current_term_end.split('T')[0];
    return termSnapshots.some(
      (s) => s.term_start === start && s.term_end === end && s.pay_period_number === null
    );
  }, [termConfig, termSnapshots]);

  // Calculate term progress
  const termProgress = useMemo(() => {
    if (!termConfig) return null;

    const now = new Date();
    const start = parseISO(termConfig.current_term_start);
    const end = parseISO(termConfig.current_term_end);

    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(now, start);
    const remainingDays = differenceInDays(end, now);

    const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

    return {
      totalDays,
      elapsedDays: Math.max(0, elapsedDays),
      remainingDays: Math.max(0, remainingDays),
      progressPercent,
      startDate: format(start, 'MMM d, yyyy'),
      endDate: format(end, 'MMM d, yyyy'),
      isActive: now >= start && now <= end,
      hasEnded: now > end,
      hasNotStarted: now < start,
    };
  }, [termConfig]);

  // Current term number
  const currentTermNumber = useMemo(() => {
    if (termSnapshots.length === 0) return 1;
    return Math.max(...termSnapshots.map((s) => s.term_number)) + 1;
  }, [termSnapshots]);

  // Cumulative stats — only count approved/completed snapshots
  const cumulativeStats = useMemo(() => {
    const approvedSnapshots = termSnapshots.filter(
      (s) => s.status === 'approved' || s.status === 'completed'
    );

    const stats = approvedSnapshots.reduce(
      (acc, snapshot) => ({
        totalEarnings: acc.totalEarnings + snapshot.total_earnings,
        gradeEarnings: acc.gradeEarnings + snapshot.grade_earnings,
        behaviorEarnings: acc.behaviorEarnings + snapshot.behavior_earnings,
        educationEarnings: acc.educationEarnings + (snapshot.education_earnings ?? 0),
        averageGPA:
          snapshot.gpa !== null ? acc.averageGPA + snapshot.gpa : acc.averageGPA,
        termsWithGPA: snapshot.gpa !== null ? acc.termsWithGPA + 1 : acc.termsWithGPA,
      }),
      {
        totalEarnings: 0,
        gradeEarnings: 0,
        behaviorEarnings: 0,
        educationEarnings: 0,
        averageGPA: 0,
        termsWithGPA: 0,
      }
    );

    const overallAverageGPA =
      stats.termsWithGPA > 0 ? stats.averageGPA / stats.termsWithGPA : null;

    return { ...stats, overallAverageGPA };
  }, [termSnapshots]);

  // ── Actions ────────────────────────────────────────────────────────

  const setupNewTerm = async (termLengthWeeks: number = 9) => {
    if (!targetUserId) throw new Error('User ID is required');
    const resolvedUserId = await resolveStudentUserId(targetUserId, parentUserId);

    const startDate = new Date();
    const endDate = addWeeks(startDate, termLengthWeeks);

    if (termConfig) {
      return updateConfigMutation.mutateAsync({
        id: termConfig.id,
        updates: {
          term_length: termLengthWeeks,
          current_term_start: startDate.toISOString(),
          current_term_end: endDate.toISOString(),
        },
      });
    } else {
      return createConfigMutation.mutateAsync({
        user_id: resolvedUserId,
        term_length: termLengthWeeks,
        current_term_start: startDate.toISOString(),
        current_term_end: endDate.toISOString(),
      });
    }
  };

  const updateTermDates = async (termLengthWeeks: number, startDate: Date) => {
    if (!termConfig) throw new Error('No term config to update');
    const endDate = addWeeks(startDate, termLengthWeeks);
    return updateConfigMutation.mutateAsync({
      id: termConfig.id,
      updates: {
        term_length: termLengthWeeks,
        current_term_start: startDate.toISOString(),
        current_term_end: endDate.toISOString(),
      },
    });
  };

  const updateRenewalMode = async (mode: RenewalMode) => {
    if (!termConfig) throw new Error('No term config to update');
    return updateConfigMutation.mutateAsync({
      id: termConfig.id,
      updates: { renewal_mode: mode },
    });
  };

  const refetch = async () => {
    await Promise.all([refetchConfig(), refetchSnapshots(), refetchPending()]);
  };

  // ── Return ─────────────────────────────────────────────────────────

  return {
    // Data
    termConfig,
    termSnapshots,
    pendingPaychecks,
    currentTermNumber,
    termProgress,
    cumulativeStats,
    paidPeriodNumbers,

    // Loading states
    isLoading: configLoading || snapshotsLoading,
    configLoading,
    snapshotsLoading,
    pendingLoading,

    // Errors
    configError,
    snapshotsError,

    // Term mutations
    setupNewTerm,
    updateTermDates,
    updateRenewalMode,
    isSettingUpTerm: createConfigMutation.isPending || updateConfigMutation.isPending,

    // Paycheck mutations
    savePaycheck: savePaycheckMutation.mutateAsync,
    isSavingPaycheck: savePaycheckMutation.isPending,
    approvePaycheck: approvePaycheckMutation.mutateAsync,
    isApprovingPaycheck: approvePaycheckMutation.isPending,
    rejectPaycheck: rejectPaycheckMutation.mutateAsync,
    isRejectingPaycheck: rejectPaycheckMutation.isPending,

    // Legacy aliases (backward compat)
    saveTermSnapshot: savePaycheckMutation.mutateAsync,
    isSavingSnapshot: savePaycheckMutation.isPending,
    currentTermHasSnapshot,

    // Refetch
    refetch,
  };
}
