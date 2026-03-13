import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Database } from './types';

// Lazy-load Google Sign-In to avoid crash in Expo Go / simulator
// (native module not available without a dev build)
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
 * Fallback: ensure parent_profiles record exists after signup.
 * The handle_new_user trigger should create it, but this is a safety net.
 */
export async function ensureParentProfile(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
) {
  const { data } = await supabase
    .from('parent_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    const { error } = await supabase.from('parent_profiles').insert({
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      onboarding_completed: false,
    });
    if (error) {
      console.error('Error creating fallback parent profile:', error.message);
    }
  }
}

/**
 * Sign in with Apple (native iOS).
 * Uses signInWithIdToken for native flow (no browser redirect).
 */
export async function signInWithApple() {
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
 * For social sign-ups: ensure the user gets parent role metadata and a parent profile.
 * Only runs for new users who don't have user_type set yet.
 */
async function ensureSocialSignUpProfile(
  user: any,
  firstName?: string | null,
  lastName?: string | null
) {
  // If user already has user_type, they're an existing user — skip
  if (user.user_metadata?.user_type) return;

  // All sign-ups are parent accounts
  await supabase.auth.updateUser({
    data: {
      user_type: 'parent',
      first_name: firstName || '',
      last_name: lastName || '',
    },
  });

  // Create parent profile if it doesn't exist
  await ensureParentProfile(
    user.id,
    user.email || '',
    firstName || '',
    lastName || ''
  );
}
