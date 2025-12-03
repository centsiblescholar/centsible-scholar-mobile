import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  grade_level: string;
  base_reward_amount: number;
  is_active: boolean;
  reporting_frequency: string;
}

// Query key factory
export const studentProfileKeys = {
  all: ['studentProfile'] as const,
  detail: (userId: string) => [...studentProfileKeys.all, userId] as const,
};

async function fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }

  return data;
}

export function useStudentProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: studentProfileKeys.detail(user?.id || ''),
    queryFn: () => fetchStudentProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    hasProfile: !!profile,
  };
}
