import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < current ? '#4F46E5' : '#D1D5DB' },
          ]}
        />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const { profile } = useStudentProfile();
  const firstName = profile?.name?.split(' ')[0] || 'Scholar';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProgressDots current={1} total={3} />

        <View style={styles.content}>
          <View style={styles.iconRow}>
            <Ionicons name="school" size={48} color="#4F46E5" />
            <Text style={styles.iconEmoji}>💰</Text>
          </View>

          <Text style={styles.title}>Welcome to{'\n'}Centsible Scholar!</Text>

          <Text style={styles.subtitle}>
            We're excited to have you here! Let's take a quick tour so you know
            how everything works.
          </Text>

          <Text style={styles.readyText}>Ready, {firstName}?</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Let's Go!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  iconEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 24,
    marginBottom: 24,
  },
  readyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
