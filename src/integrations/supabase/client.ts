import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, User } from '@supabase/supabase-js';
import { Database } from './types';

// Lazy-load native auth modules to avoid TurboModule crashes on iPad
// during the critical first-frame window (native NSException → Hermes corruption)
let _AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
async function getAppleAuthentication() {
  if (!_AppleAuthentication) {
    _AppleAuthentication = await import('expo-apple-authentication');
  }
  return _AppleAuthentication;
}

let _GoogleSignin: any = null;
let _isSuccessResponse: any = null;
async function getGoogleSignin() {
  if (!_GoogleSignin) {
    const mod = await import('@react-native-google-signin/google-signin');
    _GoogleSignin = mod.GoogleSignin;
    _isSuccessResponse = mod.isSuccessResponse;
  }
  return { GoogleSignin: _GoogleSignin, isSuccessResponse: _isSuccessResponse };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
}

/**
 * Helper to sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

/**
 * Helper to sign in with email/password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }

  return data;
}

/**
 * Helper to sign up with email/password (parent accounts only)
 * Passes metadata so the handle_new_user trigger creates a parent_profiles record.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: 'parent',
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }

  return data;
}

/**
 * Ensure a parent_profiles row exists for the given user.
 *
 * Idempotent and safe to call repeatedly: if the row already exists (e.g.
 * the DB trigger created it, or a previous call succeeded), this is a no-op.
 *
 * Returns `true` if a parent_profiles row exists after the call — either it
 * was already there, or the INSERT (or a duplicate-key race) succeeded.
 * Returns `false` only on genuine DB failures after all retries are exhausted.
 *
 * This is the AUTHORITATIVE client-side mechanism for parent profile creation.
 * Prior versions deferred to the `handle_new_user` DB trigger, but that
 * trigger has historically been unreliable for social sign-ups (Apple/Google)
 * due to a NULL-comparison bug in its source. The app MUST NOT depend on the
 * trigger for correctness.
 */
export async function ensureParentProfile(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  // Fast path: already exists
  const { data: existing, error: selectError } = await supabase
    .from('parent_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return true;
  if (selectError) {
    console.warn('ensureParentProfile: select error (will still attempt insert):', selectError.message);
  }

  // Insert with retry: RLS policies may require session replication to settle
  // immediately after sign-up, and the DB trigger may be racing with us.
  const delaysMs = [0, 1000, 2500];
  for (let attempt = 0; attempt < delaysMs.length; attempt++) {
    if (delaysMs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[attempt]));
    }

    const { error } = await supabase.from('parent_profiles').insert({
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      onboarding_completed: false,
    });

    if (!error) return true;

    // Postgres unique_violation — the DB trigger beat us to it. That's success.
    if (error.code === '23505') return true;

    console.warn(
      `ensureParentProfile insert attempt ${attempt + 1}/${delaysMs.length} failed:`,
      error.message,
      error.code ?? ''
    );
  }

  // Final check: maybe the trigger (or another tab) inserted while we were retrying
  const { data: finalCheck } = await supabase
    .from('parent_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  return !!finalCheck;
}

/**
 * Sign in with Apple (native iOS).
 * Uses signInWithIdToken for native flow (no browser redirect).
 */
export async function signInWithApple() {
  const AppleAuthentication = await getAppleAuthentication();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('No identity token received from Apple');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;

  // Handle new social sign-up users
  if (data.user) {
    await ensureSocialSignUpProfile(
      data.user,
      credential.fullName?.givenName,
      credential.fullName?.familyName
    );
  }

  return data;
}

/**
 * Sign in with Google (native).
 * Uses signInWithIdToken for native flow (no browser redirect).
 */
export async function signInWithGoogle() {
  const { GoogleSignin, isSuccessResponse } = await getGoogleSignin();

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
  });

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in was cancelled');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('No ID token received from Google');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;

  // Handle new social sign-up users
  if (data.user) {
    const fullName = data.user.user_metadata?.full_name || '';
    const nameParts = fullName.split(' ');
    await ensureSocialSignUpProfile(
      data.user,
      data.user.user_metadata?.given_name || nameParts[0],
      data.user.user_metadata?.family_name || nameParts.slice(1).join(' ')
    );
  }

  return data;
}

/**
 * For social sign-ups (Apple/Google): ensure the user has a parent profile.
 *
 * This function is AUTHORITATIVE for social-provider account setup. The
 * `handle_new_user` DB trigger has historically failed to create profiles
 * for Apple/Google users due to a NULL-comparison bug
 * (`v_role != 'student'` evaluates to NULL, not TRUE, when role is NULL).
 * Therefore this function MUST successfully create a parent_profiles row,
 * regardless of trigger state.
 *
 * Role is derived from the profile tables in AuthContext, so the
 * `user_type` metadata update below is a hint/optimization only — it is NOT
 * required for correctness. Failure to update metadata is non-fatal.
 */
async function ensureSocialSignUpProfile(
  user: User,
  firstName?: string | null,
  lastName?: string | null
): Promise<void> {
  // Authoritative: create the parent profile if it doesn't exist.
  const created = await ensureParentProfile(
    user.id,
    user.email || '',
    firstName || '',
    lastName || ''
  );

  if (!created) {
    // Real DB failure — log loudly. AuthContext will attempt its own recovery
    // before showing an error to the user.
    console.error(
      'ensureSocialSignUpProfile: failed to ensure parent_profiles row for',
      user.id
    );
  }

  // Best-effort: update metadata so the user's JWT carries user_type on next
  // refresh. Purely a cache/hint — AuthContext no longer depends on it.
  if (!user.user_metadata?.user_type) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        user_type: 'parent',
        first_name: firstName || '',
        last_name: lastName || '',
      },
    });
    if (updateError) {
      console.warn(
        'ensureSocialSignUpProfile: metadata update failed (non-critical):',
        updateError.message
      );
    }
  }
}
