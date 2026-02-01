import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  grade_level?: string | null;
  base_reward_amount?: number;
  userType: 'student' | 'parent';
}

// Query key factory
export const userProfileKeys = {
  all: ['userProfile'] as const,
  detail: (userId: string) => [...userProfileKeys.all, userId] as const,
};

async function fetchUserProfile(userId: string, userEmail: string | undefined): Promise<UserProfile | null> {
  // First try student_profiles by user_id (parent viewing their student)
  let { data: studentData } = await supabase
    .from('student_profiles')
    .select('id, name, email, grade_level, base_reward_amount')
    .eq('user_id', userId)
    .maybeSingle();

  if (studentData) {
    return {
      ...studentData,
      userType: 'student' as const,
    };
  }

  // Try student_profiles by email (student login)
  if (userEmail) {
    const { data: studentByEmail } = await supabase
      .from('student_profiles')
      .select('id, name, email, grade_level, base_reward_amount')
      .eq('email', userEmail)
      .maybeSingle();

    if (studentByEmail) {
      return {
        ...studentByEmail,
        userType: 'student' as const,
      };
    }
  }

  // Try parent_profiles
  const { data: parentData } = await supabase
    .from('parent_profiles')
    .select('id, first_name, last_name, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (parentData) {
    const fullName = [parentData.first_name, parentData.last_name]
      .filter(Boolean)
      .join(' ') || 'Parent';

    return {
      id: parentData.id,
      name: fullName,
      email: parentData.email,
      userType: 'parent' as const,
    };
  }

  // Fallback: return basic profile from auth
  return {
    id: userId,
    name: userEmail?.split('@')[0] || 'User',
    email: userEmail || null,
    userType: 'parent' as const,
  };
}

export function useUserProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: userProfileKeys.detail(user?.id || ''),
    queryFn: () => fetchUserProfile(user!.id, user?.email),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    hasProfile: !!profile,
    isStudent: profile?.userType === 'student',
    isParent: profile?.userType === 'parent',
  };
}
