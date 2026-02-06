import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

interface RewardCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  detail: string;
}

function RewardCard({ icon, iconColor, title, description, detail }: RewardCardProps) {
  return (
    <View style={styles.rewardCard}>
      <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle}>{title}</Text>
        <Text style={styles.rewardDescription}>{description}</Text>
        <Text style={styles.rewardDetail}>{detail}</Text>
      </View>
    </View>
  );
}

export default function HowItWorksScreen() {
  const { profile } = useStudentProfile();
  const baseAmount = profile?.base_reward_amount
    ? `$${profile.base_reward_amount.toFixed(2)}`
    : '$0.00';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProgressDots current={3} total={3} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons
            name="trophy-outline"
            size={48}
            color="#4F46E5"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>How You Earn</Text>
          <Text style={styles.subtitle}>
            Here's how you can earn rewards every day!
          </Text>

          <RewardCard
            icon="school-outline"
            iconColor="#4F46E5"
            title="Grades"
            description={`Submit your grades and earn rewards! Your parent set ${baseAmount} per grade.`}
            detail="Better grades = bigger rewards"
          />

          <RewardCard
            icon="star-outline"
            iconColor="#F59E0B"
            title="Behavior"
            description="Complete your daily behavior check-in to earn bonus rewards."
            detail="Keep your score above 3.0 to qualify"
          />

          <RewardCard
            icon="bulb-outline"
            iconColor="#10B981"
            title="Question of the Day"
            description="Answer the Question of the Day to build your streak and earn education bonuses."
            detail="Higher accuracy = bigger bonus"
          />

          <RewardCard
            icon="wallet-outline"
            iconColor="#3B82F6"
            title="Smart Savings"
            description="Your earnings are automatically split: Taxes (15%), Retirement (10%), Savings (25%), and Discretionary (50%)."
            detail="Learn real-world money management!"
          />

          <Text style={styles.footer}>
            You've got this! Every day is a chance to earn and learn.
          </Text>
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/celebration')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Got it!</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  rewardDetail: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  footer: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
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
