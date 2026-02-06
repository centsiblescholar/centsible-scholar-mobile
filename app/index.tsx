import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudentProfile } from '../src/hooks/useStudentProfile';

export default function Index() {
  const { user, loading, userRole } = useAuth();

  // Hook must be called unconditionally (React rules of hooks).
  // For non-student roles, the query is still enabled (uses user.id)
  // but the result is only consumed when userRole === 'student'.
  const { hasCompletedOnboarding, isLoading: profileLoading } = useStudentProfile();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // No user -- redirect to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // User exists but role is null -- role extraction failed, signOutWithError
  // is in progress. Show spinner to avoid flash before SIGNED_OUT redirects.
  if (!userRole) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Parent goes straight to dashboard
  if (userRole === 'parent') {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Student: check onboarding status
  if (userRole === 'student') {
    if (profileLoading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      );
    }
    if (!hasCompletedOnboarding) {
      // Route created in Plan 02-03; cast needed until route files exist
      return <Redirect href={'/(onboarding)' as any} />;
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Fallback (should not reach -- invalid role triggers signOutWithError)
  return <Redirect href="/(tabs)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
