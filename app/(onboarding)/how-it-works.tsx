import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useTheme, type ThemeColors } from '@/theme';

function ProgressDots({ current, total, colors }: { current: number; total: number; colors: ThemeColors }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            { backgroundColor: i < current ? colors.primary : colors.inputBorder },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
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
});

interface RewardCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  detail: string;
  colors: ThemeColors;
}

function RewardCard({ icon, iconColor, title, description, detail, colors }: RewardCardProps) {
  return (
    <View style={[rewardCardStyles.card, { backgroundColor: colors.card, borderColor: colors.backgroundTertiary }]}>
      <View style={[rewardCardStyles.iconCircle, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={rewardCardStyles.info}>
        <Text style={[rewardCardStyles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[rewardCardStyles.description, { color: colors.textSecondary }]}>{description}</Text>
        <Text style={[rewardCardStyles.detail, { color: colors.primary }]}>{detail}</Text>
      </View>
    </View>
  );
}

const rewardCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default function HowItWorksScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useStudentProfile();
  const baseAmount = profile?.base_reward_amount
    ? `$${profile.base_reward_amount.toFixed(2)}`
    : '$0.00';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProgressDots current={3} total={3} colors={colors} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons
            name="trophy-outline"
            size={48}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>How You Earn</Text>
          <Text style={styles.subtitle}>
            Here's how you can earn rewards every day!
          </Text>

          <RewardCard
            icon="school-outline"
            iconColor={colors.primary}
            title="Grades"
            description={`Submit your grades and earn rewards! Your parent set ${baseAmount} per grade.`}
            detail="Better grades = bigger rewards"
            colors={colors}
          />

          <RewardCard
            icon="star-outline"
            iconColor={colors.warning}
            title="Behavior"
            description="Complete your daily behavior check-in to earn bonus rewards."
            detail="Keep your score above 3.0 to qualify"
            colors={colors}
          />

          <RewardCard
            icon="bulb-outline"
            iconColor={colors.success}
            title="Question of the Day"
            description="Answer the Question of the Day to build your streak and earn education bonuses."
            detail="Higher accuracy = bigger bonus"
            colors={colors}
          />

          <RewardCard
            icon="wallet-outline"
            iconColor={colors.info}
            title="Smart Savings"
            description="Your earnings are automatically split: Taxes (15%), Retirement (10%), Savings (25%), and Discretionary (50%)."
            detail="Learn real-world money management!"
            colors={colors}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 24,
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
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    footer: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
