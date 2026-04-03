import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudentProfile } from '../src/hooks/useStudentProfile';
import { useSubscriptionGate } from '../src/hooks/useSubscriptionGate';
import { signOut } from '../src/integrations/supabase/client';

function SubscriptionErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Unable to verify subscription</Text>
      <Text style={styles.errorSubtitle}>Please check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function StudentNoSubscriptionScreen() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      if (__DEV__) console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.centerContainer}>
      <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
      <Text style={styles.errorTitle}>Subscription Required</Text>
      <Text style={styles.errorSubtitle}>
        Your parent's subscription is not active. Please ask your parent to subscribe to continue
        using the app.
      </Text>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Index() {
  const { user, loading, userRole } = useAuth();

  // Hooks must be called unconditionally (React rules of hooks).
  const { hasCompletedOnboarding, isLoading: profileLoading } = useStudentProfile();
  const { gateStatus, isStudent: isStudentGate, error: gateError, refetch: subRefetch } = useSubscriptionGate();

  // Use imperative navigation to avoid <Redirect> issues during rapid re-renders
  const hasNavigated = useRef(false);

  // Determine target route
  let targetRoute: string | null = null;

  if (!loading && !user) {
    targetRoute = '/(auth)/login';
  } else if (!loading && user && userRole) {
    if (gateStatus === 'not_subscribed' && !isStudentGate) {
      targetRoute = '/paywall';
    } else if (gateStatus === 'subscribed') {
      if (userRole === 'parent') {
        targetRoute = '/(tabs)/dashboard';
      } else if (userRole === 'student') {
        if (!profileLoading) {
          targetRoute = hasCompletedOnboarding ? '/(tabs)/dashboard' : '/(onboarding)';
        }
      }
    }
  }

  useEffect(() => {
    if (targetRoute && !hasNavigated.current) {
      hasNavigated.current = true;
      if (__DEV__) console.log('[Index] Navigating to:', targetRoute, '| gateStatus:', gateStatus, '| role:', userRole);
      router.replace(targetRoute as any);
    }
  }, [targetRoute, gateStatus, userRole]);

  // Reset navigation flag on sign-out so re-login can navigate again
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role still resolving (retry in progress)
  if (!userRole) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Subscription gate loading
  if (gateStatus === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (gateStatus === 'error') {
    if (__DEV__) console.log('[Index] Gate error:', gateError?.message);
    return <SubscriptionErrorScreen onRetry={() => { hasNavigated.current = false; subRefetch(); }} />;
  }

  // Student without parent subscription
  if (gateStatus === 'not_subscribed' && isStudentGate) {
    return <StudentNoSubscriptionScreen />;
  }

  // Student onboarding check
  if (userRole === 'student' && gateStatus === 'subscribed' && profileLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Fallback: show spinner while useEffect navigation fires
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
