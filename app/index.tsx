import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user, loading, userRole } = useAuth();

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

  // Both parent and student route to dashboard for now.
  // Phase 2 will add student welcome/onboarding screen.
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
