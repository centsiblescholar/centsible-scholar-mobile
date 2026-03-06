import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuestionOfTheDay } from '../src/hooks/useQuestionOfTheDay';
import { useStudentProfile } from '../src/hooks/useStudentProfile';
import { useAuth } from '../src/contexts/AuthContext';
import QODStep from '../src/components/daily/QODStep';
import CompletionCelebration from '../src/components/daily/CompletionCelebration';
import { useTheme, type ThemeColors, tints, financial } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';

type WizardStep = 'qod' | 'celebration' | 'completed';

export default function DailyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useStudentProfile();
  const gradeLevel = profile?.grade_level;

  const { hasAnsweredToday, loading: qodLoading, streakCount } = useQuestionOfTheDay(gradeLevel);

  const [step, setStep] = useState<WizardStep>('qod');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (qodLoading || initialized) return;
    if (hasAnsweredToday) { setStep('completed'); }
    else { setStep('qod'); }
    setInitialized(true);
  }, [qodLoading, hasAnsweredToday, initialized]);

  if (qodLoading && !initialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletonContainer}>
          <SkeletonList count={3} cardHeight={100} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {step === 'qod' && (<QODStep onComplete={(correct) => { setWasCorrect(correct); setStep('celebration'); }} />)}
      {step === 'celebration' && (<CompletionCelebration wasCorrect={wasCorrect} onDismiss={() => router.replace('/(tabs)/dashboard')} />)}
      {step === 'completed' && (
        <View style={styles.completedContainer}>
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.completedTitle}>All done for today!</Text>
            <View style={styles.completedChecklist}>
              <View style={styles.completedRow}><Ionicons name="checkmark-circle" size={20} color={colors.success} /><Text style={styles.completedRowText}>Question of the Day</Text></View>
            </View>
            {streakCount > 0 && (<View style={styles.streakBadge}><Text style={styles.streakText}>{streakCount} day streak</Text></View>)}
            <Text style={styles.completedSubtitle}>Come back tomorrow!</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/dashboard')}>
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  skeletonContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  completedCard: { backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  completedTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 24 },
  completedChecklist: { alignSelf: 'stretch', gap: 12, marginBottom: 20 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tints.green, padding: 12, borderRadius: 10, minHeight: 44 },
  completedRowText: { fontSize: 15, fontWeight: '500', color: financial[800] },
  streakBadge: { backgroundColor: tints.amber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
  streakText: { fontSize: 14, fontWeight: '600', color: '#B45309' },
  completedSubtitle: { fontSize: 14, color: colors.textTertiary, marginBottom: 24 },
  backButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  backButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
});
