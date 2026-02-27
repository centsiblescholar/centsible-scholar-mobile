import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

type UserRole = 'parent' | 'student' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  signOutWithError: (message: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOutWithError: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Extract role from user metadata.
 * Returns 'parent' | 'student' if valid, null otherwise.
 */
function extractRole(user: User | null): UserRole {
  if (!user) return null;
  const userType = user.user_metadata?.user_type;
  if (userType === 'parent' || userType === 'student') {
    return userType;
  }
  return null;
}

/**
 * Fallback: detect role by checking profile tables when metadata is missing.
 * Also patches the user's auth metadata so this lookup only happens once.
 */
async function detectRoleFromProfiles(userId: string): Promise<UserRole> {
  // Check student_profiles first
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (studentProfile) {
    // Patch metadata so future logins don't need this fallback
    await supabase.auth.updateUser({ data: { user_type: 'student' } });
    return 'student';
  }

  // Check parent_profiles
  const { data: parentProfile } = await supabase
    .from('parent_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (parentProfile) {
    await supabase.auth.updateUser({ data: { user_type: 'parent' } });
    return 'parent';
  }

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const signOutWithError = useCallback(async (message: string) => {
    await supabase.auth.signOut();
    Alert.alert('Account Error', message);
  }, []);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        let role = extractRole(initialSession?.user ?? null);

        // Fallback: detect role from profile tables if metadata is missing
        if (initialSession?.user && !role) {
          role = await detectRoleFromProfiles(initialSession.user.id);
        }

        setUserRole(role);

        // If there is a user but role is still invalid after fallback, sign out with error
        if (initialSession?.user && !role) {
          await signOutWithError(
            'Your account is missing role information. Please contact support.'
          );
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setLoading(false);
          return;
        }

        let role = extractRole(newSession?.user ?? null);

        // Fallback: detect role from profile tables if metadata is missing
        if (event === 'SIGNED_IN' && newSession?.user && !role) {
          role = await detectRoleFromProfiles(newSession.user.id);
        }

        setUserRole(role);

        // If user just signed in but role is still invalid after fallback, sign out with error
        if (event === 'SIGNED_IN' && newSession?.user && !role) {
          await signOutWithError(
            'Your account is missing role information. Please contact support.'
          );
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [signOutWithError]);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOutWithError }}>
      {children}
    </AuthContext.Provider>
  );
}
