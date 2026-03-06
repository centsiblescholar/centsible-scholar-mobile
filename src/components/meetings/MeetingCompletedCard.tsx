import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import {
  ChildEvaluation,
  calculateScorePercentage,
  getScoreLabel,
  MAX_TOTAL_SCORE,
  calculateAverageEvaluation,
} from '../../types/family-meeting';

interface Props {
  evaluations: ChildEvaluation[];
  onStartNew: () => void;
}

export function MeetingCompletedCard({ evaluations, onStartNew }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const avg = calculateAverageEvaluation(evaluations);
  const avgPct = avg !== null ? calculateScorePercentage(Math.round(avg)) : null;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Ionicons name="trophy" size={56} color={colors.warning} />
        <Text style={styles.heroTitle}>Meeting Complete!</Text>
        <Text style={styles.heroSubtitle}>Great job finishing your family meeting.</Text>

        {avg !== null && avgPct !== null && (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Average Evaluation</Text>
            <Text style={styles.scoreValue}>
              {avg.toFixed(1)}/{MAX_TOTAL_SCORE}
            </Text>
            <Text style={styles.scoreGrade}>{getScoreLabel(avgPct)}</Text>
          </View>
        )}

        {evaluations.length > 0 && (
          <View style={styles.evalsList}>
            {evaluations.map((evaluation) => (
              <View key={evaluation.id} style={styles.evalItem}>
                <Ionicons name="person" size={16} color={colors.primary} />
                <Text style={styles.evalScore}>
                  Score: {evaluation.total_score}/{MAX_TOTAL_SCORE}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.newMeetingButton} onPress={onStartNew}>
        <Ionicons name="refresh" size={20} color={colors.textInverse} />
        <Text style={styles.newMeetingButtonText}>Start New Meeting</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    heroCard: {
      alignItems: 'center', padding: 32,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      marginBottom: 24,
    },
    heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16 },
    heroSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
    scoreSection: { alignItems: 'center', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, width: '100%' },
    scoreLabel: { fontSize: 13, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '600' },
    scoreValue: { fontSize: 32, fontWeight: '700', color: colors.primary, marginTop: 4 },
    scoreGrade: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
    evalsList: { marginTop: 16, width: '100%', gap: 8 },
    evalItem: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: 12,
    },
    evalScore: { fontSize: 14, color: colors.text, fontWeight: '500' },
    newMeetingButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, padding: 16, borderRadius: 12, minHeight: 52,
    },
    newMeetingButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
}
