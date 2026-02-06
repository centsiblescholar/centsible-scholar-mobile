import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useAuth } from '../../src/contexts/AuthContext';

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

export default function ProfileScreen() {
  const { profile } = useStudentProfile();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProgressDots current={2} total={3} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons
            name="person-circle-outline"
            size={56}
            color="#4F46E5"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.description}>
            Here's your account info. Take a look around!
          </Text>

          {/* Profile card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>Name</Text>
                <Text style={styles.cardValue}>{profile?.name || 'Student'}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <Ionicons name="school-outline" size={20} color="#6B7280" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>Grade</Text>
                <Text style={styles.cardValue}>
                  {profile?.grade_level ? `Grade ${profile.grade_level}` : 'Not set'}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>Email</Text>
                <Text style={styles.cardValue}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.explanation}>
            This is your account info. You can update your profile anytime in
            Settings.
          </Text>

          {/* Tip callout */}
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color="#4F46E5" />
            <Text style={styles.tipText}>
              Tip: Check Settings regularly to keep your info up to date!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/how-it-works')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Next</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  headerIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 32,
  },
  explanation: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
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
