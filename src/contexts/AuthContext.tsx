import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, Session } from '@supabase/supabase-js';
import { supabase, ensureParentProfile } from '../integrations/supabase/client';

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
 * Authoritative role resolution: check which profile table has a row for this
 * user. Profiles are the source of truth; `user_type` metadata is a stale
 * cache at best and has historically been unreliable for social sign-ups.
 *
 * Parent and student tables are queried in parallel. If both somehow have a
 * row (shouldn't happen), parent wins since that's the original account type.
 */
async function resolveRoleFromProfiles(userId: string): Promise<UserRole> {
  const [parentResult, studentResult] = await Promise.all([
    supabase.from('parent_profiles').select('id').eq('user_id', userId).maybeSingle(),
    supabase.from('student_profiles').select('id').eq('user_id', userId).maybeSingle(),
  ]);

  if (parentResult.data) return 'parent';
  if (studentResult.data) return 'student';
  return null;
}

/**
 * Resolve role with retry, tolerating post-signup replication lag.
 *
 * `delaysMs` controls the backoff schedule. A `0` means "try immediately
 * without waiting". The first element should usually be 0.
 *
 * For initial session restore (existing users), a short schedule is fine —
 * the profile should already exist and resolve on the first attempt.
 * For fresh SIGNED_IN events (possibly brand-new signups), use a longer
 * schedule to give the DB trigger and/or client-side profile creation time
 * to land.
 */
async function resolveRoleWithRetry(
  user: User,
  delaysMs: number[] = [0, 1000, 2000, 3000]
): Promise<UserRole> {
  for (const delay of delaysMs) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    const role = await resolveRoleFromProfiles(user.id);
    if (role) return role;
  }
  return null;
}

/**
 * Extract name components from a social provider user for last-resort
 * client-side profile creation.
 */
function extractNameFromUser(user: User): { firstName: string; lastName: string } {
  const md = user.user_metadata ?? {};
  const firstName =
    md.first_name ||
    md.given_name ||
    (typeof md.full_name === 'string' ? md.full_name.split(' ')[0] : '') ||
    (typeof md.name === 'string' ? md.name.split(' ')[0] : '') ||
    '';
  const lastName =
    md.last_name ||
    md.family_name ||
    (typeof md.full_name === 'string' ? md.full_name.split(' ').slice(1).join(' ') : '') ||
    (typeof md.name === 'string' ? md.name.split(' ').slice(1).join(' ') : '') ||
    '';
  return { firstName, lastName };
}

/**
 * Last-resort role recovery: when retries have exhausted and the user still
 * has no profile, try to create one ourselves. This handles the case where
 * the DB trigger silently failed (historically, Apple/Google sign-ups hit a
 * NULL-comparison bug in the trigger).
 *
 * IMPORTANT: Only creates parent profiles. Student accounts are provisioned
 * exclusively by a parent via the `create-student` edge function — they must
 * never be auto-created by client-side recovery. If metadata indicates this
 * user was intended as a student but has no student_profiles row, we refuse
 * to recover (the parent must recreate the account through the proper flow).
 *
 * Returns the resolved role, or null if recovery genuinely failed or was
 * refused (e.g. orphaned student).
 */
async function recoverMissingRole(user: User): Promise<UserRole> {
  // Guard: if metadata says this user is a student, do NOT create a parent
  // profile. A missing student_profiles row for a student-metadata user
  // means their account wasn't fully provisioned by the create-student edge
  // function — this needs parent intervention, not silent promotion.
  const metaType = user.user_metadata?.user_type;
  const metaRole = user.user_metadata?.role;
  if (metaType === 'student' || metaRole === 'student') {
    console.error(
      'recoverMissingRole: refusing to auto-recover orphaned student account',
      user.id
    );
    return null;
  }

  const { firstName, lastName } = extractNameFromUser(user);
  const created = await ensureParentProfile(
    user.id,
    user.email || '',
    firstName,
    lastName
  );
  if (!created) return null;
  // Re-resolve from profiles — confirm the row is actually visible now.
  return await resolveRoleFromProfiles(user.id);
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

  // Version counter to prevent stale async callbacks from setting state
  const authVersionRef = useRef(0);

  useEffect(() => {
    // Increment version on each effect run; stale async callbacks will be ignored
    const version = ++authVersionRef.current;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (authVersionRef.current !== version) return; // stale

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        let role: UserRole = null;
        if (initialSession?.user) {
          // Existing user restore: profile should already exist, short retry is fine.
          role = await resolveRoleWithRetry(initialSession.user, [0, 1000, 2000]);
          if (authVersionRef.current !== version) return; // stale

          // Last-resort recovery: create the missing profile ourselves before giving up.
          if (!role) {
            console.warn(
              'initializeAuth: role missing after retries, attempting client-side recovery'
            );
            role = await recoverMissingRole(initialSession.user);
            if (authVersionRef.current !== version) return; // stale
          }
        }

        setUserRole(role);

        // Only sign the user out if recovery genuinely failed — i.e. we could not
        // create a profile row at all. This is a real DB error, not a race.
        if (initialSession?.user && !role) {
          await signOutWithError(
            'We could not finish setting up your account. Please try again, or contact support if this persists.'
          );
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (authVersionRef.current === version) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Capture a new sub-version for this particular auth event
        const eventVersion = ++authVersionRef.current;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setLoading(false);
          return;
        }

        let role: UserRole = null;
        if (newSession?.user) {
          // Fresh SIGNED_IN may be a brand-new signup — give DB trigger + our own
          // profile creation time to land before falling back to recovery.
          // Total budget: 1 + 2 + 3 + 5 + 8 = 19s across 5 retries (plus one
          // immediate check). For other events (TOKEN_REFRESHED, USER_UPDATED)
          // the profile should already exist — short schedule is fine.
          const delays =
            event === 'SIGNED_IN' ? [0, 1000, 2000, 3000, 5000, 8000] : [0, 1000, 2000];

          role = await resolveRoleWithRetry(newSession.user, delays);
          if (authVersionRef.current !== eventVersion) return; // superseded by newer event

          // Last-resort recovery for SIGNED_IN only — creating a profile row here
          // for token-refresh events would be unexpected and could mask real bugs.
          if (!role && event === 'SIGNED_IN') {
            console.warn(
              'onAuthStateChange: role missing after retries, attempting client-side recovery'
            );
            role = await recoverMissingRole(newSession.user);
            if (authVersionRef.current !== eventVersion) return; // superseded
          }
        }

        setUserRole(role);

        // Only sign out if recovery genuinely could not produce a profile — this
        // indicates a real database problem (RLS misconfiguration, table missing,
        // etc.), not a timing race.
        if (event === 'SIGNED_IN' && newSession?.user && !role) {
          await signOutWithError(
            'We could not finish setting up your account. Please try again, or contact support if this persists.'
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
