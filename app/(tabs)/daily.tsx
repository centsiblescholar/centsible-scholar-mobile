import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useAuth } from '../../src/contexts/AuthContext';
import QODStep from '../../src/components/daily/QODStep';
import BehaviorStep from '../../src/components/daily/BehaviorStep';
import CompletionCelebration from '../../src/components/daily/CompletionCelebration';

type WizardStep = 'qod' | 'behavior' | 'celebration' | 'completed';

export default function DailyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const gradeLevel = profile?.grade_level;

  const { hasAnsweredToday, loading: qodLoading, streakCount } = useQuestionOfTheDay(gradeLevel);
  const { todayAssessment, isLoading: behaviorLoading } = useBehaviorAssessments(user?.id);

  const [step, setStep] = useState<WizardStep>('qod');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Determine starting step based on what's already done today
  useEffect(() => {
    if (qodLoading || behaviorLoading || initialized) return;

    if (hasAnsweredToday && todayAssessment) {
      setStep('completed');
    } else if (hasAnsweredToday && !todayAssessment) {
      setStep('behavior');
    } else {
      setStep('qod');
    }
    setInitialized(true);
  }, [qodLoading, behaviorLoading, hasAnsweredToday, todayAssessment, initialized]);

  // Progress percentage based on step
  const getProgress = () => {
    switch (step) {
      case 'qod':
        return 0;
      case 'behavior':
        return 50;
      case 'celebration':
      case 'completed':
        return 100;
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 'qod':
        return 'Step 1 of 2';
      case 'behavior':
        return 'Step 2 of 2';
      default:
        return '';
    }
  };

  const progress = getProgress();
  const showProgress = step === 'qod' || step === 'behavior';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Header */}
      {showProgress && (
        <View style={styles.progressHeader}>
          <Text style={styles.stepLabel}>{getStepLabel()}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {/* Step Content */}
      {step === 'qod' && (
        <QODStep
          onComplete={(correct) => {
            setWasCorrect(correct);
            setStep('behavior');
          }}
        />
      )}

      {step === 'behavior' && (
        <BehaviorStep onComplete={() => setStep('celebration')} />
      )}

      {step === 'celebration' && (
        <CompletionCelebration
          wasCorrect={wasCorrect}
          onDismiss={() => router.replace('/(tabs)/dashboard')}
        />
      )}

      {step === 'completed' && (
        <View style={styles.completedContainer}>
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.completedTitle}>All done for today!</Text>

            <View style={styles.completedChecklist}>
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.completedRowText}>Question of the Day</Text>
              </View>
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.completedRowText}>Behavior Check-in</Text>
              </View>
            </View>

            {streakCount > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{streakCount} day streak</Text>
              </View>
            )}

            <Text style={styles.completedSubtitle}>Come back tomorrow!</Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/dashboard')}
            >
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Progress Header
  progressHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },

  // Completed view
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
  },
  completedChecklist: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 20,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
  },
  completedRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#166534',
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
