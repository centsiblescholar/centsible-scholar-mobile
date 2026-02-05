import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

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
