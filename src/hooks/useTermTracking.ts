import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { format, differenceInDays, parseISO, addWeeks } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export interface TermConfig {
  id: string;
  user_id: string;
  term_length: number; // in weeks
  current_term_start: string;
  current_term_end: string;
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
  total_earnings: number;
  allocation_breakdown: {
    tax?: number;
    retirement?: number;
    savings?: number;
    discretionary?: number;
  } | null;
  grades_data: any;
  created_at: string;
  updated_at: string;
}

// Query key factory
export const termTrackingKeys = {
  all: ['termTracking'] as const,
  config: (userId: string) => [...termTrackingKeys.all, 'config', userId] as const,
  snapshots: (userId: string) => [...termTrackingKeys.all, 'snapshots', userId] as const,
  currentSnapshot: (userId: string) => [...termTrackingKeys.all, 'currentSnapshot', userId] as const,
};

/**
 * Resolves a student profile ID or user ID to the actual user ID.
 *
 * @param studentUserIdOrProfileId - Either the student's auth user_id or student_profiles.id
 * @param parentUserId - The parent's auth user_id (used to resolve profile IDs)
 */
async function resolveStudentUserId(
  studentUserIdOrProfileId: string,
  parentUserId?: string
): Promise<string> {
  if (!parentUserId) {
    return studentUserIdOrProfileId;
  }

  // Check if this is a student_profiles.id
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('user_id')
    .eq('id', studentUserIdOrProfileId)
    .maybeSingle();

  if (profile?.user_id) {
    return profile.user_id;
  }

  // It's already a user_id
  return studentUserIdOrProfileId;
}

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
      // No config found
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

  // Map the data to ensure type compatibility
  return (data || []).map((snapshot) => ({
    ...snapshot,
    allocation_breakdown: snapshot.allocation_breakdown as TermSnapshot['allocation_breakdown'],
    grades_data: snapshot.grades_data,
  }));
}

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

export function useTermTracking(studentUserIdOrProfileId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = studentUserIdOrProfileId || '';
  const parentUserId = user?.id;

  // Fetch term configuration
  const {
    data: termConfig,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: termTrackingKeys.config(targetUserId),
    queryFn: () => fetchTermConfig(targetUserId, parentUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch term snapshots (historical)
  const {
    data: termSnapshots = [],
    isLoading: snapshotsLoading,
    error: snapshotsError,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: termTrackingKeys.snapshots(targetUserId),
    queryFn: () => fetchTermSnapshots(targetUserId, parentUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create term config mutation
  const createConfigMutation = useMutation({
    mutationFn: createTermConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.config(targetUserId) });
    },
  });

  // Update term config mutation
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<TermConfig, 'id' | 'user_id' | 'created_at'>> }) =>
      updateTermConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termTrackingKeys.config(targetUserId) });
    },
  });

  // Calculate term progress
  const getTermProgress = () => {
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
  };

  // Get current term number based on snapshots
  const currentTermNumber = termSnapshots.length > 0
    ? Math.max(...termSnapshots.map(s => s.term_number)) + 1
    : 1;

  // Calculate cumulative stats from all term snapshots
  const cumulativeStats = termSnapshots.reduce(
    (acc, snapshot) => ({
      totalEarnings: acc.totalEarnings + snapshot.total_earnings,
      gradeEarnings: acc.gradeEarnings + snapshot.grade_earnings,
      behaviorEarnings: acc.behaviorEarnings + snapshot.behavior_earnings,
      averageGPA:
        snapshot.gpa !== null
          ? acc.averageGPA + snapshot.gpa
          : acc.averageGPA,
      termsWithGPA: snapshot.gpa !== null ? acc.termsWithGPA + 1 : acc.termsWithGPA,
    }),
    {
      totalEarnings: 0,
      gradeEarnings: 0,
      behaviorEarnings: 0,
      averageGPA: 0,
      termsWithGPA: 0,
    }
  );

  // Calculate average GPA across all terms
  const overallAverageGPA =
    cumulativeStats.termsWithGPA > 0
      ? cumulativeStats.averageGPA / cumulativeStats.termsWithGPA
      : null;

  // Helper to set up a new term
  const setupNewTerm = async (termLengthWeeks: number = 9) => {
    if (!targetUserId) throw new Error('User ID is required');

    // Resolve to actual user_id if we have a profile ID
    const resolvedUserId = await resolveStudentUserId(targetUserId, parentUserId);

    const startDate = new Date();
    const endDate = addWeeks(startDate, termLengthWeeks);

    if (termConfig) {
      // Update existing config
      return updateConfigMutation.mutateAsync({
        id: termConfig.id,
        updates: {
          term_length: termLengthWeeks,
          current_term_start: startDate.toISOString(),
          current_term_end: endDate.toISOString(),
        },
      });
    } else {
      // Create new config
      return createConfigMutation.mutateAsync({
        user_id: resolvedUserId,
        term_length: termLengthWeeks,
        current_term_start: startDate.toISOString(),
        current_term_end: endDate.toISOString(),
      });
    }
  };

  // Refetch all term data
  const refetch = async () => {
    await Promise.all([refetchConfig(), refetchSnapshots()]);
  };

  return {
    // Data
    termConfig,
    termSnapshots,
    currentTermNumber,
    termProgress: getTermProgress(),
    cumulativeStats: {
      ...cumulativeStats,
      overallAverageGPA,
    },

    // Loading states
    isLoading: configLoading || snapshotsLoading,
    configLoading,
    snapshotsLoading,

    // Errors
    configError,
    snapshotsError,

    // Mutations
    setupNewTerm,
    isSettingUpTerm: createConfigMutation.isPending || updateConfigMutation.isPending,

    // Refetch
    refetch,
  };
}
