import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
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

async function fetchStudentProfile(userId: string, userEmail: string | undefined): Promise<StudentProfile | null> {
  // First try to find by user_id (for parent accounts viewing their student)
  let { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // If not found and we have an email, try finding by email (for student login)
  if (!data && userEmail) {
    const emailResult = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (emailResult.error) {
      console.error('Error fetching student profile by email:', emailResult.error);
    } else {
      data = emailResult.data;
    }
  }

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
    queryFn: () => fetchStudentProfile(user!.id, user?.email),
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
